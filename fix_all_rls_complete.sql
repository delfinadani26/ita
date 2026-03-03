-- ============================================
-- CORREÇÃO COMPLETA DE RLS PARA TODAS AS TABELAS
-- ============================================
-- Este script adiciona políticas de INSERT e DELETE
-- para ALL as tabelas existentes e futuras

-- ============================================
-- 1. TABELA: users
-- ============================================
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can create accounts" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);

-- ============================================
-- 2. TABELA: submissions
-- ============================================
DROP POLICY IF EXISTS "Anyone can read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.submissions;

CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (true);
CREATE POLICY "submissions_delete" ON public.submissions FOR DELETE USING (true);

-- ============================================
-- 3. TABELA: messages
-- ============================================
DROP POLICY IF EXISTS "Users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (true);

-- ============================================
-- 4. TABELA: congress_program
-- ============================================
DROP POLICY IF EXISTS "Anyone can read program" ON public.congress_program;
DROP POLICY IF EXISTS "Anyone can insert program" ON public.congress_program;
DROP POLICY IF EXISTS "Admins can modify program" ON public.congress_program;
DROP POLICY IF EXISTS "Admins can delete program" ON public.congress_program;

CREATE POLICY "congress_program_select" ON public.congress_program FOR SELECT USING (true);
CREATE POLICY "congress_program_insert" ON public.congress_program FOR INSERT WITH CHECK (true);
CREATE POLICY "congress_program_update" ON public.congress_program FOR UPDATE USING (true);
CREATE POLICY "congress_program_delete" ON public.congress_program FOR DELETE USING (true);

-- ============================================
-- HABILITAR REALTIME PARA TODAS AS TABELAS
-- ============================================
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.congress_program REPLICA IDENTITY FULL;

-- ============================================
-- RESUMO DAS POLÍTICAS CRIADAS
-- ============================================
-- ✅ users: SELECT, INSERT, UPDATE, DELETE
-- ✅ submissions: SELECT, INSERT, UPDATE, DELETE
-- ✅ messages: SELECT, INSERT, UPDATE, DELETE
-- ✅ congress_program: SELECT, INSERT, UPDATE, DELETE
-- ✅ Realtime habilitado em todas

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Todas as políticas usam "true" como condição,
--    meaning que qualquer usuário pode fazer qualquer operação
--
-- 2. Para produção, você pode querer restringir:
--    - INSERT apenas para usuários autenticados
--    - UPDATE/DELETE apenas para proprietários dos dados
--    - Exemplo: USING (auth.uid()::text = user_id::text)
--
-- 3. Realtime (REPLICA IDENTITY FULL) está habilitado,
--    permitindo subscriptions em tempo real
--
-- 4. Se adicionar novas tabelas, repita o padrão:
--    CREATE POLICY "table_select" ON public.table_name FOR SELECT USING (true);
--    CREATE POLICY "table_insert" ON public.table_name FOR INSERT WITH CHECK (true);
--    CREATE POLICY "table_update" ON public.table_name FOR UPDATE USING (true);
--    CREATE POLICY "table_delete" ON public.table_name FOR DELETE USING (true);
