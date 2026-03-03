/**
 * 🔍 SERVIÇO DE VALIDAÇÃO CENTRALIZADO
 * 
 * ❌ SUPABASE: DESATIVADO - Migrado para Firebase Firestore
 * 
 * Padrão: SEMPRE verificar na BD ANTES de qualquer operação
 * - SELECT → verificar se existe
 * - INSERT → verificar constraints (ex: email único, recipient existe)
 * - UPDATE → verificar se existe + validar novo estado
 * - DELETE → verificar se existe + verificar se pode ser deletado
 * 
 * Este arquivo foi mantido como referência histórica
 * Para usar Firebase, veja: server/storage-firebase.ts
 */

/*
import { supabase } from "@/lib/supabase";

// ============================================
// 1️⃣ VALIDAÇÕES DE UTILIZADOR
// ============================================

export async function validateUserExists(userId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function validateEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function validateUserByEmail(email: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ============================================
// 2️⃣ VALIDAÇÕES DE PROGRAMA
// ============================================

export async function validateProgramExists(programId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("congress_program")
      .select("id")
      .eq("id", programId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function getProgramData(programId: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("congress_program")
      .select("*")
      .eq("id", programId)
      .single();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ============================================
// 3️⃣ VALIDAÇÕES DE SUBMISSÃO
// ============================================

export async function validateSubmissionExists(submissionId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("id")
      .eq("id", submissionId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function getSubmissionData(submissionId: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// Verifica se utilizador é proprietário da submissão
export async function validateSubmissionOwnership(submissionId: number, userId: number): Promise<boolean> {
  try {
    const submission = await getSubmissionData(submissionId);
    if (!submission) return false;
    return submission.user_id === userId;
  } catch {
    return false;
  }
}

// ============================================
// 4️⃣ VALIDAÇÕES DE MENSAGEM
// ============================================

export async function validateMessageExists(messageId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// Valida se pode enviar mensagem (recipient existe)
export async function validateCanSendMessage(senderId: number, recipientId: number): Promise<{ valid: boolean; error?: string }> {
  try {
    // Verifica se sender existe
    const senderExists = await validateUserExists(senderId);
    if (!senderExists) {
      return { valid: false, error: "Utilizador remetente não encontrado." };
    }

    // Verifica se recipient existe
    const recipientExists = await validateUserExists(recipientId);
    if (!recipientExists) {
      return { valid: false, error: "Utilizador destinatário não encontrado." };
    }

    // Verifica se não é enviando para si mesmo
    if (senderId === recipientId) {
      return { valid: false, error: "Não pode enviar mensagens para si mesmo." };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// ============================================
// 5️⃣ VALIDAÇÕES GENÉRICAS
// ============================================

export async function validateUnique(
  table: string,
  column: string,
  value: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, value)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function recordExists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, value)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function getRecord(
  table: string,
  column: string,
  value: any
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, value)
      .single();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
 */

// ✅ FIREBASE: ATIVO
// Funções stub para manter compatibilidade com Firebase
export async function validateUserExists(userId: number | string): Promise<boolean> {
  return false; // Implementar com Firebase quando necessário
}

export async function validateEmailExists(email: string): Promise<boolean> {
  return false;
}

export async function validateUserByEmail(email: string): Promise<any | null> {
  return null;
}

export async function validateProgramExists(programId: number): Promise<boolean> {
  return false;
}

export async function getProgramData(programId: number): Promise<any | null> {
  return null;
}

export async function validateSubmissionExists(submissionId: number): Promise<boolean> {
  return false;
}

export async function getSubmissionData(submissionId: number): Promise<any | null> {
  return null;
}

export async function validateSubmissionOwnership(submissionId: number, userId: number): Promise<boolean> {
  return false;
}

export async function validateMessageExists(messageId: number): Promise<boolean> {
  return false;
}

export async function validateCanSendMessage(senderId: number, recipientId: number): Promise<{ valid: boolean; error?: string }> {
  return { valid: false, error: "Firebase não habilitado neste arquivo" };
}

export async function validateUnique(
  table: string,
  column: string,
  value: string
): Promise<boolean> {
  return false;
}

export async function recordExists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  return false;
}

export async function getRecord(
  table: string,
  column: string,
  value: any
): Promise<any | null> {
  return null;
}

// ============================================
// 6️⃣ MENSAGENS DE ERRO TRADUZIDAS
// ============================================

export const ErrorMessages = {
  // Registro
  EMAIL_EXISTS: "Este email já está registado. Faça login ou use outro email.",
  USER_NOT_FOUND: "Utilizador não encontrado.",
  INVALID_CREDENTIALS: "Email ou palavra-passe incorretos.",
  
  // Programa
  PROGRAM_NOT_FOUND: "Programa não encontrado.",
  PROGRAM_DELETED: "Este programa foi deletado.",
  
  // Submissão
  SUBMISSION_NOT_FOUND: "Submissão não encontrada.",
  SUBMISSION_DELETED: "Esta submissão foi deletada.",
  NOT_SUBMISSION_OWNER: "Você não tem permissão para editar esta submissão.",
  
  // Mensagem
  MESSAGE_NOT_FOUND: "Mensagem não encontrada.",
  RECIPIENT_NOT_FOUND: "Utilizador destinatário não encontrado.",
  CANNOT_MESSAGE_SELF: "Não pode enviar mensagens para si mesmo.",
  
  // Genérico
  OPERATION_FAILED: "Operação falhou. Tente novamente.",
  CONNECTION_ERROR: "Erro de conexão. Verifique sua internet.",
  UNAUTHORIZED: "Você não tem permissão para esta operação.",
};
