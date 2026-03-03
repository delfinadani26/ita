/*
 * ❌ SUPABASE: DESATIVADO - Migrado para Firebase Firestore
 * 
 * Este arquivo foi mantido como referência histórica do cliente Supabase
 * Se precisar restaurar Supabase no futuro, descomente este bloco
 * 
 * Para usar Firebase, veja:
 * - server/storage-firebase.ts (Backend)
 * - server/firebase-config.ts (Configuração)
 * 
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
 *
 */

// ✅ FIREBASE: ATIVO
// Para usar Firebase Auth/Firestore, importe de:
// - server/firebase-config.ts (Backend)
// - server/storage-firebase.ts (Operações do banco)

export const supabase = null; // Placeholder para manter compatibilidade
