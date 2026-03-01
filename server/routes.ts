import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import bcrypt from "bcryptjs";
import { db } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}

function generateQrCode(userId: number, email: string): string {
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

      const tempId = Date.now();
      const qrCode = generateQrCode(tempId, email);

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
      });

      await db.updateUser(user.id, { qr_code: generateQrCode(user.id, email) });

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
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
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
    const { id } = req.params;
    const updated = await db.updateUser(parseInt(id), req.body);
    if (!updated) return res.status(404).json({ message: "Utilizador não encontrado" });
    const { password: _p, ...safe } = updated;
    return res.json(safe);
  });

  app.get("/api/stats", requireAuth, async (req: Request, res: Response) => {
    const stats = await db.getUserStats();
    return res.json(stats);
  });

  app.get("/api/stats/financial", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const stats = await db.getFinancialStats();
    return res.json(stats);
  });

  app.get("/api/submissions", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Não autenticado" });
    if (me.role === "participant") {
      const subs = await db.getSubmissionsByUser(me.id);
      return res.json(subs);
    }
    const subs = await db.getAllSubmissions();
    return res.json(subs);
  });

  app.get("/api/submissions/:id", requireAuth, async (req: Request, res: Response) => {
    const sub = await db.getSubmissionById(parseInt(req.params.id));
    if (!sub) return res.status(404).json({ message: "Submissão não encontrada" });
    return res.json(sub);
  });

  app.post("/api/submissions", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const { title, abstract, keywords, thematic_axis } = req.body;
      if (!title || !thematic_axis) {
        return res.status(400).json({ message: "Título e eixo temático são obrigatórios" });
      }
      let fileUri, fileName;
      if (req.file) {
        const ext = path.extname(req.file.originalname);
        const newName = `${req.file.filename}${ext}`;
        const newPath = path.join(uploadDir, newName);
        fs.renameSync(req.file.path, newPath);
        fileUri = `/uploads/${newName}`;
        fileName = req.file.originalname;
      }
      const sub = await db.createSubmission({
        user_id: req.session.userId!,
        title,
        abstract: abstract || undefined,
        keywords: keywords || undefined,
        file_uri: fileUri,
        file_name: fileName,
        thematic_axis: parseInt(thematic_axis),
      });
      return res.json(sub);
    } catch (error) {
      console.error("Submission error:", error);
      return res.status(500).json({ message: "Erro ao submeter" });
    }
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
    const sub = await db.reviewSubmission(parseInt(req.params.id), me.id, status, note);
    if (!sub) return res.status(404).json({ message: "Submissão não encontrada" });

    if (status === "approved") {
      const author = await db.getUserById(sub.user_id);
      if (author) {
        await db.updateUser(author.id, { payment_status: "approved" });
      }
    }
    return res.json(sub);
  });

  app.get("/api/messages/:otherUserId", requireAuth, async (req: Request, res: Response) => {
    const msgs = await db.getMessages(req.session.userId!, parseInt(req.params.otherUserId));
    await db.markMessagesRead(parseInt(req.params.otherUserId), req.session.userId!);
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
      recipient_id: parseInt(req.params.otherUserId),
      content,
      submission_id,
    });
    return res.json(msg);
  });

  app.post("/api/scanner/checkin", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const { qr_code } = req.body;
    const user = await db.getUserByQrCode(qr_code);
    if (!user) return res.status(404).json({ message: "Código QR não encontrado" });
    if (user.is_checked_in) {
      return res.json({ user, already_checked_in: true });
    }
    const updated = await db.checkInUser(user.id);
    return res.json({ user: updated, already_checked_in: false });
  });

  app.post("/api/users/:id/payment", requireAuth, async (req: Request, res: Response) => {
    const me = await db.getUserById(req.session.userId!);
    if (!me || me.role !== "admin") return res.status(403).json({ message: "Sem permissão" });
    const updated = await db.updateUser(parseInt(req.params.id), { payment_status: "paid" });
    if (!updated) return res.status(404).json({ message: "Utilizador não encontrado" });
    const { password: _p, ...safe } = updated;
    return res.json(safe);
  });

  const httpServer = createServer(app);
  return httpServer;
}
