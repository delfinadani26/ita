import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * 🔐 Serviço de Autenticação 100% Supabase
 * Substitui o Express server completamente
 */
export const authService = {
  /**
   * Registar novo participante
   */
  async register(data: {
    full_name: string;
    email: string;
    password: string;
    academic_degree?: string;
    category: string;
    affiliation: string;
    institution?: string;
    role?: string;
  }) {
    try {
      const { data: result, error } = await supabase.rpc("register_participant", {
        p_full_name: data.full_name,
        p_email: data.email,
        p_password: data.password,
        p_academic_degree: data.academic_degree || null,
        p_category: data.category,
        p_affiliation: data.affiliation,
        p_institution: data.institution || null,
        p_role: data.role || "participant",
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao registar utilizador");
    }
  },

  /**
   * Login com email e senha
   */
  async login(email: string, password: string) {
    try {
      const { data: result, error } = await supabase.rpc("login_user", {
        p_email: email.toLowerCase(),
        p_password: password,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login");
    }
  },

  /**
   * Buscar usuário por ID
   */
  async getUserById(userId: number) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao buscar usuário");
    }
  },

  /**
   * Atualizar dados do usuário
   */
  async updateUser(userId: number, updates: Record<string, any>) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao atualizar usuário");
    }
  },
};

/**
 * 👨‍💼 Serviço Admin
 */
export const adminService = {
  /**
   * Listar participantes com filtros
   */
  async getParticipants(page: number = 1, limit: number = 10, status?: string) {
    try {
      const { data: result, error } = await supabase.rpc("get_participants", {
        p_page: page,
        p_limit: limit,
        p_status: status || null,
      });

      if (error) throw new Error(error.message);
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao buscar participantes");
    }
  },

  /**
   * Aprovar participante
   */
  async approveParticipant(userId: number) {
    try {
      const { data: result, error } = await supabase.rpc("approve_participant", {
        p_user_id: userId,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao aprovar participante");
    }
  },

  /**
   * Rejeitar participante
   */
  async rejectParticipant(userId: number, reason: string = "Não cumprimento dos critérios de elegibilidade") {
    try {
      const { data: result, error } = await supabase.rpc("reject_participant", {
        p_user_id: userId,
        p_reason: reason,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao rejeitar participante");
    }
  },

  /**
   * Marcar como pago
   */
  async markAsPaid(userId: number) {
    try {
      const { data: result, error } = await supabase.rpc("mark_as_paid", {
        p_user_id: userId,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao marcar como pago");
    }
  },

  /**
   * Promover usuário para administrador
   */
  async promoteToAdmin(userId: number) {
    try {
      const { data: result, error } = await supabase.rpc("promote_to_admin", {
        p_user_id: userId,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao promover administrador");
    }
  },

  /**
   * Remover privilégio de administrador
   */
  async demoteFromAdmin(userId: number) {
    try {
      const { data: result, error } = await supabase.rpc("demote_from_admin", {
        p_user_id: userId,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao remover privilégios de administrador");
    }
  },

  /**
   * Atualizar permissões de um admin
   */
  async updateAdminPermissions(adminId: number, permissions: Record<string, boolean>) {
    try {
      const { data: result, error } = await supabase.rpc("update_admin_permissions", {
        p_admin_id: adminId,
        p_permissions: permissions,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao atualizar permissões");
    }
  },

  /**
   * Obter permissões de um admin
   */
  async getAdminPermissions(adminId: number) {
    try {
      const { data: result, error } = await supabase.rpc("get_admin_permissions", {
        p_admin_id: adminId,
      });

      if (error) throw new Error(error.message);
      return result || {};
    } catch (error: any) {
      throw new Error(error.message || "Erro ao buscar permissões");
    }
  },

  /**
   * Verificar se admin tem permissão específica
   */
  async checkPermission(adminId: number, permission: string): Promise<boolean> {
    try {
      const { data: result, error } = await supabase.rpc("has_permission", {
        p_admin_id: adminId,
        p_permission: permission,
      });

      if (error) throw new Error(error.message);
      return result || false;
    } catch (error: any) {
      return false;
    }
  },
};

/**
 * 🔍 Serviço de Check-in
 */
export const checkInService = {
  /**
   * Check-in via QR Code
   */
  async checkIn(qrCode: string) {
    try {
      const { data: result, error } = await supabase.rpc("check_in_user", {
        p_qr_code: qrCode,
      });

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer check-in");
    }
  },
};

/**
 * 💬 Serviço de Mensagens
 */
export const messageService = {
  /**
   * Enviar mensagem
   */
  async sendMessage(senderId: number, recipientId: number, content: string, submissionId?: number) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content,
          submission_id: submissionId,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao enviar mensagem");
    }
  },

  /**
   * Buscar conversas
   */
  async getConversation(userId: number, otherUserId: number) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      throw new Error(error.message || "Erro ao buscar conversas");
    }
  },

  /**
   * Marcar mensagem como lida
   */
  async markAsRead(messageId: number) {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw new Error(error.message);
    } catch (error: any) {
      throw new Error(error.message || "Erro ao marcar mensagem como lida");
    }
  },
};

/**
 * 📋 Serviço de Submissões
 */
export const submissionService = {
  /**
   * Listar submissões
   */
  async getSubmissions(userId?: number) {
    try {
      let query = supabase.from("submissions").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.order("submitted_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      throw new Error(error.message || "Erro ao buscar submissões");
    }
  },

  /**
   * Enviar submissão
   */
  async submitWork(data: {
    user_id: number;
    title: string;
    abstract: string;
    keywords: string;
    thematic_axis: number;
    file_uri?: string;
    file_name?: string;
  }) {
    try {
      const { data: result, error } = await supabase
        .from("submissions")
        .insert({
          ...data,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao enviar submissão");
    }
  },

  /**
   * Avaliar submissão
   */
  async reviewSubmission(
    submissionId: number,
    status: "approved" | "rejected",
    reviewNote: string,
    reviewerId: number
  ) {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .update({
          status,
          review_note: reviewNote,
          reviewer_id: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao avaliar submissão");
    }
  },
};

export default supabase;
