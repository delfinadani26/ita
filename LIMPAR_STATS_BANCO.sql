-- ============================================
-- LIMPEZA: REMOVER v_participant_stats
-- Script para eliminar a view de participantes
-- ============================================

-- 🔴 PASSO 1: DELETAR A VIEW (se existir)
DROP VIEW IF EXISTS v_participant_stats CASCADE;

-- 🔴 PASSO 2: DELETAR MATERIALIZED VIEW (se existir)
DROP MATERIALIZED VIEW IF EXISTS v_participant_stats_mv CASCADE;

-- 🔴 PASSO 3: DELETAR FUNÇÃO ASSOCIADA (se existir)
DROP FUNCTION IF EXISTS refresh_participant_stats() CASCADE;

-- 🔴 PASSO 4: DELETAR TRIGGERS ASSOCIADOS (se existirem)
DROP TRIGGER IF EXISTS update_stats_on_user_insert ON users;
DROP TRIGGER IF EXISTS update_stats_on_user_delete ON users;
DROP TRIGGER IF EXISTS update_stats_on_user_update ON users;

-- 🔴 PASSO 5: DELETAR TABELA DE CACHE (se existir)
DROP TABLE IF EXISTS participant_stats_cache CASCADE;

-- ✅ VERIFICAR QUE TUDO FOI REMOVIDO
SELECT 
  'Views removidas' as status,
  COUNT(*) as views_restantes
FROM pg_views 
WHERE schemaname = 'public' AND viewname LIKE '%participant%';

-- ============================================
-- PRONTO! Limpeza completa concluída
-- ============================================
