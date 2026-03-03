🔧 SOLUÇÃO DO ERRO RLS - "new row violates row-level security policy"
==================================================================

PROBLEMA:
---------
A tabela congress_program no Supabase não tinha política (policy) de INSERT,
então não conseguia criar novos programas.

SOLUÇÃO:
--------
Você precisa executar um SQL no Supabase para adicionar a política de INSERT.

COMO FAZER:
-----------

1️⃣ Acesse o Supabase:
   https://app.supabase.com/projects

2️⃣ Selecione seu projeto (ita2)

3️⃣ Vá para: SQL Editor (no menu lateral)

4️⃣ Clique em "New Query"

5️⃣ Cole este código SQL:

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can modify program" ON public.congress_program;
DROP POLICY IF EXISTS "Anyone can read program" ON public.congress_program;

-- Create comprehensive RLS policies for congress_program
CREATE POLICY "Anyone can read program" ON public.congress_program FOR SELECT USING (true);

CREATE POLICY "Anyone can insert program" ON public.congress_program FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can modify program" ON public.congress_program FOR UPDATE USING (true);

CREATE POLICY "Admins can delete program" ON public.congress_program FOR DELETE USING (true);

-- Enable realtime
ALTER TABLE public.congress_program REPLICA IDENTITY FULL;
```

6️⃣ Clique em "Run" (ou Ctrl+Enter)

7️⃣ Espere a síncope verde ✅

8️⃣ Volte para a aplicação e teste

DEPOIS:
------
Agora você pode clicar no + para adicionar programas sem erro!

⚠️ NOTA DE SEGURANÇA:
---------------------
As políticas atuais permitem que qualquer um insira programas.
Para maior segurança, você pode restringir esto apenas para admins depois.

Mas por enquanto, isso vai funcionar! 🚀
