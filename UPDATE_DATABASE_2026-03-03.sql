-- ============================================
-- SCRIPT DE ATUALIZAÇÃO DA BASE DE DADOS
-- CSA 2026 - Congresso de Alimentação
-- Data: 03 de Março de 2026
-- ============================================

-- 1. VERIFICAR A ESTRUTURA DA TABELA USERS
-- Execute este comando para verificar os campos existentes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ============================================

-- 2. CONTAR PARTICIPANTES ATUAIS
-- Total de utilizadores
SELECT COUNT(*) as total_users FROM users;

-- Breakdown por role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role
ORDER BY count DESC;

-- Breakdown de participantes por categoria
SELECT category, affiliation, COUNT(*) as count
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation
ORDER BY category, affiliation;

-- ============================================

-- 3. VERIFICAR SE HÁ PROBLEMAS NOS DADOS
-- Utilizadores sem role definido
SELECT COUNT(*) as count_no_role
FROM users
WHERE role IS NULL OR role = '';

-- Participantes sem categoria
SELECT COUNT(*) as count_no_category
FROM users
WHERE role = 'participant' AND (category IS NULL OR category = '');

-- Participantes sem afiliação
SELECT COUNT(*) as count_no_affiliation
FROM users
WHERE role = 'participant' AND (affiliation IS NULL OR affiliation = '');

-- ============================================

-- 4. CORRIGIR DADOS VAZIOS OU INVÁLIDOS (Se necessário)
-- Se houver participantes sem categoria, atribuir uma padrão
UPDATE users
SET category = 'outro'
WHERE role = 'participant' AND (category IS NULL OR category = '');

-- Se houver participantes sem afiliação, atribuir uma padrão
UPDATE users
SET affiliation = 'externo'
WHERE role = 'participant' AND (affiliation IS NULL OR affiliation = '');

-- Se houver utilizadores sem role, mudar para participant
UPDATE users
SET role = 'participant'
WHERE role IS NULL OR role = '';

-- ============================================

-- 5. GARANTIR QUE TODOS OS PARTICIPANTES TÊM PAYMENT_STATUS
-- Definir payment_status para 'pending' se estiver vazio
UPDATE users
SET payment_status = 'pending'
WHERE role = 'participant' AND (payment_status IS NULL OR payment_status = '');

-- ============================================

-- 6. CRIAR VIEW PARA ESTATÍSTICAS (Opcional - facilita consultas)
CREATE OR REPLACE VIEW v_participant_stats AS
SELECT 
  category,
  affiliation,
  COUNT(*) as participants_count,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN payment_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN is_checked_in = true THEN 1 END) as checked_in_count
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation
ORDER BY category, affiliation;

-- Testar a view
SELECT * FROM v_participant_stats;

-- ============================================

-- 7. CONSULTAS FINAIS DE VERIFICAÇÃO
-- Total geral de participantes
SELECT COUNT(*) as total_participants
FROM users
WHERE role = 'participant';

-- Todos os participantes agrupados por categoria/afiliação
SELECT 
  category,
  affiliation,
  CONCAT(category, '_', affiliation) as key,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'participant'), 2) as percentage
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation
ORDER BY category, affiliation;

-- Estatísticas de pagamento
SELECT 
  payment_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'participant'), 2) as percentage
FROM users
WHERE role = 'participant'
GROUP BY payment_status
ORDER BY payment_status;

-- ============================================

-- 8. EXEMPLOS DE DADOS DE TESTE (Se quiser inserir dados para teste)
-- DESCOMENTE AS LINHAS ABAIXO PARA INSERIR DADOS DE TESTE

/*
-- Inserir 5 estudantes URNM
INSERT INTO users (full_name, email, password, academic_degree, category, affiliation, institution, role, payment_status, payment_amount, qr_code)
VALUES 
  ('João Silva', 'joao.silva@test.com', 'hashed_password', 'Licenciado', 'estudante', 'urnm', 'URNM', 'participant', 'pending', 3000, 'QR-001'),
  ('Maria Santos', 'maria.santos@test.com', 'hashed_password', 'Licenciado', 'estudante', 'urnm', 'URNM', 'participant', 'approved', 3000, 'QR-002'),
  ('Carlos Oliveira', 'carlos.oliveira@test.com', 'hashed_password', 'Licenciado', 'estudante', 'urnm', 'URNM', 'participant', 'paid', 3000, 'QR-003'),
  ('Ana Costa', 'ana.costa@test.com', 'hashed_password', 'Licenciado', 'estudante', 'urnm', 'URNM', 'participant', 'pending', 3000, 'QR-004'),
  ('Pedro Ferreira', 'pedro.ferreira@test.com', 'hashed_password', 'Licenciado', 'estudante', 'urnm', 'URNM', 'participant', 'pending', 3000, 'QR-005');

-- Inserir 3 docentes externos
INSERT INTO users (full_name, email, password, academic_degree, category, affiliation, institution, role, payment_status, payment_amount, qr_code)
VALUES 
  ('Dr. Paulo Mendez', 'paulo.mendez@test.com', 'hashed_password', 'Doutor', 'docente', 'externo', 'Universidade X', 'participant', 'paid', 7000, 'QR-006'),
  ('Dr. Sofia Gomes', 'sofia.gomes@test.com', 'hashed_password', 'Doutor', 'docente', 'externo', 'Universidade Y', 'participant', 'paid', 7000, 'QR-007'),
  ('Dr. Nuno Dias', 'nuno.dias@test.com', 'hashed_password', 'Doutor', 'docente', 'externo', 'Universidade Z', 'participant', 'pending', 7000, 'QR-008');

-- Inserir 2 preladores
INSERT INTO users (full_name, email, password, academic_degree, category, affiliation, institution, role, payment_status, payment_amount, qr_code)
VALUES 
  ('Prof. Jorge Lima', 'jorge.lima@test.com', 'hashed_password', 'Doutor', 'preletor', 'urnm', 'URNM', 'participant', 'paid', 20000, 'QR-009'),
  ('Prof. Teresa Alves', 'teresa.alves@test.com', 'hashed_password', 'Doutor', 'preletor', 'externo', 'Universidade Externa', 'participant', 'paid', 20000, 'QR-010');
*/

-- ============================================

-- 9. SCRIPT PARA LIMPAR DADOS DUPLICADOS (Se necessário)
-- Encontrar utilizadores duplicados por email
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Para eliminar duplicados (manter o ID mais recente)
-- DELETE FROM users
-- WHERE id NOT IN (
--   SELECT MAX(id)
--   FROM users
--   GROUP BY email
-- );

-- ============================================

-- 10. GARANTIR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_category_affiliation ON users(category, affiliation);
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================

-- 11. COMANDOS DE DIAGNÓSTICO FINAIS
-- Resumo completo da tabela users
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN role = 'participant' THEN 1 END) as participants,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'avaliador' THEN 1 END) as reviewers,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as null_category,
  COUNT(CASE WHEN affiliation IS NULL THEN 1 END) as null_affiliation
FROM users;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
