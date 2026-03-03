-- 📋 Script para adicionar campos de auditoria e rejeição à tabela users
-- Execute isto no Supabase SQL Editor

-- Adicionar coluna approved_at para rastrear quando foi aprovado
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP DEFAULT NULL;

-- Adicionar coluna rejection_reason para motivo de rejeição
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Renomear payment_status "rejected" (se necessário)
-- UPDATE users SET payment_status = 'rejected' WHERE payment_status = 'rejected';

-- Criar índice para query rápida por status
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_approved_at ON users(approved_at DESC);

-- Verificar estrutura da tabela
-- \d users;
