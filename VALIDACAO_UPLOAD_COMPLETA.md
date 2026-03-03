# 📄 VALIDAÇÃO COMPLETA DE UPLOADS - FRONTEND + BACKEND

## ✅ O Que Foi Corrigido

### 1. **Frontend (submissions.tsx)**
✅ Validação de **extensão** (.pdf, .doc, .docx)  
✅ Validação de **tamanho máximo** (10MB)  
✅ Detecção automática de **MIME type**  
✅ Logging detalhado de cada etapa  
✅ Mensagens de erro específicas  

### 2. **Backend Middleware (routes.ts)**
✅ **Multer fileFilter** agora rejeita tipos inválidos com erro explícito  
✅ **Error handler global** captura e trata erros de multer  
✅ Logging completo com timestamps  
✅ Resposta com código de erro específico (INVALID_FILE_TYPE, FILE_TOO_LARGE, etc)  

### 3. **Database (storage.ts)**
✅ Campos `file_uri`, `file_name` obrigatórios para persistência  
✅ Query `createSubmission` armazena referência do arquivo  

---

## 🔄 Fluxo Completo de Upload

```
FRONTEND (Frontend/Browser)
    ↓
1. Usuario clica "Submeter"
2. Validação LOCAL:
   - Arquivo selecionado? ✓
   - Extensão válida (.pdf/.doc/.docx)? ✓
   - Tamanho < 10MB? ✓
   - MIME type detectado ✓
    ↓
3. FormData construído:
   - title, abstract, keywords, thematic_axis
   - file (com nome, URI, MIME type)
    ↓
4. POST para /api/submissions
    ↓

SERVER (Backend/Node.js)
    ↓
5. Multer intercepta request:
   - Verifica Content-Type ✓
   - Verifica tamanho (limit: 10MB) ✓
   - Executa fileFilter:
     * Valida extensão (.pdf/.doc/.docx)
     * Se inválida → retorna erro
     * Se válida → aceita arquivo ✓
    ↓
6. Arquivo salvo em /uploads/
    ↓
7. Endpoint /api/submissions processa:
   - Renomeia arquivo
   - Insere record no banco
   - Retorna JSON com ID submissão
    ↓
8. Error handler global captura qualquer erro:
   - Multer errors (file size, etc)
   - File type errors
   - Database errors
   - Retorna resposta com código específico
    ↓

DATABASE (PostgreSQL)
    ↓
9. Record inserido em `submissions` com:
   - user_id
   - title, abstract, keywords
   - file_uri: /uploads/...
   - file_name: original name
   - thematic_axis
   - created_at timestamp
    ↓

FRONTEND RESPONSE
    ↓
10. Se sucesso (200):
    - Limpar forma
    - Recarregar lista de submissions
    - Mostrar "Sucesso!"
    
11. Se erro:
    - Mostrar mensagem específica:
      * "Tipo de ficheiro não suportado"
      * "Ficheiro muito grande"
      * "Erro ao submeter"
    - Permitir retry
```

---

## 🧪 Como Testar

### Teste 1: Arquivo Inválido
**Ação**: Tentar enviar arquivo .txt ou .jpg  
**Esperado**: Erro "Tipo de ficheiro não suportado"  
**Onde**: Frontend valida ANTES de enviar

### Teste 2: Arquivo Grande Demais
**Ação**: Tentar enviar PDF > 10MB  
**Esperado**: Erro "Ficheiro muito grande"  
**Onde**: Frontend valida, Backend também rejeita com 413

### Teste 3: Arquivo Válido
**Ação**: Enviar PDF/DOC/DOCX < 10MB  
**Esperado**: 
- Progress bar sobe para 95% durante envio
- Depois 100%
- Mensagem "Submissão bem-sucedida!"
- Arquivo aparece na lista de submissões

### Teste 4: Sem Arquivo
**Ação**: Deixar arquivo vazio e clicar submeter  
**Esperado**: Erro "Selecione um ficheiro para submeter"

---

## 📊 Validações em Cada Nível

| Validação | Frontend | Multer | Backend Endpoint | Banco |
|-----------|----------|--------|------------------|-------|
| Extensão (.pdf/.doc/.docx) | ✅ | ✅ | ✅ | - |
| Tamanho (< 10MB) | ✅ | ✅ | ✅ | - |
| MIME type | ✅ | - | ✅ | - |
| Campos obrigatórios | ✅ | - | ✅ | ✅ |
| Arquivo existe | ✅ | ✅ | ✅ | - |
| Permissões user | - | - | ✅ | - |

---

## 🔧 Logs para Debugar

### No Terminal do Backend
```
📤 ========== SUBMISSÃO ==========
👤 User ID: 1
📌 Título: Minha Apresentação
📋 Eixo: 1
📎 Arquivo: SIM (document.pdf, 250.50KB)
✅ Arquivo salvo: /uploads/abc123.pdf (250.50KB)
✅ Submissão criada com ID: 42
===================================
```

### Se Erro Multer
```
❌ Arquivo rejeitado: tipo não permitido (.txt). Tipos aceitos: .pdf, .doc, .docx
```

### Se Erro No Endpoint
```
🔴 ========== ERROR HANDLER ==========
Erro tipo: MulterError
Mensagem: File too large
====================================
```

---

## ✨ Resultado Final

Agora o sistema:
- ✅ Rejeita arquivos inválidos NO FRONTEND (rápido)
- ✅ Rejeita no BACKEND como fallback (segurança)
- ✅ Armazena no banco com referência completa
- ✅ Dá feedback claro sobre erros
- ✅ Permite retry automático

**Se ainda tiver "Network request failed", verifique:**
1. Backend está rodando? `npm run server:dev`
2. Servidor responde? `curl http://localhost:5000/api/public/stats`
3. Arquivo tem extensão válida?
4. Arquivo < 10MB?
