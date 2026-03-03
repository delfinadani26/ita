-- Adicionar coluna de permissões na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
  "approve_participant": false,
  "reject_participant": false,
  "mark_as_paid": false,
  "review_submissions": false,
  "manage_admins": false,
  "check_in": false,
  "send_messages": false
}'::jsonb;

-- Dar ao admin principal (id=1) todas as permissões
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

-- RPC para atualizar permissões de um admin
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

-- RPC para buscar permissões de um admin
CREATE OR REPLACE FUNCTION get_admin_permissions(p_admin_id INT)
RETURNS JSON AS $$
BEGIN
  RETURN (SELECT permissions FROM users WHERE id = p_admin_id AND role = 'admin');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- RPC para verificar se admin tem uma permissão específica
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
