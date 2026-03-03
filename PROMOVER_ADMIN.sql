-- RPC para promover usuário a administrador
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

-- RPC para remover privilégio de administrador
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
