# 📋 INSTRUÇÕES PARA ATUALIZAR A BASE DE DADOS

## Situação Atual (03 de Março de 2026)

Foram identificados e corrigidos os seguintes problemas:

1. ✅ **PASSWORD URL-ENCODED** - A senha no `.env` foi corrigida para usar `%2A` em vez de `*`
2. ✅ **ENDPOINT PÚBLICO** - Criado `/api/public/stats` que retorna estatísticas sem autenticação
3. ✅ **LOGS DE DEBUG** - Adicionados para diagnosticar problemas
4. ✅ **QUERY MELHORADA** - A função `getUserStats()` agora inicializa todos os keys corretamente

---

## 🚀 Como Executar o Script SQL

### Opção 1: Via Supabase Console (Recomendado)

1. Aceda a **https://app.supabase.com**
2. Seleccione o seu projeto
3. Vá para **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `UPDATE_DATABASE_2026-03-03.sql`
6. Clique em **Run** (ou CTRL + ENTER)

### Opção 2: Via pgAdmin (Se tem acesso)

1. Conecte ao seu banco PostgreSQL
2. Abra um novo SQL Query
3. Cole o conteúdo do arquivo SQL
4. Execute

### Opção 3: Via Terminal (Linux/Mac)

```bash
psql postgresql://postgres:Isaiasqueta*33@vmboexvqywxlkrhphfpl.supabase.co:5432/postgres < UPDATE_DATABASE_2026-03-03.sql
```

---

## 📝 O Que o Script Faz

### Parte 1: Diagnóstico
- Verifica a estrutura da tabela `users`
- Conta total de utilizadores e breakdown por role
- Identifica dados ausentes ou inválidos

### Parte 2: Limpeza de Dados
- Corrige participantes sem `category` → atribui `'outro'`
- Corrige participantes sem `affiliation` → atribui `'externo'`
- Garante que `payment_status` não está vazio
- Remove duplicados por email (opcional)

### Parte 3: Optimização
- Cria índices para melhorar performance
- Cria uma VIEW para facilitar consultas de estatísticas

### Parte 4: Dados de Teste (Opcional)
- Se descomnentar as secções comentadas, insere 10 participantes de exemplo

---

## ✅ Passos Recomendados

1. **Execute a Parte 1 (Diagnóstico)** primeiro:
   - Vê quantos participantes tem
   - Identifica problemas de dados

2. **Revise os Resultados**:
   - Se não há problemas, pode pular a Parte 2
   - Se há dados inválidos, execute a Parte 2

3. **Execute a Parte 3 (Índices)**:
   - Melhora a performance
   - Sem efeitos colaterais

4. **Opcional - Teste com Dados Fictícios**:
   - Descomente a Parte 8 se quiser inserir 10 participantes de teste
   - Veja os cartões aparecerem na app

---

## 🔍 Verificações Pós-Execução

Depois de executar o script, verifique no Supabase:

```sql
-- Deve mostrar todos os participantes
SELECT COUNT(*) FROM users WHERE role = 'participant';

-- Deve mostrar distribuição por categoria
SELECT category, affiliation, COUNT(*) 
FROM users 
WHERE role = 'participant'
GROUP BY category, affiliation;
```

---

## 🐛 Se Ainda Tiver Zeros

Se os cartões continuarem a zero após executar o script:

1. **Limpe o cache da app** (Settings → App Info → Clear Cache)
2. **Recarregue a página** (Pull-to-refresh)
3. **Verifique o endpoint**:
   ```bash
   curl http://10.129.63.84:5000/api/public/stats
   ```

---

## 📊 Estrutura da Tabela `users`

A tabela deve ter estas colunas:

```
id (INTEGER) - PK
full_name (TEXT) - Nome completo
email (VARCHAR) - Email único
password (TEXT) - Hash da password
academic_degree (TEXT) - Grau académico
category (TEXT) - 'docente' | 'estudante' | 'outro' | 'preletor'
affiliation (TEXT) - 'urnm' | 'externo'
institution (TEXT) - Instituição
role (TEXT) - 'participant' | 'admin' | 'avaliador'
payment_status (TEXT) - 'pending' | 'approved' | 'paid' | 'exempt'
payment_amount (NUMERIC) - Montante em Kz
is_checked_in (BOOLEAN) - Se passou check-in
qr_code (VARCHAR) - Código QR único
created_at (TIMESTAMP) - Data de criação
```

---

## 🆘 Suporte

Se encontrar erros ao executar o script:

1. Copie a mensagem de erro
2. Verifique se a password tem os caracteres certos
3. Verifique as permissões na base de dados
4. Contacte o suporte do Supabase se necessário

---

## 📌 Notas Importantes

- ⚠️ **NÃO delete dados sem backup**
- ⚠️ **Teste em desenvolvimento primeiro se possível**
- ✅ O script é idempotente (pode executar múltiplas vezes)
- ✅ As VIEWs e índices são criados com `CREATE OR REPLACE / CREATE IF NOT EXISTS`
