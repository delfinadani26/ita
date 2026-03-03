-- Criar usuário admin na tabela users
-- Execute este script no Supabase SQL Editor

INSERT INTO public.users (
  full_name,
  email,
  password,
  category,
  affiliation,
  role,
  payment_status,
  is_checked_in,
  qr_code
) VALUES (
  'Administrator URNM',
  'admin@urnm.ao',
  'admin8891****1', -- Nota: Na produção, use hash bcrypt
  'outro',
  'urnm',
  'admin', -- ← Role de admin
  'paid', -- Admin já pago
  true, -- Já check-in
  'URNM-ADMIN-' || to_char(now(), 'YYYYMMDD-HH24MISS')
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  payment_status = 'paid',
  is_checked_in = true
RETURNING id, full_name, email, role, created_at;
