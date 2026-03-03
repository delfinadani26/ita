-- ✅ CORRIGIR PASSWORD DO ADMIN

-- 1️⃣ Atualizar password do admin para "admin8891*1" (correctamente hasheada com bcrypt)
UPDATE users 
SET password = crypt('admin8891*1', gen_salt('bf'))
WHERE email = 'admin@urnm.ao' AND role = 'admin';

-- 2️⃣ Se nenhum admin existir com esse email, INSERT um novo
INSERT INTO users (full_name, email, password, role, payment_status, is_checked_in, created_at)
VALUES (
  'Administrator URNM',
  'admin@urnm.ao',
  crypt('admin8891*1', gen_salt('bf')),
  'admin',
  'approved',
  false,
  NOW()
)
ON CONFLICT DO NOTHING;

-- 3️⃣ Verificar resultado (execute isto para ver se funcionou)
SELECT id, full_name, email, role, payment_status 
FROM users 
WHERE role = 'admin' OR email = 'admin@urnm.ao';
