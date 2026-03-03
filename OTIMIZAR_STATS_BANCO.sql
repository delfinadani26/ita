-- ============================================
-- LIMPEZA E OTIMIZAÇÃO FINAL
-- Script para REMOVER conflitos e otimizar
-- ============================================

-- 🔴 PASSO 1: DELETAR TUDO QUE ESTAVA CONFLITANDO
DROP MATERIALIZED VIEW IF EXISTS v_participant_stats_mv CASCADE;
DROP VIEW IF EXISTS v_participant_stats CASCADE;
DROP FUNCTION IF EXISTS refresh_participant_stats() CASCADE;
DROP TRIGGER IF EXISTS update_stats_on_user_insert ON users;
DROP TRIGGER IF EXISTS update_stats_on_user_delete ON users;
DROP TRIGGER IF EXISTS update_stats_on_user_update ON users;
DROP TABLE IF EXISTS participant_stats_cache CASCADE;

-- ✅ PASSO 2: CRIAR ÍNDICES OTIMIZADOS (SUPER IMPORTANTE!)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category);
CREATE INDEX IF NOT EXISTS idx_users_affiliation ON users(affiliation);
CREATE INDEX IF NOT EXISTS idx_users_role_category_aff ON users(role, category, affiliation);
CREATE INDEX IF NOT EXISTS idx_users_participant ON users(role) WHERE role = 'participant';

-- ✅ PASSO 3: OTIMIZAR TABELA (muito importante!)
ANALYZE users;

-- ✅ PASSO 4: CRIAR UMA ÚNICA VIEW SIMPLES E RÁPIDA
CREATE OR REPLACE VIEW v_participant_stats AS
SELECT 
  category,
  affiliation,
  COUNT(*) as count
FROM users 
WHERE role = 'participant'
GROUP BY category, affiliation;

-- ✅ PASSO 5: VERIFICAR QUE TUDO FOI CRIADO
SELECT 'Views' as type, viewname FROM pg_views WHERE viewname LIKE '%participant%'
UNION ALL
SELECT 'Indices', indexname FROM pg_indexes WHERE tablename = 'users';

-- ✅ PASSO 6: TESTAR A VIEW
SELECT * FROM v_participant_stats ORDER BY category, affiliation;

-- ✅ PASSO 7: CONTAR TOTAL
SELECT COUNT(*) as total_participants 
FROM users 
WHERE role = 'participant';

-- ============================================
-- PRONTO! Agora está otimizado e sem conflitos
-- ============================================

