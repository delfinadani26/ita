/**
 * Configuração Firebase Firestore
 * 
 * ⚠️  INSTRUÇÕES:
 * 1. Vá para: https://console.firebase.google.com/
 * 2. Project Settings → Service Accounts
 * 3. "Generate New Private Key"
 * 4. Salve o arquivo como "firebase-key.json" nesta pasta (raiz do projeto)
 * 5. Execute o servidor novamente
 * 
 * VER: OBTER_FIREBASE_KEY.md para detalhes
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregrar credenciais do arquivo JSON (arquivo gerado pelo Firebase)
const serviceAccountPath = path.join(__dirname, "..", "firebase-key.json");

let db: admin.firestore.Firestore | null = null;
let firebaseConnected = false;
let firebaseError: string | null = null;

try {
  if (!fs.existsSync(serviceAccountPath)) {
    firebaseError = `firebase-key.json não encontrado em: ${serviceAccountPath}`;
    console.error(`❌ ${firebaseError}`);
    console.error(`   📖 Siga: OBTER_FIREBASE_KEY.md`);
  } else {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    
    // Validar que tem as chaves necessárias
    if (!serviceAccount.project_id) {
      throw new Error("firebase-key.json inválido: falta 'project_id'");
    }

    if (serviceAccount.private_key && serviceAccount.private_key.includes("PRECISA_SER_ATUALIZADO")) {
      throw new Error("firebase-key.json ainda é template! Precisa atualizar com chave real");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    db = admin.firestore();
    firebaseConnected = true;
    
    console.log("✅ Firebase conectado com sucesso!");
    console.log(`   🔥 Projeto: ${serviceAccount.project_id}`);
    console.log(`   📦 Database: Firestore pronta para uso`);
  }
} catch (err: any) {
  firebaseError = err.message;
  console.error("❌ Erro ao conectar Firebase:", err.message);
  console.error("   ℹ️  Usando fallback para mock database");
  console.error(`   📖 Siga: OBTER_FIREBASE_KEY.md`);
}

export { db, firebaseConnected, firebaseError };
export default admin;

