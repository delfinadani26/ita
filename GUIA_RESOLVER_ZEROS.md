# 🔍 GUIA COMPLETO PARA RESOLVER O PROBLEMA DOS ZEROS

## Problema
Os cartões de "Participantes Registados" continuam com valor 0 mesmo após atualizar a base de dados.

---

## 🚨 CAUSA MAIS PROVÁVEL

Os utilizadores foram registados com `role` diferente de `'participant'`. Podem estar com:
- `role = 'admin'` 
- `role = 'avaliador'`
- `role = NULL` (vazio)
- `role` com outro valor inesperado

---

## 📋 PASSO 1: DIAGNÓSTICO

### Execute no Supabase Console:

1. Aceda a **https://app.supabase.com**
2. Vá para **SQL Editor → New Query**
3. Cole o conteúdo de **DIAGNOSTICO_RAPIDO.sql**
4. Clique em **Run**

### O que vai ver:

```
role         count
------       -----
participant  0      ← AQUI está o problema!
admin        5      ← Possivelmente os seus users
avaliador    0
null         0
```

Se `participant = 0` e `admin > 0`, significa que todos os seus utilizadores estão registados como `admin` ou outro role.

---

## 📋 PASSO 2: CONVERTER PARA PARTICIPANT

### Se o diagnostico mostrou que NÃO há participants:

1. Abra **SQL Editor → New Query**
2. Cole o conteúdo de **FIX_PARTICIPANTES_ZERO.sql**
3. Execute **PRIMEIRO** a Opção 1 só para ver o que vai mudar
4. Depois execute a **Opção 2** para fazer o fix

```sql
-- Este comando converte todos os users não-admin para participant
UPDATE users
SET role = 'participant'
WHERE role NOT IN ('participant', 'admin', 'avaliador')
  OR role IS NULL 
  OR role = '';
```

---

## 📋 PASSO 3: GARANTIR que TODOS têm CATEGORY e AFFILIATION

Execute a **Opção 3** do FIX_PARTICIPANTES_ZERO.sql:

```sql
-- Atribuir valores padrão se estiverem vazios
UPDATE users
SET category = 'estudante'
WHERE role = 'participant' AND (category IS NULL OR category = '');

UPDATE users
SET affiliation = 'urnm'
WHERE role = 'participant' AND (affiliation IS NULL OR affiliation = '');

UPDATE users
SET payment_status = 'pending'
WHERE role = 'participant' AND (payment_status IS NULL OR payment_status = '');
```

---

## 📋 PASSO 4: VERIFICAÇÃO FINAL

Execute a **Opção 4** para ver o resumo:

```sql
SELECT 
  category,
  affiliation,
  COUNT(*) as count
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation
ORDER BY category, affiliation;
```

Deve mostrar algo como:
```
category     affiliation   count
----------   -----------   -----
estudante    urnm          5
docente      externo       2
outro        urnm          1
preletor     externo       1
```

---

## 🚀 PASSO 5: RECARREGAR A APP

1. **No seu telemóvel/browser:**
   - Feche a app completamente
   - Limpe o cache (Settings → App Info → Clear Cache)
   - Reabra a app

2. **OU pull-to-refresh:**
   - Deslize para baixo na página inicial
   - Espere pelos dados carregarem

---

## 🔗 PASSO 6: VERIFICAR ENDPOINT

Se ainda não funcionar, teste o endpoint diretamente:

```bash
# No terminal/PowerShell:
curl "http://10.129.63.84:5000/api/public/stats"
```

Deve retornar:
```json
{
  "docente_urnm": 0,
  "docente_externo": 2,
  "estudante_urnm": 5,
  "estudante_externo": 0,
  "outro_urnm": 1,
  "outro_externo": 0,
  "preletor_urnm": 0,
  "preletor_externo": 1,
  "_total": 9
}
```

Se `/api/public/stats` retorna apenas `0`, significa que  NÃO há `role = 'participant'` no banco.

---

## 🎯 RESUMO RÁPIDO (Copiar e Colar)

Execute ESTA sequência no Supabase Console, um de cada vez:

### Query 1 - Ver situação:
```sql
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

### Query 2 - Converter (se necessário):
```sql
UPDATE users
SET role = 'participant'
WHERE role NOT IN ('participant', 'admin', 'avaliador')
  OR role IS NULL 
  OR role = '';
```

### Query 3 - Garantir dados válidos:
```sql
UPDATE users
SET category = 'estudante',
    affiliation = 'urnm',
    payment_status = 'pending'
WHERE role = 'participant' AND (
  category IS NULL OR affiliation IS NULL OR payment_status IS NULL
);
```

### Query 4 - Verificar resultado:
```sql
SELECT category, affiliation, COUNT(*) as count
FROM users
WHERE role = 'participant'
GROUP BY category, affiliation;
```

---

## ❌ SE AINDA NÃO FUNCIONAR

Possíveis problemas:

### 1. **O servidor não está a rodar**
```bash
$env:NODE_ENV="development"; npx tsx server/index.ts
```

### 2. **Cache da app não limpou**
- Uninstall completo da app
- Reinstalar
- Limpar browser cache

### 3. **Database URL está incorreta**
Verificar `.env`:
```
DATABASE_URL=postgresql://postgres:Isaiasqueta%2A33@vmboexvqywxlkrhphfpl.supabase.co:5432/postgres
```
Note o `%2A` em vez de `*`

### 4. **Participantes com values inesperados**
```sql
SELECT DISTINCT role FROM users;
SELECT DISTINCT category FROM users;
SELECT DISTINCT affiliation FROM users;
```

---

## 🔧 SCRIPT NUCLEAR (Opção final)

Se nada funcionar, delete TODOS os users e comece do zero:

```sql
-- ⚠️ APENAS se souber o que está a fazer!
DELETE FROM users WHERE role != 'admin';
```

Depois registado 1 utilizador novo via app para testar.

---

## 📞 CHECKLIST FINAL

- [ ] Executei DIAGNOSTICO_RAPIDO.sql
- [ ] Vi quantos participants existem
- [ ] Se 0, executei FIX_PARTICIPANTES_ZERO.sql para converter
- [ ] Recarreguei a app
- [ ] Pull-to-refresh funciona
- [ ] Endpoint `/api/public/stats` retorna números
- [ ] Cartões mostram números > 0

Se conseguiu fazer tudo isto e ainda tem 0, há um problema não identificado. Nesse caso, mostre-me o resultado exato de:

```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

---

## 💡 DICA FINAL

A contagem de "Participantes Registados" é baseada APENAS em:
- `WHERE role = 'participant'` ✅
- Agrupado por `category` e `affiliation`

Não depende de:
- `payment_status` (pode ser pending, approved, paid, etc)
- `is_checked_in` (pode ser true ou false)
- Qualidade dos dados (funcionará mesmo com null se não corrigir)

Apenas o `role` determina se aparece ou não!
