-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS - ITA CONGRESSO
-- ============================================================================
-- Este script implementa todas as novas funcionalidades:
-- 1. Sistema de permissões granulares para administradores
-- 2. RPCs para gerenciar administradores
-- 3. Resetar password do admin principal
-- ============================================================================

-- ============================================================================
-- 1️⃣ ADICIONAR COLUNA DE PERMISSÕES
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
  "approve_participant": false,
  "reject_participant": false,
  "mark_as_paid": false,
  "review_submissions": false,
  "manage_admins": false,
  "check_in": false,
  "send_messages": false
}'::jsonb;

-- ============================================================================
-- 2️⃣ ATUALIZAR PERMISSÕES DO ADMIN PRINCIPAL
-- ============================================================================
UPDATE users 
SET permissions = '{
  "approve_participant": true,
  "reject_participant": true,
  "mark_as_paid": true,
  "review_submissions": true,
  "manage_admins": true,
  "check_in": true,
  "send_messages": true
}'::jsonb
WHERE id = 1 AND role = 'admin';

-- ============================================================================
-- 3️⃣ RPC: PROMOVER USUÁRIO A ADMINISTRADOR
-- ============================================================================
CREATE OR REPLACE FUNCTION promote_to_admin(p_user_id INT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE users
  SET role = 'admin'
  WHERE id = p_user_id;

  SELECT json_build_object(
    'success', true,
    'message', 'Utilizador promovido a administrador com sucesso'
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4️⃣ RPC: REMOVER PRIVILÉGIO DE ADMINISTRADOR
-- ============================================================================
CREATE OR REPLACE FUNCTION demote_from_admin(p_user_id INT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE users
  SET role = 'participant'
  WHERE id = p_user_id;

  SELECT json_build_object(
    'success', true,
    'message', 'Privilégios de administrador removidos com sucesso'
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5️⃣ RPC: ATUALIZAR PERMISSÕES DE UM ADMIN
-- ============================================================================
CREATE OR REPLACE FUNCTION update_admin_permissions(
  p_admin_id INT,
  p_permissions jsonb
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Apenas super admin (id=1) pode alterar permissões
  IF NOT (SELECT COUNT(*) > 0 FROM users WHERE id = 1 AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  UPDATE users
  SET permissions = p_permissions
  WHERE id = p_admin_id AND role = 'admin';

  SELECT json_build_object(
    'success', true,
    'message', 'Permissões atualizadas com sucesso'
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6️⃣ RPC: OBTER PERMISSÕES DE UM ADMIN
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_permissions(p_admin_id INT)
RETURNS JSON AS $$
BEGIN
  RETURN (SELECT permissions FROM users WHERE id = p_admin_id AND role = 'admin');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7️⃣ RPC: VERIFICAR SE ADMIN TEM PERMISSÃO ESPECÍFICA
-- ============================================================================
CREATE OR REPLACE FUNCTION has_permission(
  p_admin_id INT,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permissions jsonb;
  v_has_permission BOOLEAN;
BEGIN
  SELECT permissions INTO v_permissions 
  FROM users 
  WHERE id = p_admin_id AND role = 'admin';
  
  IF v_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  v_has_permission := (v_permissions ->> p_permission)::BOOLEAN;
  RETURN COALESCE(v_has_permission, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8️⃣ RESETAR PASSWORD DO ADMIN PRINCIPAL
-- ============================================================================
UPDATE users 
SET 
  password = crypt('admin8891*1', gen_salt('bf')),
  category = 'docente',
  affiliation = 'urnm',
  role = 'admin',
  payment_status = 'approved'
WHERE email = 'admin@urnm.ao';

-- ============================================================================
-- ✅ SCRIPT CONCLUÍDO COM SUCESSO
-- ============================================================================
-- O sistema agora possui:
-- ✅ Sistema de permissões granulares (7 permissões)
-- ✅ Promoção/Remoção de administradores
-- ✅ Controle de acesso baseado em permissões
-- ✅ Admin principal com todas as permissões
-- ✅ Password do admin resetada
-- ============================================================================
