import { AuthUser } from "@/contexts/AuthContext";

export interface AccessPermission {
  canViewProgram: boolean;
  canViewMessages: boolean;
  canViewCheckIn: boolean;
  canViewQR: boolean;
  canViewSubmissions: boolean;
  isApproved: boolean;
  pendingApprovalMessage: string;
}

/**
 * Verifica permissões de acesso baseado no status de pagamento
 * payment_status: "pending" | "approved" | "paid" | "exempt"
 */
export function useAccessControl(user: AuthUser | null): AccessPermission {
  if (!user) {
    return {
      canViewProgram: false,
      canViewMessages: false,
      canViewCheckIn: false,
      canViewQR: false,
      canViewSubmissions: false,
      isApproved: false,
      pendingApprovalMessage: "Por favor, faça login",
    };
  }

  // Admin e avaliadores têm acesso total
  if (user.role === "admin" || user.role === "avaliador") {
    return {
      canViewProgram: true,
      canViewMessages: true,
      canViewCheckIn: true,
      canViewQR: true,
      canViewSubmissions: true,
      isApproved: true,
      pendingApprovalMessage: "",
    };
  }

  // Participante pendente de aprovação
  const isApproved = user.payment_status !== "pending";

  return {
    canViewProgram: isApproved,
    canViewMessages: isApproved,
    canViewCheckIn: isApproved,
    canViewQR: isApproved,
    canViewSubmissions: isApproved,
    isApproved,
    pendingApprovalMessage: isApproved
      ? ""
      : "Sua inscrição está aguardando aprovação. Voltaremos em breve com mais informações.",
  };
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Aguardando Aprovação",
    approved: "Aprovado",
    paid: "Pago",
    exempt: "Isento",
  };
  return labels[status] || status;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#F39C12",      // warning orange
    approved: "#3498DB",     // info blue
    paid: "#2ECC71",         // success green
    exempt: "#6B7280",       // gray
  };
  return colors[status] || "#0A2040";
}
