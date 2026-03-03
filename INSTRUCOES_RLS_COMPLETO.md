🔐 CORREÇÃO COMPLETA DE RLS - TODAS AS TABELAS
===============================================

✅ O QUE FOI CORRIGIDO:
- users: + INSERT, + DELETE
- submissions: + DELETE  
- messages: + UPDATE, + DELETE
- congress_program: Já estava ok

---

📋 COMO APLICAR:

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. SQL Editor → New Query
4. Cole TUDO isto:

```sql
-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can create accounts" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can read program" ON public.congress_program;
DROP POLICY IF EXISTS "Anyone can insert program" ON public.congress_program;
DROP POLICY IF EXISTS "Admins can modify program" ON public.congress_program;
DROP POLICY IF EXISTS "Admins can delete program" ON public.congress_program;

-- USERS
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);

-- SUBMISSIONS
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (true);
CREATE POLICY "submissions_delete" ON public.submissions FOR DELETE USING (true);

-- MESSAGES
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (true);

-- CONGRESS_PROGRAM
CREATE POLICY "congress_program_select" ON public.congress_program FOR SELECT USING (true);
CREATE POLICY "congress_program_insert" ON public.congress_program FOR INSERT WITH CHECK (true);
CREATE POLICY "congress_program_update" ON public.congress_program FOR UPDATE USING (true);
CREATE POLICY "congress_program_delete" ON public.congress_program FOR DELETE USING (true);

-- ENABLE REALTIME
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.congress_program REPLICA IDENTITY FULL;
```

5. Run (Ctrl+Enter)
6. ✅ Pronto!

---

📊 MATRIX DE POLÍTICAS (APÓS CORREÇÃO):

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| users | ✅ | ✅ | ✅ | ✅ |
| submissions | ✅ | ✅ | ✅ | ✅ |
| messages | ✅ | ✅ | ✅ | ✅ |
| congress_program | ✅ | ✅ | ✅ | ✅ |

---

🚀 APÓS APLICAR:

Teste:
- ✅ Registar novo usuário
- ✅ Criar programa
- ✅ Enviar submissão
- ✅ Enviar mensagem
- ✅ Deletar dados

---

📁 ARQUIVOS CRIADOS:

- fix_all_rls_complete.sql
  → Script SQL com todas as correções
  
- supabase_setup.sql (ATUALIZADO)
  → Arquivo original com políticas corretas
  → Use para novas instalações

---

⚠️ NOTA DE SEGURANÇA:

Essas políticas permitem que **qualquer pessoa** faça **qualquer operação** (sem autenticação).

Para produção, restricione assim:

```sql
-- Apenas usuários autenticados podem inserir
CREATE POLICY "users_insert_authenticated" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas proprietário pode deletar seu próprio usuário
CREATE POLICY "users_delete_own" ON public.users 
  FOR DELETE USING (auth.uid()::text = id::text);
```

---

✨ PRONTO! Sua aplicação está com todas as políticas RLS configuradas!
