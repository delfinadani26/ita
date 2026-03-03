🔄 TEMPLATE PARA NOVAS TABELAS
=============================

Quando criar uma nova tabela no Supabase, siga este padrão:

---

📝 PASSO 1: Criar a Tabela

```sql
CREATE TABLE public.new_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- seus campos aqui
);
```

---

🔐 PASSO 2: Ativar RLS

```sql
-- Ativar RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Criar políticas (padrão ITA2)
CREATE POLICY "new_table_select" ON public.new_table FOR SELECT USING (true);
CREATE POLICY "new_table_insert" ON public.new_table FOR INSERT WITH CHECK (true);
CREATE POLICY "new_table_update" ON public.new_table FOR UPDATE USING (true);
CREATE POLICY "new_table_delete" ON public.new_table FOR DELETE USING (true);

-- Ativar Realtime
ALTER TABLE public.new_table REPLICA IDENTITY FULL;
```

---

📋 CHECKLIST DE CRIAÇÃO:

- [ ] Tabela criada
- [ ] RLS ativado
- [ ] 4 políticas (SELECT, INSERT, UPDATE, DELETE)
- [ ] REPLICA IDENTITY FULL configurado
- [ ] Testado em produção

---

✅ EXEMPLO: Nova tabela "events"

```sql
-- 1. Criar
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (true);
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (true);

ALTER TABLE public.events REPLICA IDENTITY FULL;
```

---

🔗 PADRÃO DE NOMES:

- SELECT: `tablename_select`
- INSERT: `tablename_insert`
- UPDATE: `tablename_update`
- DELETE: `tablename_delete`

---

⚠️ SEGURANÇA FUTURA:

Quando quiser restringir operações por usuário:

```sql
-- Apenas creator pode deletar seu próprio evento
DROP POLICY "events_delete" ON public.events;
CREATE POLICY "events_delete" ON public.events 
  FOR DELETE USING (auth.uid()::text = created_by::text);
```

---

Mantém o padrão = Fácil manutenção! 🚀
