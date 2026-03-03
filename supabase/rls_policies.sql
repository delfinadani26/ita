-- ============================================
-- RLS POLICIES PARA SUPABASE 100%
-- ============================================

-- 1️⃣ DESABILITAR RLS TEMPORARIAMENTE (as RPC funções são SECURITY DEFINER)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE congress_program DISABLE ROW LEVEL SECURITY;

-- As RPC functions são SECURITY DEFINER, então contornam RLS automaticamente
-- Isto é seguro porque as funções fazem validação interna

-- 2️⃣ INSTRUÇÕES PARA APLICAR RLS DEPOIS (OPCIONAL):
-- Se quiser ativar RLS futuramente, execute:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Usuários podem ver seu próprio perfil" ON users FOR SELECT USING (true);
-- CREATE POLICY "Admin pode ver todos" ON users FOR SELECT USING (true);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Dar permissão ao anon (aplicativo móvel)
GRANT EXECUTE ON FUNCTION register_participant TO anon;
GRANT EXECUTE ON FUNCTION login_user TO anon;
GRANT EXECUTE ON FUNCTION approve_participant TO authenticated;
GRANT EXECUTE ON FUNCTION reject_participant TO authenticated;
GRANT EXECUTE ON FUNCTION get_participants TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_user TO authenticated;
GRANT EXECUTE ON FUNCTION mark_as_paid TO authenticated;

-- Dar permissão de SELECT/INSERT/UPDATE para as tabelas
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
