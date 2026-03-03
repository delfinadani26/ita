#!/usr/bin/env node

/**
 * Script de Verificação: Firebase Readiness Check
 * 
 * Verifica se você está pronto para a migração
 * 
 * USO:
 *   npm run firebase:check
 *   ou
 *   node scripts/firebase-check.js
 */

const fs = require("fs");
const path = require("path");

console.log("\n🔍 Firebase Readiness Check\n");
console.log("=".repeat(50));

let errors = [];
let warnings = [];
let ok = [];

// ============================================
// Check 1: google-services.json
// ============================================
const googleServicesPath = path.join(__dirname, "..", "google-services.json");
if (fs.existsSync(googleServicesPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(googleServicesPath, "utf-8"));
    ok.push(`✅ google-services.json encontrado (Projeto: ${data.project_info.project_id})`);
  } catch (err) {
    errors.push(`❌ google-services.json inválido: ${err.message}`);
  }
} else {
  warnings.push(`⚠️  google-services.json não encontrado`);
}

// ============================================
// Check 2: firebase-key.json
// ============================================
const firebaseKeyPath = path.join(__dirname, "..", "firebase-key.json");
if (fs.existsSync(firebaseKeyPath)) {
  try {
    const key = JSON.parse(fs.readFileSync(firebaseKeyPath, "utf-8"));
    
    if (key.private_key && key.private_key.includes("PRECISA_SER_ATUALIZADO")) {
      errors.push(`❌ firebase-key.json é template! Não foi preenchido com chave real`);
    } else if (!key.project_id) {
      errors.push(`❌ firebase-key.json inválido: falta 'project_id'`);
    } else {
      ok.push(`✅ firebase-key.json encontrado (Projeto: ${key.project_id})`);
    }
  } catch (err) {
    errors.push(`❌ firebase-key.json inválido: ${err.message}`);
  }
} else {
  errors.push(`❌ firebase-key.json não encontrado - OBRIGATÓRIO!`);
}

// ============================================
// Check 3: Data de backup anterior
// ============================================
const backupPath = path.join(__dirname, "..", "data", "migration-backup.json");
if (fs.existsSync(backupPath)) {
  try {
    const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
    ok.push(`✅ Backup anterior encontrado (${backup.stats.totalUsers} usuários, ${backup.stats.totalSubmissions} submissões)`);
  } catch (err) {
    warnings.push(`⚠️  Arquivo de backup existente mas pode estar corrompido`);
  }
} else {
  warnings.push(`⚠️  Nenhum backup anterior - isso é normal na primeira vez`);
}

// ============================================
// Check 4: Firebase Admin SDK
// ============================================
try {
  require("firebase-admin");
  ok.push(`✅ firebase-admin SDK instalado`);
} catch (err) {
  errors.push(`❌ firebase-admin não instalado: npm install firebase-admin`);
}

// ============================================
// Check 5: Scripts de migração
// ============================================
const migrateScript = path.join(__dirname, "migrate-to-firebase.js");
if (fs.existsSync(migrateScript)) {
  ok.push(`✅ Script de migração encontrado`);
} else {
  errors.push(`❌ Script migrate-to-firebase.js não encontrado`);
}

// ============================================
// Check 6: package.json scripts
// ============================================
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
  if (pkg.scripts["migrate:backup"] && pkg.scripts["migrate:restore"]) {
    ok.push(`✅ npm scripts configurados (migrate:backup, migrate:restore)`);
  } else {
    warnings.push(`⚠️  Scripts de migração não estão no package.json`);
  }
} catch (err) {
  errors.push(`❌ Erro ao ler package.json: ${err.message}`);
}

// ============================================
// Exibir resultados
// ============================================
console.log("\n✅ TUDO CERTO:");
ok.forEach(msg => console.log(`   ${msg}`));

if (warnings.length > 0) {
  console.log("\n⚠️  AVISOS:");
  warnings.forEach(msg => console.log(`   ${msg}`));
}

if (errors.length > 0) {
  console.log("\n❌ ERROS:");
  errors.forEach(msg => console.log(`   ${msg}`));
  
  console.log("\n" + "=".repeat(50));
  console.log("\n📖 PRÓXIMAS AÇÕES:\n");
  
  if (errors.some(e => e.includes("firebase-key.json"))) {
    console.log("1️⃣  Obter chave de serviço do Firebase:");
    console.log("   - Abra: https://console.firebase.google.com/");
    console.log("   - Projeto: csa-urnm");
    console.log("   - Settings → Service Accounts");
    console.log("   - Clique: 'Generate New Private Key'");
    console.log("   - Substitua conteúdo de firebase-key.json\n");
  }
  
  if (errors.some(e => e.includes("firebase-admin"))) {
    console.log("2️⃣  Instalar Firebase Admin SDK:");
    console.log("   npm install firebase-admin\n");
  }
  
  console.log("📖 Leia também: OBTER_FIREBASE_KEY.md\n");
  process.exit(1);
} else {
  console.log("\n" + "=".repeat(50));
  console.log("\n✨ PRONTO PARA MIGRAÇÃO!\n");
  console.log("Próximos passos:\n");
  console.log("  1. npm run migrate:backup      (Exportar dados)");
  console.log("  2. npm run migrate:restore     (Importar para Firebase)\n");
  process.exit(0);
}
