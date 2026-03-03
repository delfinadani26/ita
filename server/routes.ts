import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import bcrypt from "bcryptjs";
import { firebaseDb as db } from "./storage-firebase";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendApprovalEmail, sendRejectionEmail, sendPaymentConfirmationEmail } from "./email-service";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowed.includes(ext)) {
      console.error(`❌ Arquivo rejeitado: tipo não permitido (${ext}). Tipos aceitos: ${allowed.join(", ")}`);
      return cb(new Error(`Tipo de arquivo não permitido: ${ext}. Tipos aceitos: PDF, DOC, DOCX`));
    }
    
    console.log(`✅ Arquivo aceito: ${file.originalname} (${ext})`);
    cb(null, true);
  },
});

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}

function generateQrCode(userId: string, email: string): string {
  return `URNM-${userId}-${email.split("@")[0].toUpperCase()}-${Date.now()}`;
}

function getPaymentAmount(category: string, affiliation: string, role: string): number {
  if (role === "preletor") return 20000;
  const prices: Record<string, number> = {
    "docente_urnm": 5000,
    "docente_externo": 7000,
    "estudante_urnm": 3000,
    "estudante_externo": 4000,
    "outro_urnm": 5000,
    "outro_externo": 10000,
  };
  return prices[`${category}_${affiliation}`] || 5000;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "urnm-congress-secret-key-2026",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });
  app.use("/uploads", express.static(uploadDir));

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { full_name, email, password, academic_degree, category, affiliation, institution, role } = req.body;
      if (!full_name || !email || !password || !category || !affiliation) {
        return res.status(400).json({ message: "Campos obrigatórios em falta" });
      }
      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email já registado" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const userRole = role && ["avaliador", "admin"].includes(role) ? role : "participant";
      const paymentAmount = getPaymentAmount(category, affiliation, userRole === "preletor" ? "preletor" : category);

      const qrCode = generateQrCode(String(Date.now()), email);

      const user = await db.createUser({
        full_name,
        email,
        password: hashed,
        academic_degree,
        category,
        affiliation,
        institution,
        role: userRole,
        qr_code: qrCode,
        payment_status: "pending",
        payment_amount: paymentAmount,
        is_checked_in: false,
      });

      await db.updateUser(user.id!, { qr_code: generateQrCode(user.id || "", email) });

      req.session.userId = user.id;
      const { password: _p, ...safe } = user;
      return res.json(safe);
    } catch (error: any) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Erro ao registar utilizador" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email ou palavra-passe incorretos" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Email ou palavra-passe incorretos" });
      }

      // ✅ VERIFICAÇÃO: Bloquear usuários com status "pending"
      if (user.payment_status === "pending" && user.role === "participant") {
        return res.status(403).json({ 
          message: "Sua inscrição aguarda aprovação do administrador. Receberá um email com as próximas instruções.",
          status: "pending_approval",
          user_email: user.email
        });
      }

      req.session.userId = user.id;
      const { password: _p, ...safe } = user;
      return res.json(safe);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Erro ao iniciar sessão" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Sessão terminada" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = await db.getUserById(req.session.userId!);
    if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });
    const { password: _p, ...safe } = user;
    return res.json(safe);
  });

  app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const users = await db.getAllUsers();
    return res.json(users.map(u => { const { password: _p, ...s } = u; return s; }));
  });

  app.put("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const { id } = req.params as { id: string };
    const updated = await db.updateUser(id, req.body);
    if (!updated) return res.status(404).json({ message: "Utilizador não encontrado" });
    const { password: _p, ...safe } = updated;
    return res.json(safe);
  });

  app.get("/api/stats", requireAuth, async (req: Request, res: Response) => {
    const stats = await db.getUserStats();
    return res.json(stats);
  });

  app.get("/api/public/stats", async (req: Request, res: Response) => {
    try {
      console.log("📊 Fetching public stats...");
      
      // Add timeout de 5 segundos para query
      const statsPromise = db.getUserStats();
      const totalPromise = db.getTotalParticipants();
      
      const [stats, total] = await Promise.all([statsPromise, totalPromise]);
      
      const result = { ...stats, _total: total };
      console.log("✅ Public stats returned:", result);
      return res.json(result);
    } catch (error: any) {
      console.error("❌ Public stats error:", error.message);
      return res.status(500).json({ error: error.message || "Database error" });
    }
  });

  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      const result = await db.getAllUsers();
      const participantCount = result.filter(u => u.role === "participant").length;
      const roleBreakdown: Record<string, number> = {};
      const categoryBreakdown: Record<string, number> = {};
      
      for (const user of result) {
        roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
        if (user.role === "participant") {
          categoryBreakdown[`${user.category}_${user.affiliation}`] = (categoryBreakdown[`${user.category}_${user.affiliation}`] || 0) + 1;
        }
      }
      
      return res.json({
        totalUsers: result.length,
        participantCount,
        roleBreakdown,
        categoryBreakdown,
        sample: result.slice(0, 3).map(u => ({ 
          id: u.id, 
          name: u.full_name, 
          role: u.role, 
          category: u.category, 
          affiliation: u.affiliation 
        }))
      });
    } catch (error: any) {
      console.error("Debug error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/debug/create-test-participant", async (req: Request, res: Response) => {
    try {
      const testUser = {
        full_name: `Test Participant ${Date.now()}`,
        email: `test-${Date.now()}@test.com`,
        password: await require("bcryptjs").hash("password123", 10),
        academic_degree: "Licenciado",
        category: "estudante" as const,
        affiliation: "urnm" as const,
        institution: "URNM",
        role: "participant" as const,
        qr_code: `TEST-${Date.now()}`,
        payment_status: "pending" as const,
        payment_amount: 3000,
        is_checked_in: false,
      };
      
      const created = await db.createUser(testUser);
      const stats = await db.getUserStats();
      
      return res.json({
        message: "Test participant created",
        user: { id: created.id, email: created.email, role: created.role },
        stats
      });
    } catch (error: any) {
      console.error("Test participant error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/check/raw-sql", async (req: Request, res: Response) => {
    try {
      const allUsers = await db.getAllUsers();
      const participants = allUsers.filter(u => u.role === "participant");
      
      const roleBreakdown: Record<string, number> = {};
      const categoryBreakdown: Record<string, number> = {};
      
      for (const user of allUsers) {
        roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
      }
      
      for (const user of participants) {
        const key = `${user.category}_${user.affiliation}`;
        categoryBreakdown[key] = (categoryBreakdown[key] || 0) + 1;
      }
      
      return res.json({
        totalUsers: allUsers.length,
        totalParticipants: participants.length,
        byRole: roleBreakdown,
        byCategory: categoryBreakdown,
        sampleParticipants: participants.slice(0, 3).map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          category: u.category,
          affiliation: u.affiliation,
          paymentStatus: u.payment_status
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("SQL check error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/stats", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "server/templates/stats.html"));
  });

  app.get("/api/stats/financial", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const stats = await db.getFinancialStats();
    return res.json(stats);
  });

  // ✅ ENDPOINT: Contar participantes registrados por categoria (sem autenticação)
  app.get("/api/stats/participants", async (req: Request, res: Response) => {
    const stats = await db.getParticipantStats();
    return res.json(stats);
  });

  app.get("/api/submissions", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Não autenticado" });
    if (me.role === "participant") {
      const subs = await db.getSubmissionsByUser(me.id!);
      return res.json(subs);
    }
    const subs = await db.getAllSubmissions();
    return res.json(subs);
  });

  app.get("/api/submissions/:id", requireAuth, async (req: Request, res: Response) => {
    const sub = await db.getSubmissionById(req.params.id as string);
    if (!sub) return res.status(404).json({ message: "Submissão não encontrada" });
    return res.json(sub);
  });

  app.post("/api/submissions", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const { title, abstract, keywords, thematic_axis } = req.body;
      
      console.log("\n📝 ========== NOVA SUBMISSÃO ==========");
      console.log(`👤 User ID: ${userId}`);
      console.log(`📌 Título: ${title}`);
      console.log(`📋 Eixo: ${thematic_axis}`);
      console.log(`📎 Arquivo: ${req.file ? `SIM (${req.file.originalname}, ${(req.file.size / 1024).toFixed(2)}KB)` : "NÃO"}`);

      if (!title || !thematic_axis) {
        console.error("❌ Erro: Campos obrigatórios ausentes");
        return res.status(400).json({ message: "Título e eixo temático são obrigatórios" });
      }

      let fileUri = undefined;
      let fileName = undefined;
      
      if (req.file) {
        try {
          const ext = path.extname(req.file.originalname);
          const newName = `${req.file.filename}${ext}`;
          const newPath = path.join(uploadDir, newName);
          
          // Renomear arquivo temporário
          fs.renameSync(req.file.path, newPath);
          
          fileUri = `/uploads/${newName}`;
          fileName = req.file.originalname;
          
          console.log(`✅ Arquivo salvo: ${fileUri} (${(fs.statSync(newPath).size / 1024).toFixed(2)}KB)`);
        } catch (fileErr: any) {
          console.error(`❌ Erro ao salvar arquivo:`, fileErr.message);
          throw new Error(`Erro ao processar arquivo: ${fileErr.message}`);
        }
      }

      // Criar submissão no banco
      const sub = await db.createSubmission({
        user_id: userId!,
        title: title.trim(),
        abstract: abstract?.trim() || undefined,
        keywords: keywords?.trim() || undefined,
        file_uri: fileUri,
        file_name: fileName,
        thematic_axis: parseInt(thematic_axis),
        status: "pending",
      });
      
      console.log(`✅ Submissão criada com ID: ${sub.id}`);
      console.log("===================================\n");
      
      return res.json(sub);
    } catch (error: any) {
      console.error(`❌ Erro na submissão: ${error.message}`);
      console.error(error.stack);
      
      return res.status(500).json({ 
        message: error.message || "Erro ao submeter apresentação",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // Middleware de erro GLOBAL para multer e outros erros
  app.use((err: any, req: Request, res: Response, next: Function) => {
    console.error("\n🔴 ========== ERROR HANDLER ==========");
    console.error(`Erro tipo: ${err?.constructor?.name}`);
    console.error(`Mensagem: ${err?.message}`);
    
    // Multer errors (file too large, etc)
    if (err instanceof multer.MulterError) {
      console.error(`❌ Multer error: ${err.code} - ${err.message}`);
      
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ 
          message: "Ficheiro excede o limite de 10MB",
          code: "FILE_TOO_LARGE"
        });
      }
      
      if (err.code === "LIMIT_PART_COUNT" || err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ 
          message: "Número máximo de ficheiros excedido",
          code: err.code
        });
      }
      
      return res.status(400).json({ 
        message: `Erro no upload: ${err.message}`,
        code: err.code
      });
    }
    
    // Custom file filter errors
    if (err && err.message && err.message.includes("Tipo de arquivo")) {
      console.error(`❌ Arquivo rejeitado: ${err.message}`);
      return res.status(400).json({ 
        message: err.message,
        code: "INVALID_FILE_TYPE"
      });
    }
    
    // Unknown errors
    console.error(`❌ Unknown error:`, err);
    console.error("====================================\n");
    
    return res.status(500).json({ 
      message: err?.message || "Erro interno do servidor",
      code: "INTERNAL_ERROR"
    });
  });

  app.put("/api/submissions/:id/review", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || !["admin", "avaliador"].includes(me.role)) {
      return res.status(403).json({ message: "Sem permissão" });
    }
    const { status, note } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    const sub = await db.reviewSubmission(req.params.id as string, me.id!, status, note);
    if (!sub) return res.status(404).json({ message: "Submissão não encontrada" });

    if (status === "approved") {
      const author = await db.getUserById(sub.user_id);
      if (author) {
        await db.updateUser(author.id!, { payment_status: "approved" });
      }
    }
    return res.json(sub);
  });

  app.get("/api/messages/:otherUserId", requireAuth, async (req: Request, res: Response) => {
    const msgs = await db.getMessages(req.session.userId!, req.params.otherUserId as string);
    await db.markMessagesRead(req.params.otherUserId as string, req.session.userId!);
    return res.json(msgs);
  });

  app.get("/api/messages", requireAuth, async (req: Request, res: Response) => {
    const threads = await db.getMessageThreads(req.session.userId!);
    return res.json(threads);
  });

  app.post("/api/messages/:otherUserId", requireAuth, async (req: Request, res: Response) => {
    const { content, submission_id } = req.body;
    if (!content) return res.status(400).json({ message: "Conteúdo obrigatório" });
    const msg = await db.createMessage({
      sender_id: req.session.userId!,
      recipient_id: req.params.otherUserId as string,
      content,
      submission_id,
      is_read: false,
    });
    return res.json(msg);
  });

  app.post("/api/scanner/checkin", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    
    const { qr_code } = req.body;
    const user = await db.getUserByQrCode(qr_code);
    if (!user) return res.status(404).json({ message: "Código QR não encontrado" });
    
    // ✅ VALIDAÇÃO 1: Só pode fazer check-in se foi APROVADO ou PAGOU
    if (user.payment_status === "pending") {
      return res.status(403).json({ 
        message: "Participante ainda não foi aprovado",
        user,
        can_checkin: false,
        reason: "pending_approval"
      });
    }
    
    // ✅ VALIDAÇÃO 2: Permite check-in se approved, paid, ou exempt
    if (!["approved", "paid", "exempt"].includes(user.payment_status)) {
      return res.status(403).json({ 
        message: "Participante com status inválido para check-in",
        user,
        can_checkin: false,
        reason: "invalid_status"
      });
    }
    
    // ✅ Check-in já feito anteriormente
    if (user.is_checked_in) {
      return res.json({ user, already_checked_in: true });
    }
    
    // ✅ Registrar check-in
    const updated = await db.checkInUser(user.id!);
    return res.json({ user: updated, already_checked_in: false });
  });

  app.post("/api/users/:id/payment", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const updated = await db.updateUser(req.params.id as string, { payment_status: "paid" });
    if (!updated) return res.status(404).json({ message: "Utilizador não encontrado" });
    const { password: _p, ...safe } = updated;
    return res.json(safe);
  });

  // ✅ ENDPOINT: Aprovar participante
  app.put("/api/users/:id/approve", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    
    const userId = req.params.id as string;
    const user = await db.getUserById(userId);
    if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });
    
    const updated = await db.updateUser(userId, { 
      payment_status: "approved"
    });
    
    if (updated) {
      // 📧 Enviar email de aprovação
      await sendApprovalEmail(user.full_name, user.email, user.category, user.institution);
    }
    
    if (!updated) return res.status(404).json({ message: "Erro ao atualizar utilizador" });
    const { password: _p, ...safe } = updated;
    return res.json(safe);
  });

  // ❌ ENDPOINT: Rejeitar participante (DESATIVADO - usar payment_status outros valores)
  /*
  app.put("/api/users/:id/reject", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    
    const userId = req.params.id;
    const user = await db.getUserById(userId);
    if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });
    
    const { reason = "Não cumprimento dos critérios de elegibilidade" } = req.body;
    const updated = await db.updateUser(userId, { 
      payment_status: "pending"
    });
    
    if (updated) {
      // 📧 Enviar email de rejeição
      await sendRejectionEmail(user.full_name, user.email, reason);
    }
    
    if (!updated) return res.status(404).json({ message: "Erro ao atualizar utilizador" });
    const { password: _p, ...safe } = updated;
    return res.json(safe);
  });
  */

  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      const result = await db.getAllUsers();
      res.json({
        total: result.length,
        users: result.map(u => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          payment_status: u.payment_status,
          created_at: u.created_at
        }))
      });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar usuários", error: error.message });
    }
  });

  // 📄 ENDPOINT: Listar participantes com paginação
  app.get("/api/users/participants", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    
    const page = Math.max(1, parseInt(Array.isArray(req.query.page) ? (req.query.page[0] as string) : (req.query.page as string)) || 1);
    const limit = Math.min(50, parseInt(Array.isArray(req.query.limit) ? (req.query.limit[0] as string) : (req.query.limit as string)) || 10);
    const status = Array.isArray(req.query.status) ? (req.query.status[0] as string) : (req.query.status as string | undefined);
    
    const result = await db.getParticipants(page, limit, status);
    
    return res.json({
      data: result.users,
      pagination: {
        page,
        limit,
        total: result.pagination.total,
        pages: Math.ceil(result.pagination.total / limit)
      }
    });
  });

  app.get("/api/program", requireAuth, async (req: Request, res: Response) => {
    const program = await db.getProgram();
    return res.json(program);
  });

  app.patch("/api/program/:id/toggle", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const updated = await db.toggleProgramItem(req.params.id as string);
    if (!updated) return res.status(404).json({ message: "Item não encontrado" });
    return res.json(updated);
  });

  // ✅ ENDPOINT: Teste de upload para diagnóstico
  app.post("/api/test/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      console.log("\n🧪 ========== TESTE DE UPLOAD ==========");
      console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`Body:`, JSON.stringify(req.body));
      console.log(`File:`, req.file ? { 
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        encoding: req.file.encoding,
        path: req.file.path,
      } : "nenhum");
      
      if (req.file) {
        const ext = path.extname(req.file.originalname);
        const newName = `test-${req.file.filename}${ext}`;
        const newPath = path.join(uploadDir, newName);
        fs.renameSync(req.file.path, newPath);
        
        return res.json({
          success: true,
          message: "Upload de teste bem-sucedido",
          file: {
            name: newName,
            size: fs.statSync(newPath).size,
            path: `/uploads/${newName}`
          }
        });
      }
      
      return res.status(400).json({ success: false, message: "Nenhum arquivo enviado" });
    } catch (err: any) {
      console.error(`❌ Erro no teste:`, err.message);
      return res.status(500).json({ 
        success: false, 
        message: err.message,
        type: err.constructor.name
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
