#!/usr/bin/env node

/**
 * Script de Migração: Dados Locais → Firebase Firestore
 * 
 * USO:
 *   npm run migrate:backup       (Exporta dados atuais para JSON)
 *   npm run migrate:restore      (Importa dados JSON para Firebase)
 */

require("dotenv/config");

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Inicializar Firebase
let firebaseApp;
try {
  const serviceAccount = require("../firebase-key.json");
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase inicializado com sucesso");
} catch (err) {
  console.error("❌ Erro ao inicializar Firebase:", err.message);
  process.exit(1);
}

const db = admin.firestore();

// Caminho dos arquivos de dados
const dataDir = path.join(__dirname, "../data");
const submissionsFile = path.join(dataDir, "submissions.json");
const usersFile = path.join(dataDir, "users.json");
const backupFile = path.join(dataDir, "migration-backup.json");

// Garantir que data/ existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * FASE 1: BACKUP - Exportar dados locais
 */
async function backupData() {
  console.log("\n📤 INICIANDO BACKUP DOS DADOS");
  console.log("================================");

  try {
    // Ler dados locais
    let users = [];
    let submissions = [];

    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, "utf8")) || [];
      console.log(`✅ ${users.length} usuários encontrados`);
    } else {
      console.log("ℹ️  Nenhum usuário local encontrado");
    }

    if (fs.existsSync(submissionsFile)) {
      submissions = JSON.parse(fs.readFileSync(submissionsFile, "utf8")) || [];
      console.log(`✅ ${submissions.length} submissões encontradas`);
    } else {
      console.log("ℹ️  Nenhuma submissão local encontrada");
    }

    // Salvar backup
    const backup = {
      timestamp: new Date().toISOString(),
      users,
      submissions,
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`\n✅ Backup salvo em: data/migration-backup.json`);
    console.log(`   Total: ${users.length} usuários + ${submissions.length} submissões`);

    return backup;
  } catch (err) {
    console.error("❌ Erro no backup:", err.message);
    process.exit(1);
  }
}

/**
 * FASE 2: RESTORE - Importar dados para Firebase
 */
async function restoreData() {
  console.log("\n📥 INICIANDO RESTAURAÇÃO DOS DADOS NO FIREBASE");
  console.log("==============================================");

  try {
    // Validar backup exists
    if (!fs.existsSync(backupFile)) {
      console.error("❌ Arquivo de backup não encontrado: " + backupFile);
      console.error("   Execute primeiro: npm run migrate:backup");
      process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));
    const { users = [], submissions = [] } = backup;

    console.log(`\n📊 Dados a restaurar:`);
    console.log(`   • ${users.length} usuários`);
    console.log(`   • ${submissions.length} submissões`);

    // Restaurar usuários
    if (users.length > 0) {
      console.log(`\n👥 Importando usuários...`);
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userId = String(user.id); // Converter para string (Firestore IDs devem ser strings)

        await db.collection("users").doc(userId).set({
          id: userId,
          email: user.email || "",
          name: user.name || "",
          affiliation: user.affiliation || "",
          category: user.category || "",
          password_hash: user.password_hash || "",
          created_at: user.created_at || new Date().toISOString(),
          approved: user.approved || false,
        });

        if ((i + 1) % 5 === 0) {
          process.stdout.write(`   ${i + 1}/${users.length} ✓\r`);
        }
      }
      console.log(`   ✅ ${users.length} usuários importados com sucesso`);
    }

    // Restaurar submissões
    if (submissions.length > 0) {
      console.log(`\n📝 Importando submissões...`);
      for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        const subId = String(sub.id);

        await db.collection("submissions").doc(subId).set({
          id: subId,
          user_id: String(sub.user_id || ""),
          title: sub.title || "",
          description: sub.description || "",
          file_url: sub.file_url || "",
          file_type: sub.file_type || "",
          status: sub.status || "pending",
          created_at: sub.created_at || new Date().toISOString(),
          updated_at: sub.updated_at || new Date().toISOString(),
        });

        if ((i + 1) % 5 === 0) {
          process.stdout.write(`   ${i + 1}/${submissions.length} ✓\r`);
        }
      }
      console.log(`   ✅ ${submissions.length} submissões importadas com sucesso`);
    }

    console.log(`\n✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`\nPróximos passos:`);
    console.log(`  1. Abra server/routes.ts`);
    console.log(`  2. Mude a importação de:`);
    console.log(`     import { db } from "./storage";`);
    console.log(`     para:`);
    console.log(`     import { firebaseDb as db } from "./storage-firebase";`);
    console.log(`  3. Reinicie o servidor`);
  } catch (err) {
    console.error("❌ Erro na restauração:", err.message);
    process.exit(1);
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--backup")) {
    await backupData();
    process.exit(0);
  }

  if (args.includes("--restore")) {
    await restoreData();
    process.exit(0);
  }

  console.log(`
Firebase Migration Script
========================

USO:
  npm run migrate:backup    (Exportar dados locais)
  npm run migrate:restore   (Importar para Firebase)

`);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
