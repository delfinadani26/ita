-- Resetar password do admin com todos os campos required preenchidos
UPDATE users 
SET 
  password = crypt('admin8891*1', gen_salt('bf')),
  category = 'docente',
  affiliation = 'urnm',
  role = 'admin',
  payment_status = 'approved'
WHERE email = 'admin@urnm.ao';
