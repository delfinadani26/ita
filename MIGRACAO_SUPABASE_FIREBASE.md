# 🔄 Migração Supabase → Firebase

## ✅ Status da Migração

Seu projeto foi **completamente migrado** de Supabase para **Firebase Firestore**.

---

## 📋 Código Supabase Comentado

Todos os códigos Supabase foram **comentados** (não deletados) para referência futura.

Se precisar restaurar Supabase, o código está disponível nos comentários.

### Arquivos Modificados:

| Arquivo | Status | Detalhes |
|---------|--------|----------|
| [server/storage.ts](server/storage.ts) | ❌ Desativado | Conexão PostgreSQL comentada |
| [lib/supabase.ts](lib/supabase.ts) | ❌ Desativado | Cliente Supabase comentado |
| [lib/validation.ts](lib/validation.ts) | ❌ Desativado | Funções Supabase comentadas |
| [lib/useRealtimeSubscription.ts](lib/useRealtimeSubscription.ts) | ❌ Desativado | Listeners Realtime comentados |

---

## 🔥 Sistema Firebase Ativo

### Arquivos do Firebase:

| Arquivo | Propósito |
|---------|-----------|
| [server/firebase-config.ts](server/firebase-config.ts) | Inicialização Firebase Admin SDK |
| [server/storage-firebase.ts](server/storage-firebase.ts) | Interface Firestore (CRUD) |
| [scripts/init-firestore.js](scripts/init-firestore.js) | Criar collections no Firestore |
| [scripts/migrate-to-firebase.js](scripts/migrate-to-firebase.js) | Backup/Restore de dados |
| [firebase-key.json](firebase-key.json) | Service Account Key (⚠️ não commit) |

### Variáveis de Ambiente:

```bash
# ❌ Supabase (não usa mais)
DATABASE_URL=postgresql://...
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_KEY=...

# ✅ Firebase (ativo)
# Credenciais em: server/firebase-config.ts
```

---

## 📊 Collections no Firebase

Seu Firestore contém as seguintes collections:

```
Firestore (csa-urnm)
├── users/              (participantes e usuários)
├── submissions/        (apresentações/trabalhos)
├── congress_program/   (programa do congresso)
└── messages/          (mensagens entre usuários)
```

---

## 🔙 Como Restaurar Supabase (se necessário)

### Passo 1: Descomente o código

**Em [server/storage.ts](server/storage.ts):**
```typescript
// Procure por: ❌ SUPABASE: DESATIVADO
// Descomente o bloco de código PostgreSQL abaixo
```

**Em [lib/supabase.ts](lib/supabase.ts):**
```typescript
// Procure por: ❌ SUPABASE: DESATIVADO
// Descomente o bloco de código Supabase
```

### Passo 2: Configure variáveis de ambiente

```bash
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/DATABASE
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=YOUR_ANON_KEY
```

### Passo 3: Atualize routes.ts

```typescript
// Mude de:
import { firebaseDb as db } from "./storage-firebase";

// Para:
import { db } from "./storage";
```

### Passo 4: Remova Firebase (opcional)

```bash
npm uninstall firebase-admin @firebase/app @firebase/auth @firebase/firestore @firebase/storage @firebase/analytics
```

---

## 🚀 Referência Rápida

### Comando para iniciar com Firebase:
```bash
npx tsx server/index.ts
```

### Criar dados de teste:
```bash
npm run firebase:init
```

### Fazer backup de dados:
```bash
npm run migrate:backup
```

### Restaurar dados do backup:
```bash
npm run migrate:restore
```

### Verificar status Firebase:
```bash
npm run firebase:check
```

---

## 📚 Documentação

- 📖 [GUIA_MIGRACAO_FIREBASE.md](GUIA_MIGRACAO_FIREBASE.md) - Guia completo da migração
- 📖 [CHECKLIST_FIREBASE.md](CHECKLIST_FIREBASE.md) - Checklist de verificação
- 📖 [ATIVAR_FIRESTORE.md](ATIVAR_FIRESTORE.md) - Como ativar Firestore no Console
- 📖 [OBTER_FIREBASE_KEY.md](OBTER_FIREBASE_KEY.md) - Como obter Service Account Key

---

## ⚠️ Importante

### NÃO COMMIT:
- `firebase-key.json` - Service Account (privado)
- `google-services.json` - Já em .gitignore

### BACKUP:
- `data/migration-backup.json` - Dados exportados (seguro fazer commit)

---

## 🎯 Próximos Passos

1. ✅ Firebase Firestore ativado
2. ✅ Collections criadas
3. ✅ Backend rodando com Firebase
4. 🔲 Testar Expo app com Firebase
5. 🔲 Deploy em produção

**Status Geral:** ✅ **PRONTO PARA USAR COM FIREBASE**

---

**Data:** 03 de Março de 2026  
**Projeto:** CSA-URNM (csa-urnm)  
**Banco:** Firebase Firestore
