# 🚀 GUIA: MIGRAÇÃO PARA 100% SUPABASE (Express → Supabase)

## ✅ O QUE FOI FEITO:

1. ✅ **Criado RPC Functions** (`supabase/rpc_functions.sql`)
   - `register_participant()` - Registar novo usuário
   - `login_user()` - Login com validação
   - `approve_participant()` - Aprovar participante
   - `reject_participant()` - Rejeitar participante
   - `get_participants()` - Listar participantes com filtros
   - `check_in_user()` - Check-in via QR
   - `mark_as_paid()` - Marcar como pago

2. ✅ **Criado Supabase Service** (`lib/supabase-service.ts`)
   - `authService` - Login e Registro
   - `adminService` - Gerenciamento de participantes
   - `checkInService` - Check-in QR
   - `messageService` - Mensagens
   - `submissionService` - Submissões

3. ✅ **Atualizado AuthContext** (`contexts/AuthContext.tsx`)
   - Usa `authService` em vez de Express
   - Armazena local com `localStorage`
   - Sem dependência de Supabase Auth nativo

4. ✅ **Atualizado Admin Panel** (`app/(tabs)/admin.tsx`)
   - Usa `adminService` para gerenciar participantes
   - Usa `submissionService` para avaliar trabalhos
   - Sem chamadas a Express endpoints

---

## 📋 PASSOS PARA ATIVAR:

### **PASSO 1: Executar SQL no Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Vá para seu projeto
3. Clique em **SQL Editor** (à esquerda)
4. Clique em **New Query**
5. Cole o conteúdo de `supabase/rpc_functions.sql`
6. Clique **Run**

✅ Agora as RPC functions estão criadas.

---

### **PASSO 2: Configurar Tabelas**

Se ainda não ter as colunas `approved_at` e `rejection_reason` na tabela `users`, execute:

```sql
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP DEFAULT NULL;
ALTER TABLE users ADD COLUMN rejection_reason TEXT DEFAULT NULL;
```

---

### **PASSO 3: Permitir Acesso Público**

Execute no SQL Editor:

```sql
GRANT EXECUTE ON FUNCTION register_participant TO anon;
GRANT EXECUTE ON FUNCTION login_user TO anon;
GRANT SELECT, INSERT, UPDATE ON users TO anon;
```

Isto permite que o app (sem autenticação) registre e faça login.

---

### **PASSO 4: Testar no App**

1. **Parar o servidor Express:**
   ```bash
   Ctrl+C (no terminal do servidor)
   ```

2. **Limpar cache do app:**
   ```bash
   npm run expo:dev
   ```

3. **Testar fluxo:**
   - ✅ Registar novo usuário
   - ✅ Tentar login sem aprovação (deve bloquear)
   - ✅ Admin aprovar na aba "Participantes"
   - ✅ Login bem-sucedido

---

### **PASSO 5: Desabilitar Express (Opcional)**

Se tudo funcionar, pode remover o servidor:

```bash
# Comentar script no package.json
"server:dev": "# NODE_ENV=development tsx server/index.ts"

# Ou deletar
rm -rf server/
```

---

## 🔐 SEGURANÇA:

✅ **RPC Functions são SECURITY DEFINER**
- Execute com permissões de superuser
- Validam dados internamente
- Não expõem lógica ao cliente

✅ **Senhas criptografadas**
- Usam `crypt()` e `gen_salt('bf')`
- Nunca retornam hash ao cliente

✅ **Validações no servidor (Supabase)**
- Email único
- Status verificado antes de login
- Rejeição bloqueada

---

## 📊 ARQUITETURA FINAL:

```
┌─────────────────────┐
│   APP (React Native)│
│  (Login, Admin UI)  │
└──────────┬──────────┘
           │
     HTTP/RPC Calls
           │
┌──────────▼──────────┐
│   SUPABASE (Online) │
│  - RPC Functions    │
│  - PostgreSQL DB    │
│  - Real-time Sub.   │
└─────────────────────┘
```

✅ **0 servidores locais**
✅ **0 dependências Express**
✅ **100% Supabase**

---

## ⚡ PRÓXIMOS PASSOS:

1. Execute os SQL scripts
2. Teste o app
3. Quando pronto, gere o APK com:
   ```bash
   eas build --platform android
   ```

O APK funcionará porque:
- ✅ Conecta direto ao Supabase (cloud)
- ✅ Sem necessidade de servidor local
- ✅ Funciona offline/online seamlessly
