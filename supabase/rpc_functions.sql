-- ============================================
-- RPC FUNCTIONS PARA SUBSTITUIR EXPRESS
-- ============================================

-- 1️⃣ FUNÇÃO: Registar Novo Participante
CREATE OR REPLACE FUNCTION register_participant(
  p_full_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_academic_degree TEXT,
  p_category TEXT,
  p_affiliation TEXT,
  p_institution TEXT,
  p_role TEXT DEFAULT 'participant'
)
RETURNS JSON AS $$
DECLARE
  v_user_id INT;
  v_qr_code TEXT;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN json_build_object('error', 'Email já registado');
  END IF;

  -- Gerar QR Code
  v_qr_code := 'URNM-' || DATE_PART('epoch', NOW())::TEXT || '-' || SUBSTR(MD5(p_email), 1, 8);

  -- Inserir novo usuário
  INSERT INTO users (
    full_name, email, password, academic_degree, category, affiliation, 
    institution, role, qr_code, payment_status, payment_amount, is_checked_in, created_at
  ) VALUES (
    p_full_name, p_email, crypt(p_password, gen_salt('bf')), p_academic_degree, 
    p_category, p_affiliation, p_institution, p_role, v_qr_code, 'pending', 
    CASE 
      WHEN p_role = 'preletor' THEN 20000
      WHEN p_category = 'docente_urnm' THEN 5000
      WHEN p_category = 'docente_externo' THEN 7000
      WHEN p_category = 'estudante_urnm' THEN 3000
      WHEN p_category = 'estudante_externo' THEN 4000
      WHEN p_category = 'outro_urnm' THEN 5000
      ELSE 10000
    END,
    FALSE,
    NOW()
  )
  RETURNING id INTO v_user_id;

  RETURN json_build_object(
    'id', v_user_id,
    'full_name', p_full_name,
    'email', p_email,
    'role', p_role,
    'payment_status', 'pending',
    'category', p_category,
    'affiliation', p_affiliation,
    'institution', p_institution,
    'qr_code', v_qr_code,
    'created_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ FUNÇÃO: Login (Verificar Email + Senha)
CREATE OR REPLACE FUNCTION login_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Buscar usuário por email
  SELECT * INTO v_user FROM users WHERE email = p_email LIMIT 1;

  IF v_user IS NULL THEN
    RETURN json_build_object('error', 'Email ou palavra-passe incorretos');
  END IF;

  -- Verificar password
  IF NOT (v_user.password = crypt(p_password, v_user.password)) THEN
    RETURN json_build_object('error', 'Email ou palavra-passe incorretos');
  END IF;

  -- Verificar se está pending
  IF v_user.payment_status = 'pending' AND v_user.role = 'participant' THEN
    RETURN json_build_object(
      'error', 'Sua inscrição aguarda aprovação do administrador. Receberá um email com as próximas instruções.',
      'status', 'pending_approval'
    );
  END IF;

  -- Verificar se foi rejeitado
  IF v_user.payment_status = 'rejected' THEN
    RETURN json_build_object(
      'error', 'Sua inscrição foi rejeitada. Motivo: ' || COALESCE(v_user.rejection_reason, 'Não cumprimento dos critérios'),
      'status', 'rejected'
    );
  END IF;

  -- Login bem-sucedido
  RETURN json_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'role', v_user.role,
    'payment_status', v_user.payment_status,
    'category', v_user.category,
    'affiliation', v_user.affiliation,
    'institution', v_user.institution,
    'qr_code', v_user.qr_code,
    'is_checked_in', v_user.is_checked_in,
    'created_at', v_user.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ FUNÇÃO: Aprovar Participante
CREATE OR REPLACE FUNCTION approve_participant(p_user_id INT)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  UPDATE users 
  SET payment_status = 'approved', approved_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF v_user IS NULL THEN
    RETURN json_build_object('error', 'Utilizador não encontrado');
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'payment_status', 'approved',
    'message', 'Participante aprovado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ FUNÇÃO: Rejeitar Participante
CREATE OR REPLACE FUNCTION reject_participant(
  p_user_id INT,
  p_reason TEXT DEFAULT 'Não cumprimento dos critérios de elegibilidade'
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  UPDATE users 
  SET payment_status = 'rejected', rejection_reason = p_reason, approved_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF v_user IS NULL THEN
    RETURN json_build_object('error', 'Utilizador não encontrado');
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'payment_status', 'rejected',
    'rejection_reason', p_reason,
    'message', 'Participante rejeitado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ FUNÇÃO: Listar Participantes (com paginação e filtro)
CREATE OR REPLACE FUNCTION get_participants(
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 10,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_data JSON;
BEGIN
  v_offset := (p_page - 1) * p_limit;

  -- Contar total
  SELECT COUNT(*) INTO v_total FROM users 
  WHERE role = 'participant' 
  AND (p_status IS NULL OR payment_status = p_status);

  -- Buscar dados
  SELECT json_agg(row_to_json(t)) INTO v_data
  FROM (
    SELECT * FROM users
    WHERE role = 'participant'
    AND (p_status IS NULL OR payment_status = p_status)
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) t;

  RETURN json_build_object(
    'data', COALESCE(v_data, '[]'::json),
    'pagination', json_build_object(
      'page', p_page,
      'limit', p_limit,
      'total', v_total,
      'pages', CEIL(v_total::FLOAT / p_limit)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ FUNÇÃO: Check-in (Marcar presença via QR)
CREATE OR REPLACE FUNCTION check_in_user(p_qr_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM users WHERE qr_code = p_qr_code LIMIT 1;

  IF v_user IS NULL THEN
    RETURN json_build_object('error', 'QR Code inválido');
  END IF;

  IF v_user.payment_status NOT IN ('approved', 'paid', 'exempt') THEN
    RETURN json_build_object(
      'error', 'Seu pagamento não foi confirmado. Status: ' || v_user.payment_status
    );
  END IF;

  UPDATE users SET is_checked_in = TRUE WHERE id = v_user.id;

  RETURN json_build_object(
    'success', TRUE,
    'message', 'Check-in realizado com sucesso',
    'user_name', v_user.full_name,
    'payment_status', v_user.payment_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7️⃣ FUNÇÃO: Marcar como Pago
CREATE OR REPLACE FUNCTION mark_as_paid(p_user_id INT)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  UPDATE users 
  SET payment_status = 'paid'
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF v_user IS NULL THEN
    RETURN json_build_object('error', 'Utilizador não encontrado');
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'payment_status', 'paid',
    'message', 'Pagamento marcado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
