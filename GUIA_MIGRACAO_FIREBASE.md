# 🔥 Guia de Migração: Supabase → Firebase Firestore

## 📋 Pré-requisitos

1. **Conta Google** (para Firebase)
2. **Projeto Firebase** (crie em https://console.firebase.google.com/)
3. **Node.js 18+** (já tem!)

---

## 🚀 Passo 1: Criar Projeto Firebase

### 1.1 Acessar Firebase Console
```
1. Vá para https://console.firebase.google.com/
2. Clique em "Criar projeto"
3. Nome: "CSA-URNM-2026" (ou seu preferido)
4. Aceite os termos
5. Aguarde a criação (2-3 minutos)
```

### 1.2 Ativar Firestore
```
1. No menu esquerdo, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Selecione: "Iniciar no modo de testes"
   ⚠️ (Vamos configurar segurança depois)
4. Selecione localização: "Servidor nearest"
5. Clique em "Criar"
```

### 1.3 Gerar Credenciais (firebase-key.json)
```
1. Clique na engrenagem ⚙️ → "Configurações do projeto"
2. Abra a aba "Contas de serviço"
3. Clique em "Gerar nova chave privada"
4. Salve o arquivo como: `firebase-key.json`
5. Coloque na raiz do projeto (ita2/firebase-key.json)
```

---

## 💾 Passo 2: Fazer Backup dos Dados

Execute para exportar dados atuais:

```bash
node scripts/migrate-to-firebase.js --backup
```

**O que acontece:**
- ✅ Exporta todos os usuários
- ✅ Exporta todas as submissões  
- ✅ Salva em: `data/migration-backup.json`

---

## 📤 Passo 3: Importar para Firebase

Execute para importar no Firebase:

```bash
node scripts/migrate-to-firebase.js --restore
```

**O que acontece:**
- ✅ Conecta ao Firebase usando credenciais
- ✅ Cria collection `users`
- ✅ Cria collection `submissions`
- ✅ Importa todos os dados

---

## ✅ Passo 4: Verificar no Firebase Console

1. Vá para: https://console.firebase.google.com/
2. Abra seu projeto
3. Clique em "Firestore Database"
4. Deve ver collections:
   - `users` (com seus usuários)
   - `submissions` (com suas submissões)

---

## 🔄 Passo 5: Atualizar Application Code

### 5.1 Atualizar routes.ts

Localize a importação do storage:

**ANTES:**
```typescript
import { db } from "./storage";
```

**DEPOIS:**
```typescript
import { firebaseDb as db } from "./storage-firebase";
```

### 5.2 Iniciar servidor com Firebase

```bash
$env:DATABASE_URL="PODE_DEIXAR_EM_BRANCO"
npx tsx server/index.ts
```

O servidor vai:
- ✅ Detectar Firebase conectado
- ✅ Usar Firestore automaticamente
- ✅ Fallback para mock se indisponível

---

## 🔐 Passo 6: Configurar Segurança Firestore (Importante!)

Agora configure regras de acesso ao banco:

### 6.1 No Firebase Console
```
1. Firestore Database → Aba "Regras"
2. Copie e cole:
```

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuários - apenas leitura
    match /users/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == resource.data.id;
    }
    
    // Submissões - apenas autor pode ver/editar
    match /submissions/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.user_id;
    }
    
    // Admin - acesso total
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Msg padrão (deny tudo)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

```
3. Clique em "Publicar"
```

---

## 🧪 Passo 7: Testar a Migração

### 7.1 Iniciar Servidor
```bash
npm run server:dev
```

### 7.2 Testar Endpoints
```bash
# Ver usuários
curl http://localhost:5000/api/check/raw-sql

# Ver submissões
curl http://localhost:5000/api/submissions \
  -H "Cookie: Connect.sid=..."
```

### 7.3 Testar Upload (Expo)
```bash
npm run expo:dev
```

1. Login na aplicação
2. Vá para "Submissões"
3. Preencha e envieTeste um arquivo
4. Verifique se salvou em Firebase Console

---

## 🗺️ Estrutura Firebase

Seu banco vai ficar assim:

```
Firestore/
├── users/
│   ├── doc1/
│   │   ├── full_name: "João Silva"
│   │   ├── email: "joao@example.com"
│   │   ├── category: "docente"
│   │   ├── payment_status: "pending"
│   │   └── created_at: "2026-03-03T..."
│   └── doc2/
│       └── ...
│
├── submissions/
│   ├── doc1/
│   │   ├── user_id: "user123"
│   │   ├── title: "Minha Apresentação"
│   │   ├── file_uri: "/uploads/..."
│   │   ├── status: "pending"
│   │   └── submitted_at: "2026-03-03T..."
│   └── doc2/
│       └── ...
│
├── messages/
│   └── ...
│
└── congress_program/
    └── ...
```

---

## ⚠️ Problemas Comuns

### ❌ "firebase-key.json not found"
**Solução:** Baixe o arquivo do Firebase Console e coloque na raiz do projeto

### ❌ "Permission denied on Firestore"
**Solução:** Configure regras de segurança (Passo 6)

### ❌ "User IDs don't match"
**Solução:** Firebase usa strings, Supabase usa numbers. O código já trata isso automaticamente!

### ❌ "Upload falha no Firebase"
**Solução:** Arquivo deve estar em `/uploads/`. Firebase Storage é separado e precisa de configuração adicional

---

## 📚 Diferenças: Supabase vs Firebase

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Tipo | PostgreSQL | NoSQL (Firestore) |
| Queries | SQL | Fieldpath/Collections |
| Autenticação | Integrada | Firebase Auth |
| Storage | Configurada | Cloud Storage (separado) |
| Realtime | Websockets | Listeners |
| Pricing | Por uso | Oferecimento + leitura/escrita |

---

## 🎯 Próximos Passos Opcionais

### 1. Migrar para Firebase Authentication
- Usar `firebase/auth` ao invés de sessões

### 2. Migrar arquivos para Cloud Storage
- Suporte a uploads diretos no Firebase

### 3. Adicionar Realtime Listeners
- Atualizar dados em tempo real

### 4. Configurar Backups Automáticos
- Firebase faz backup automático (premium)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o `firebase-key.json`
2. Veja os logs no Firebase Console
3. Execute `npm run logs:server` para ver detalhes

Good luck! 🚀
