-- ============================================
-- DIAGNÓSTICO COMPLETO - PROBLEMA DE CONTAGEM
-- CSA 2026 - Diagnosticar por que não há participantes
-- ============================================

-- ✅ PASSO 1: Ver TODOS os utilizadores e seus roles
SELECT 
  id,
  full_name,
  email,
  role,
  category,
  affiliation,
  payment_status,
  created_at
FROM users
ORDER BY id DESC
LIMIT 50;  -- Primeiros 50 utilizadores

-- ============================================

-- ✅ PASSO 2: Contar por CADA role individual
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role;

-- Se a query anterior retorna vazio, execute:
SELECT DISTINCT role FROM users;

-- ============================================

-- ✅ PASSO 3: Verificar se há utilizadores com role = 'participant'
SELECT COUNT(*) as participant_count
FROM users
WHERE role = 'participant';

-- ============================================

-- ✅ PASSO 4: Se houver participantes, ver breakdown por categoria
SELECT 
  category,
  affiliation,
  COUNT(*) as count
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation
ORDER BY category, affiliation;

-- ============================================

-- ✅ PASSO 5: Ver todos os valores ÚNICOS de cada coluna
SELECT DISTINCT role FROM users;
SELECT DISTINCT category FROM users;
SELECT DISTINCT affiliation FROM users;
SELECT DISTINCT payment_status FROM users;

-- ============================================

-- ✅ PASSO 6: Contar utilizadores por combinação de role + category
SELECT 
  role,
  category,
  COUNT(*) as count
FROM users
GROUP BY role, category
ORDER BY role, category;

-- ============================================

-- ✅ PASSO 7: Verificar se há utilizadores SEM role (NULL ou vazio)
SELECT COUNT(*) as users_without_role
FROM users
WHERE role IS NULL OR role = '' OR role = 'null';

-- ============================================

-- ✅ PASSO 8: Tabela completa de diagnóstico
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'participant' THEN 1 END) as participants,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'avaliador' THEN 1 END) as reviewers,
  COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role,
  COUNT(CASE WHEN role = '' THEN 1 END) as empty_role,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as null_category,
  COUNT(CASE WHEN affiliation IS NULL THEN 1 END) as null_affiliation
FROM users;

-- ============================================
-- FIM DO DIAGNÓSTICO
-- ============================================
