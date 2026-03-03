-- ⚡ REMOVER SISTEMA DE APROVAÇÃO - REGISTAR E ACESSO IMEDIATO

-- 1️⃣ ATUALIZAR FUNÇÃO: REGISTAR (sem aprovação pendente)
CREATE OR REPLACE FUNCTION register_participant(p_full_name TEXT, p_email TEXT, p_password TEXT, p_academic_degree TEXT, p_category TEXT, p_affiliation TEXT, p_institution TEXT, p_role TEXT DEFAULT 'participant') RETURNS JSON AS $$ 
DECLARE 
  v_user_id INT; 
  v_qr_code TEXT; 
BEGIN 
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN 
    RETURN json_build_object('error', 'Email já registado'); 
  END IF; 

  v_qr_code := 'URNM-' || DATE_PART('epoch', NOW())::TEXT || '-' || SUBSTR(MD5(p_email), 1, 8); 

  INSERT INTO users (full_name, email, password, academic_degree, category, affiliation, institution, role, qr_code, payment_status, payment_amount, is_checked_in, created_at) 
  VALUES (p_full_name, p_email, crypt(p_password, gen_salt('bf')), p_academic_degree, p_category, p_affiliation, p_institution, p_role, v_qr_code, 'approved', CASE 
    WHEN p_role = 'preletor' THEN 20000 
    WHEN p_category = 'docente_urnm' THEN 5000 
    WHEN p_category = 'docente_externo' THEN 7000 
    WHEN p_category = 'estudante_urnm' THEN 3000 
    WHEN p_category = 'estudante_externo' THEN 4000 
    WHEN p_category = 'outro_urnm' THEN 5000 
    ELSE 10000 
  END, FALSE, NOW()) 
  RETURNING id INTO v_user_id; 

  RETURN json_build_object('id', v_user_id, 'full_name', p_full_name, 'email', p_email, 'role', p_role, 'payment_status', 'approved', 'category', p_category, 'affiliation', p_affiliation, 'institution', p_institution, 'qr_code', v_qr_code, 'created_at', NOW()); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ ATUALIZAR FUNÇÃO: LOGIN (sem verificação de pending)
CREATE OR REPLACE FUNCTION login_user(p_email TEXT, p_password TEXT) RETURNS JSON AS $$ 
DECLARE 
  v_user RECORD; 
BEGIN 
  SELECT * INTO v_user FROM users WHERE email = p_email LIMIT 1; 

  IF v_user IS NULL THEN 
    RETURN json_build_object('error', 'Email ou palavra-passe incorretos'); 
  END IF; 

  IF NOT (v_user.password = crypt(p_password, v_user.password)) THEN 
    RETURN json_build_object('error', 'Email ou palavra-passe incorretos'); 
  END IF; 

  -- REMOVIDO: Bloqueio para pending 
  -- IF v_user.payment_status = 'pending' THEN ... END IF;

  IF v_user.payment_status = 'rejected' THEN 
    RETURN json_build_object('error', 'Sua inscrição foi rejeitada. Motivo: ' || COALESCE(v_user.rejection_reason, 'Não cumprimento dos critérios'), 'status', 'rejected'); 
  END IF; 

  RETURN json_build_object('id', v_user.id, 'full_name', v_user.full_name, 'email', v_user.email, 'role', v_user.role, 'payment_status', v_user.payment_status, 'category', v_user.category, 'affiliation', v_user.affiliation, 'institution', v_user.institution, 'qr_code', v_user.qr_code, 'is_checked_in', v_user.is_checked_in, 'created_at', v_user.created_at); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ IMPORTANTE: Todos os utilizadores com status 'pending' serão actualizados para 'approved'
UPDATE users SET payment_status = 'approved' WHERE payment_status = 'pending';

-- PRONTO! 
-- ✅ Novos registos = acesso imediato
-- ✅ Antigos pendentes = agora aprovados
-- ✅ Podem submeter logo após registar
