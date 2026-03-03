#!/usr/bin/env node

/**
 * Script para criar estrutura do Firestore
 * Cria as collections e documents principais
 */

require("dotenv/config");

const admin = require("firebase-admin");

try {
  const serviceAccount = require("../firebase-key.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error("❌ Erro ao inicializar Firebase:", err.message);
  process.exit(1);
}

const db = admin.firestore();

async function createCollections() {
  console.log("\n🔥 Criando estrutura do Firestore...\n");

  try {
    // 1. Criar collection 'users' com documento de exemplo
    console.log("📝 Criando collection 'users'...");
    await db.collection("users").doc("1").set({
      id: "1",
      email: "admin@example.com",
      name: "Administrador",
      affiliation: "ITA",
      category: "Palestrante",
      password_hash: "$2a$10$YourHashedPasswordHere",
      created_at: new Date().toISOString(),
      approved: true,
      is_checked_in: false,
    });
    console.log("   ✅ Collection 'users' criada");

    // 2. Criar collection 'submissions'
    console.log("📝 Criando collection 'submissions'...");
    await db.collection("submissions").doc("1").set({
      id: "1",
      user_id: "1",
      title: "Exemplo de Apresentação",
      description: "Esta é uma apresentação de exemplo",
      file_url: "uploads/example.pdf",
      file_type: "PDF",
      status: "approved",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log("   ✅ Collection 'submissions' criada");

    // 3. Criar collection 'congress_program'
    console.log("📝 Criando collection 'congress_program'...");
    await db.collection("congress_program").doc("1").set({
      id: "1",
      title: "CSA 2026",
      date: "2026-03-03",
      location: "ITA",
      description: "Congresso de Sistemas Avançados",
    });
    console.log("   ✅ Collection 'congress_program' criada");

    // 4. Criar collection 'messages'
    console.log("📝 Criando collection 'messages'...");
    await db.collection("messages").doc("1").set({
      id: "1",
      from_user_id: "1",
      to_user_id: "2",
      message: "Olá! Como vai?",
      created_at: new Date().toISOString(),
    });
    console.log("   ✅ Collection 'messages' criada");

    console.log("\n✅ ESTRUTURA DO FIRESTORE CRIADA COM SUCESSO!\n");
    console.log("Collections criadas:");
    console.log("  • users (para usuários e participantes)");
    console.log("  • submissions (para apresentações/trabalhos)");
    console.log("  • congress_program (para programa do congresso)");
    console.log("  • messages (para mensagens entre usuários)");

    console.log("\n📊 Próximos passos:");
    console.log("  1. Acesse Firebase Console: https://console.firebase.google.com/");
    console.log("  2. Selecione projeto: csa-urnm");
    console.log("  3. Vá para: Firestore Database");
    console.log("  4. Veja as collections criadas!");
    console.log("  5. Adicione mais dados conforme necessário\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao criar collections:", err.message);
    console.error(err);
    process.exit(1);
  }
}

createCollections();
