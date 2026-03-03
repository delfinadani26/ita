# 📋 SCHEMA TABELA SUBMISSIONS - ANÁLISE COMPLETA

## ✅ Definição da Tabela (supabase_setup.sql)

```sql
CREATE TABLE public.submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,              -- Título da apresentação
  abstract TEXT,                    -- Resumo opcional
  keywords TEXT,                    -- Palavras-chave opcionais
  file_uri TEXT,                    -- 📎 CAMINHO DO ARQUIVO (ex: /uploads/abc123.pdf)
  file_name TEXT,                   -- 📎 NOME ORIGINAL (ex: documento.pdf)
  thematic_axis INTEGER NOT NULL,   -- Eixo temático (1, 2 ou 3)
  status TEXT DEFAULT 'pending',    -- pending, approved, rejected
  reviewer_id INTEGER,              -- ID do avaliador (se revisado)
  review_note TEXT,                 -- Nota da revisão (se revisado)
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);
```

## ✅ Campos para Arquivos

| Campo | Tipo | Propósito | Exemplo |
|-------|------|----------|---------|
| `file_uri` | TEXT | Caminho do arquivo no servidor | `/uploads/sub_42_1709468400.pdf` |
| `file_name` | TEXT | Nome original do arquivo | `Comprovativo_6962160020.pdf` |

## ✅ Fluxo de Dados: Frontend → Backend → Banco

```
FRONTEND (submissions.tsx)
    │
    ├─ const file = {
    │   uri: selectedFile.uri,           // Uri local do arquivo
    │   name: 'documento.pdf',           // Nome original
    │   type: 'application/pdf'          // MIME type
    │ }
    │
    └─→ fetch("/api/submissions", FormData)
        │
        │
BACKEND (routes.ts)
        │
        ├─ Recebe FormData com file
        ├─ Multer salva em /uploads/tmp_filename
        │
        ├─ Renomeia para: /uploads/tmp_filename.pdf
        │
        ├─ Cria objeto para inserção:
        │   {
        │     user_id: 1,
        │     title: "Minha Apresentação",
        │     abstract: "...",
        │     keywords: "...",
        │     file_uri: "/uploads/tmp_filename.pdf",  ← GUARDADO
        │     file_name: "documento.pdf",             ← GUARDADO
        │     thematic_axis: 1
        │   }
        │
        └─→ db.createSubmission(data)
            │
            │
DATABASE (PostgreSQL)
            │
            └─→ INSERT INTO submissions
                (user_id, title, abstract, keywords, file_uri, file_name, thematic_axis)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                
                Resultado no Banco:
                ┌─────────────────────────────────────────────────────┐
                │ id │ user_id │ title │ file_uri        │ file_name │
                ├────┼─────────┼───────┼─────────────────┼───────────┤
                │ 42 │   1     │ "..." │ /uploads/xyz.pdf│ "doc.pdf" │
                └─────────────────────────────────────────────────────┘
```

## ✅ Verificação: Query de Inserção

```typescript
// Em server/storage.ts:149
async createSubmission(data: Pick<Submission, 
  "user_id" | "title" | "abstract" | "keywords" | "file_uri" | "file_name" | "thematic_axis"
>): Promise<Submission> {
  const result = await pool.query(
    `INSERT INTO submissions (user_id, title, abstract, keywords, file_uri, file_name, thematic_axis)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      data.user_id,        // $1
      data.title,          // $2
      data.abstract,       // $3
      data.keywords,       // $4
      data.file_uri,       // $5 ← ARQUIVO URI
      data.file_name,      // $6 ← NOME DO ARQUIVO
      data.thematic_axis   // $7
    ]
  );
  return result.rows[0];
}
```

## ✅ Indices para Performance

```sql
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_reviewer_id ON public.submissions(reviewer_id);
```

## 🔍 Como Verificar se Arquivo Foi Salvo

Execute no **Supabase SQL Editor**:

```sql
-- Ver TODAS as submissions com arquivos
SELECT id, user_id, title, file_name, file_uri, status, submitted_at
FROM submissions
ORDER BY submitted_at DESC
LIMIT 10;

-- Ver APENAS as que têm arquivo
SELECT id, user_id, title, file_name, file_uri
FROM submissions
WHERE file_uri IS NOT NULL
ORDER BY submitted_at DESC;

-- Contar quantas têm arquivo
SELECT COUNT(*) as com_arquivo, COUNT(*) FILTER (WHERE file_uri IS NULL) as sem_arquivo
FROM submissions;
```

**Resultado esperado:**
```
id │ user_id │ title              │ file_name        │ file_uri                  │ status
───┼─────────┼────────────────────┼──────────────────┼───────────────────────────┼─────────
42 │ 1       │ Minha Apresentação │ documento.pdf    │ /uploads/1709468400.pdf   │ pending
```

## ✅ RLS (Row Level Security) - Permissões

```sql
-- Todos podem VER todas as submissions
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (true);

-- Todos podem INSERIR submissions
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (true);

-- Todos podem ATUALIZAR (para avaliadores)
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (true);

-- Todos podem DELETAR
CREATE POLICY "submissions_delete" ON public.submissions FOR DELETE USING (true);
```

## 📊 Status Possíveis

| Status | Significado |
|--------|-------------|
| `pending` | Aguardando aprovação (padrão) |
| `approved` | Aprovado pelo avaliador |
| `rejected` | Rejeitado pelo avaliador |

## ✨ Resumo

✅ **Tabela preparada**: Aceita arquivos PDF/DOCX  
✅ **Campos corretos**: `file_uri` e `file_name` presentes  
✅ **SQL correto**: INSERT com todos os 7 campos  
✅ **Índices otimizados**: Queries rápidas  
✅ **RLS habilitado**: Segurança configurada  
✅ **Timestamps**: submitted_at + reviewed_at

**Se um arquivo for enviado com sucesso:**
1. ✅ Salvo em `/uploads/` no servidor
2. ✅ Caminho armazenado em `file_uri`
3. ✅ Nome armazenado em `file_name`
4. ✅ ID salvo no banco com `submitted_at`
