# 🔥 Ativar Firestore no Firebase Console

## Problema
O Firebase Firestore não está ativado no projeto `csa-urnm`. Precisa ser ativado antes de criar collections.

## Solução (3 passos simples):

### 1️⃣ Acesse o Firebase Console
```
https://console.firebase.google.com/
```

### 2️⃣ Selecione seu projeto: `csa-urnm`

### 3️⃣ Ative o Firestore Database
1. Na barra esquerda, procure por **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha modo: **"Teste"** (para desenvolvimento)
4. Selecione região: **us-central1**
5. Clique em **"Criar"**

⏳ Vai levar 1-2 minutos para ativar...

---

## Após ativar o Firestore:

Execute no terminal:
```bash
npm run firebase:init
```

Isso criará automaticamente as collections no Firestore! ✅

---

## Estrutura que será criada:

```
Firestore Database (csa-urnm)
├── users/              (participantes e usuários)
├── submissions/        (apresentações/trabalhos)
├── congress_program/   (programa do congresso)
└── messages/          (mensagens entre usuários)
```

---

## Cada collection terá:

### `users`
- id: string
- email: string
- name: string
- affiliation: string
- category: string
- password_hash: string
- created_at: timestamp
- approved: boolean

### `submissions`
- id: string
- user_id: string (referência)
- title: string
- description: string
- file_url: string
- file_type: string (PDF, DOCX)
- status: string (pending, approved, rejected)
- created_at: timestamp
- updated_at: timestamp

### Outras collections...
Estrutura similar com campos específicos.

---

## Se preferir criar manualmente:

1. No Firebase Console → Firestore Database
2. Clique em **"+ Criar coleção"**
3. Digite nome: `users`
4. Clique em **"Próximo"**
5. Clique em **"Salvar"** (sem documentos por enquanto)
6. Repita para: `submissions`, `congress_program`, `messages`

---

**Depois que o Firestore estiver ativo**, execute:
```bash
npm run firebase:init
```

E tudo será criado automaticamente! 🚀
