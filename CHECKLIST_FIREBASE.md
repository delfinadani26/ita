# ✅ Checklist de Migração para Firebase

## 🎯 Fase 1: Preparação (5 minutos)

- [ ] Ter conta Google
- [ ] Acessar https://console.firebase.google.com/
- [ ] Criar novo projeto
- [ ] Ativar Firestore Database

## 🔑 Fase 2: Credenciais (3 minutos)

- [ ] No Firebase Console: Project Settings → Service Accounts
- [ ] Clique "Generate New Private Key"
- [ ] Salve arquivo como `firebase-key.json` na raiz do projeto
- [ ] Verifique que o arquivo existe: `ita2/firebase-key.json`

## 💾 Fase 3: Backup (1 minuto)

Execute este comando:
```bash
node scripts/migrate-to-firebase.js --backup
```

Resultado esperado:
```
✅ Backup concluído!
   📁 Arquivo: data/migration-backup.json
   👥 Usuários: X
   📄 Submissões: X
```

## 📤 Fase 4: Importação (2-5 minutos)

Execute este comando:
```bash
node scripts/migrate-to-firebase.js --restore
```

Resultado esperado:
```
✅ Migração concluída com sucesso!
   👥 Usuários importados: X
   📄 Submissões importadas: X
```

## ✅ Fase 5: Verificação (2 minutos)

1. Vá para Firebase Console
2. Firestore Database → Collections
3. Verifique que existem:
   - [ ] Collection `users` com dados
   - [ ] Collection `submissions` com dados

## 🔐 Fase 6: Segurança (2 minutos)

1. Firebase Console → Firestore → Regras
2. Cole o conteúdo de `GUIA_MIGRACAO_FIREBASE.md` (Passo 6)
3. Clique "Publicar"

Verificar:
- [ ] Regras publicadas com sucesso

## 🔄 Fase 7: Código (5 minutos)

No arquivo `server/routes.ts`, procure:
```typescript
import { db } from "./storage";
```

Substitua por:
```typescript
import { firebaseDb as db } from "./storage-firebase";
```

Verificar:
- [ ] Arquivo `routes.ts` editado

## 🧪 Fase 8: Teste (5 minutos)

Inicie o servidor:
```bash
npx tsx server/index.ts
```

Esperado:
- [ ] Servidor inicia sem erros
- [ ] Mensagem: "✅ Firebase conectado com sucesso!"

Teste endpoint:
```bash
curl http://localhost:5000/api/check/raw-sql
```

Esperado:
- [ ] Resposta JSON com dados

## 📱 Fase 9: App Expo (5 minutos)

```bash
npm run expo:dev
```

Teste na aplicação:
- [ ] Login funciona
- [ ] Página de submissões carrega
- [ ]Enviando arquivo faz upload
- [ ] Dados aparecem no Firebase Console

## ✨ Fase 10: Limpeza (opcional)

Se tudo está funcionando:
- [ ] Remover dependência do Supabase do código
- [ ] Remover arquivo `storage.ts` antigo
- [ ] Remover `.env` com DATABASE_URL do Supabase
- [ ] Manter `firebase-key.json` seguro (não commit no Git!)

---

## ⏱️ Tempo Total: ~25 minutos

### Melhor Horário pra Fazer:
- Quando não há usuários usando o app (noite/fim de semana)
- Tenha backup (`migration-backup.json`) antes de apagar dados do Supabase

---

## 🆘 Se Algo Deu Errado

### Erro: "firebase-key.json not found"
```
❌ Solução: Baixe novamente do Firebase Console
1. Project Settings → Service Accounts
2. Generate New Private Key
3. Salve como firebase-key.json na raiz
```

### Erro: "FirebaseError [auth/invalid-api-key]"
```
❌ Solução: Verifique arquivo JSON
- Abre firebase-key.json em editor de texto
- Procure por "project_id" (deve estar presente)
- Se vazio, regenere a chave
```

### Erro: "Permission denied"
```
❌ Solução: Configure regras de Firestore
1. Firebase Console → Firestore → Regras
2. Limpe linha 6 que começa com "allow" 
3. Mude de "match" para "allow read, write: if true;"
4. (Temporal apenas para teste. Depois use regras corretas)
```

### Dados não aparecem após restauração
```
❌ Solução:
1. Verifique em Firebase Console se collections existem
2. Verifique console.log do servidor (vê erros)
3. ReExecute: node scripts/migrate-to-firebase.js --restore
```

---

## 📊 Monitoramento

Depois de migrar, monitore em Firebase Console:
- Usage → Read/Write operations
- Real-time Database stats
- Data size

**Dica:** Firebase é gratuito até 50K leituras/dia e 20K escritas/dia

---

## 📝 Notas

- Todos os dados antigos do Supabase estarão em `data/migration-backup.json`
- Firebase cria IDs automáticos (você não controla)
- Campos user_id são convertidos de números para strings
- Timestamps são copiados exatamente

Good luck! 🚀✨
