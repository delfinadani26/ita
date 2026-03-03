-- ============================================
-- FIX AUTOMÁTICO - CONVERTER USERS PARA PARTICIPANTS
-- CSA 2026 - Solução rápida
-- ============================================

-- ⚠️ IMPORTANTE: Faça backup ANTES de executar!

-- ============================================

-- OPÇÃO 1: VER SITUAÇÃO ANTES DE FAZER ALTERAÇÕES
-- Execute PRIMEIRO para ver o que vai mudar:

SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN role = 'participant' THEN 1 END) as are_participants,
  COUNT(CASE WHEN role NOT IN ('participant', 'admin', 'avaliador') THEN 1 END) as need_fix,
  COUNT(CASE WHEN role IS NULL OR role = '' THEN 1 END) as empty_role
FROM users;

-- ============================================

-- OPÇÃO 2: CONVERTER USERS "ERRADOS" PARA PARTICIPANT
-- Qualquer utilizador que NÃO seja admin e NÃO seja avaliador 
-- será convertido para 'participant'

UPDATE users
SET role = 'participant'
WHERE role NOT IN ('participant', 'admin', 'avaliador')
  OR role IS NULL 
  OR role = '';

-- Verificar resultado
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role;

-- ============================================

-- OPÇÃO 3: GARANTIR QUE TODOS OS PARTICIPANTS TÊMCATEGORY E AFFILIATION

UPDATE users
SET category = 'estudante'
WHERE role = 'participant' AND (category IS NULL OR category = '');

UPDATE users
SET affiliation = 'urnm'
WHERE role = 'participant' AND (affiliation IS NULL OR affiliation = '');

UPDATE users
SET payment_status = 'pending'
WHERE role = 'participant' AND (payment_status IS NULL OR payment_status = '');

-- Verificar
SELECT 
  COUNT(*) as total_participants,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as no_category,
  COUNT(CASE WHEN affiliation IS NULL THEN 1 END) as no_affiliation,
  COUNT(CASE WHEN payment_status IS NULL THEN 1 END) as no_payment_status
FROM users
WHERE role = 'participant';

-- ============================================

-- OPÇÃO 4: VER RESUMO FINAL
SELECT 
  category,
  affiliation,
  COUNT(*) as count,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN payment_status = 'approved' THEN 1 END) as approved
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation
ORDER BY category, affiliation;

-- Total geral
SELECT COUNT(*) as total_participants FROM users WHERE role = 'participant';

-- ============================================
-- FIM DO FIX
-- ============================================
