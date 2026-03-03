# 🧪 PLANO DE TESTES - Passos 1-4

## 📋 ESTRUTURA DOS TESTES

```
Testes Unitários (Backend)
    ├─ Email Service
    ├─ Access Control
    └─ Pagination

Testes de Integração (Backend + BD)
    ├─ Aprovação completa
    ├─ Rejeição completa
    ├─ Auditoria registada
    └─ Paginação com filtro

Testes de UI (Frontend)
    ├─ Admin Panel
    ├─ Restricted Screens
    └─ Access Control

Testes E2E (Full Flow)
    ├─ Participante pendente
    ├─ Admin aprova
    ├─ Email enviado
    ├─ Participante acede programa
    └─ Auditoria registada
```

---

## 🔧 TESTES DE SETUP (Execute Antes de Tudo)

### **T0.1 - SQL Script Executado**
```
Ação: Abrir Supabase → SQL Editor
      Copiar supabase_add_audit_fields.sql
      Clicar "Run"

Verificação:
✅ Sem erros na execução
✅ Tabela users tem coluna approved_at (TIMESTAMP)
✅ Tabela users tem coluna rejection_reason (TEXT)
✅ 3 índices criados (check via Table Details)

Resultado: PASS [ ] / FAIL [ ]
```

### **T0.2 - Servidor Backend Online**
```
Ação: Terminal → npm run dev

Verificação:
✅ Servidor escuta em http://localhost:3000 (ou porta configurada)
✅ Sem erros TypeScript
✅ Supabase conecta corretamente
✅ Banco de dados acessível

Resultado: PASS [ ] / FAIL [ ]
```

### **T0.3 - App Frontend Online**
```
Ação: Outro terminal → npm start (ou expo start)

Verificação:
✅ App carrega no emulador/device
✅ Login funciona
✅ Navegação funciona
✅ Sem erros console

Resultado: PASS [ ] / FAIL [ ]
```

---

## 📨 TESTES DO PASSO 2: EMAIL SERVICE

### **T2.1 - Email de Aprovação**
```
Ação: Abrir Console Node.js (ou Dev Tools)
      Chamar endpoint manualmente:
      
      curl -X PUT http://localhost:3000/api/users/1/approve \
           -H "Authorization: Bearer <token>"

Verificação no Console:
✅ Log: "✅ APPROVAL EMAIL SENT"
✅ Log contém: "To: usuario@email.com"
✅ Log contém: "Subject: ✅ Sua Inscrição Foi Aprovada"
✅ Log contém: HTML com "Próximos passos"

Resultado: PASS [ ] / FAIL [ ]
```

### **T2.2 - Email de Rejeição**
```
Ação: Chamar:
      curl -X PUT http://localhost:3000/api/users/2/reject \
           -H "Content-Type: application/json" \
           -H "Authorization: Bearer <token>" \
           -d '{"reason": "Documentação incompleta"}'

Verificação no Console:
✅ Log: "❌ REJECTION EMAIL SENT"
✅ Log contém: "To: usuario@email.com"
✅ Log contém: "Subject: ❌ Sua Inscrição Não Foi Aprovada"
✅ Log contém: "Motivo: Documentação incompleta"

Resultado: PASS [ ] / FAIL [ ]
```

### **T2.3 - Email de Pagamento**
```
Ação: Chamar:
      curl -X POST http://localhost:3000/api/users/3/payment \
           -H "Content-Type: application/json" \
           -H "Authorization: Bearer <token>" \
           -d '{"amount": 150}'

Verificação no Console:
✅ Log: "💳 PAYMENT CONFIRMATION EMAIL SENT"
✅ Log contém: "Amount: €150.00"
✅ Log contém: "Access granted to all features"

Resultado: PASS [ ] / FAIL [ ]
```

---

## 🔐 TESTES DO PASSO 3: AUDITORIA

### **T3.1 - Campo approved_at Preenchido**
```
Ação: Aprovar participante via Admin
      Abrir Supabase → users table
      Procurar linha do participante aprovado

Verificação:
✅ Coluna approved_at = data/hora atual
✅ Coluna rejection_reason = NULL
✅ Coluna payment_status = "approved"

Resultado: PASS [ ] / FAIL [ ]
```

### **T3.2 - Campo rejection_reason Preenchido**
```
Ação: Rejeitar participante com motivo
      Log: "Documentação incompleta"
      
      curl -X PUT http://localhost:3000/api/users/2/reject \
           -d '{"reason": "Documentação incompleta"}'

Verificação no Supabase:
✅ Coluna payment_status = "rejected"
✅ Coluna approved_at = data/hora recusa
✅ Coluna rejection_reason = "Documentação incompleta"

Resultado: PASS [ ] / FAIL [ ]
```

### **T3.3 - Índices Criados**
```
Ação: Supabase → Table Details (users)
      Clique "Indexes" tab

Verificação:
✅ idx_users_payment_status existe
✅ idx_users_created_at existe
✅ idx_users_approved_at existe
✅ Queries com WHERE payment_status são rápidas

Resultado: PASS [ ] / FAIL [ ]
```

---

## 📄 TESTES DO PASSO 1: ENDPOINTS

### **T1.1 - GET /api/users/participants (Sem Filtro)**
```
Ação: curl -X GET "http://localhost:3000/api/users/participants?page=1&limit=10"

Resposta Esperada:
{
  "data": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@email.com",
      "payment_status": "pending",
      "approved_at": null,
      "rejection_reason": null
    },
    ...
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 47,
    "pageSize": 10,
    "hasNext": true,
    "hasPrev": false
  }
}

Verificação:
✅ Array data tem ≤10 items
✅ pagination.totalCount = count(users)
✅ pagination.totalPages = ceil(totalCount / 10)
✅ pagination.hasNext = true (se totalCount > 10)
✅ Sem senha de utilizadores expostas

Resultado: PASS [ ] / FAIL [ ]
```

### **T1.2 - GET /api/users/participants Com Filtro Status**
```
Ação: curl -X GET "http://localhost:3000/api/users/participants?page=1&limit=10&status=pending"

Verificação:
✅ Todos items têm payment_status = "pending"
✅ Count de items = número de pendentes
✅ Sem items com outros status

Ação: Mesmo com status=approved
Verificação:
✅ Todos items têm payment_status = "approved"

Ação: Mesmo com status=rejected
Verificação:
✅ Todos items têm payment_status = "rejected"

Resultado: PASS [ ] / FAIL [ ]
```

### **T1.3 - PUT /api/users/:id/approve**
```
Ação: var userId = 5;
      curl -X PUT "http://localhost:3000/api/users/${userId}/approve"

Resposta:
{
  "id": 5,
  "payment_status": "approved",
  "approved_at": "2026-03-02T10:30:00Z"
}

Verificação no BD (Supabase):
✅ users WHERE id=5:
  - payment_status = "approved"
  - approved_at = timestamp (não NULL)
  - rejection_reason = NULL

Verificação Console:
✅ Log de email enviado

Resultado: PASS [ ] / FAIL [ ]
```

### **T1.4 - PUT /api/users/:id/reject**
```
Ação: var userId = 6;
      curl -X PUT "http://localhost:3000/api/users/${userId}/reject" \
           -d '{"reason": "Teste rejeição"}'

Resposta:
{
  "id": 6,
  "payment_status": "rejected",
  "rejection_reason": "Teste rejeição",
  "approved_at": "2026-03-02T10:31:00Z"
}

Verificação no BD:
✅ payment_status = "rejected"
✅ rejection_reason = "Teste rejeição"
✅ approved_at ≠ NULL

Resultado: PASS [ ] / FAIL [ ]
```

### **T1.5 - Paginação Funcional**
```
Ação: GET .../participants?page=1&limit=10
      GET .../participants?page=2&limit=10
      GET .../participants?page=3&limit=10

Verificação:
✅ Page 1 items 1-10 (diferentes de page 2)
✅ Page 2 items 11-20 (diferentes de page 1)
✅ Page 3 items 21-30
✅ Nenhum item repetido entre páginas
✅ Ordem consistente entre requisições

Resultado: PASS [ ] / FAIL [ ]
```

---

## 📱 TESTES DO PASSO 4: UI PAGINAÇÃO

### **T4.1 - Admin Panel Carrega**
```
Ação: App → Admin → Participantes

Verificação Visual:
✅ Vê seção "Aprovação Pendente"
✅ Lista participantes pendentes
✅ Cada um tem botões ✅ e ❌
✅ Sem erros no console

Resultado: PASS [ ] / FAIL [ ]
```

### **T4.2 - Filtros Funcionam**
```
Ação: Clique em Filtro "Todos"
      Count = total de participantes

      Clique em Filtro "Pendentes"
      Count = apenas status pending

      Clique em Filtro "Aprovados"
      Count = apenas status approved

Verificação:
✅ Count muda com cada filtro
✅ Items mostrados correspondem ao filtro
✅ Payment_status visível de cada participante

Resultado: PASS [ ] / FAIL [ ]
```

### **T4.3 - Paginação UI Funciona**
```
Ação: Admin → Participantes
      Mude para página 2: Clique "2" no footer

Verificação:
✅ "Página 2 de X • Y participantes" mostrado
✅ Items diferentes de página 1
✅ Botões < (previous) habilitados em página 2

      Clique página 3, depois página 1

Verificação:
✅ Volta para página 1 corretamente
✅ Botão < desabilitado em página 1
✅ Botão > desabilitado em última página

Resultado: PASS [ ] / FAIL [ ]
```

### **T4.4 - Aprovação via UI**
```
Ação: Admin → Participantes
      Encontre participante com status "Aguardando"
      Clique botão ✅ (verde - Aprovar)

Verificação Visual:
✅ Participante desaparece de "Aprovação Pendente"
✅ Toast/Alert: "Participante aprovado com sucesso"
✅ Lista recarrega

Verificação no BD:
✅ payment_status = "approved"
✅ approved_at = preenchido

Resultado: PASS [ ] / FAIL [ ]
```

### **T4.5 - Rejeição via UI**
```
Ação: Admin → Participantes
      Encontre participante com status "Aguardando"
      Clique botão ❌ (vermelho - Rejeitar)

Interaction:
✅ Diálogo: "Tem certeza? Insira motivo de rejeição"
      Digite motivo: "Documentação incompleta"
      Clique "Rejeitar"

Verificação Visual:
✅ Participante sai de lista
✅ Toast: "Participante rejeitado com sucesso"

Verificação no BD:
✅ payment_status = "rejected"
✅ rejection_reason = "Documentação incompleta"

Resultado: PASS [ ] / FAIL [ ]
```

---

## 🔒 TESTES DE ACESSO RESTRITO

### **T5.1 - Participante Pendente Bloqueado de Programa**
```
Ação: Criar conta nova (status = pending por default)
      Fazer login
      Ir para tab "Programa"

Verificação:
✅ Vê tela de "Acesso Restrito"
✅ Mensagem: "Seu acesso foi bloqueado até aprovação"
✅ Lock icon visível
✅ Botão "Voltar" funciona

Resultado: PASS [ ] / FAIL [ ]
```

### **T5.2 - Participante Pendente Bloqueado de Mensagens**
```
Ação: Mesmo participante (status = pending)
      Tab "Mensagens"

Verificação:
✅ Tela "Acesso Restrito"
✅ Sem conseguir enviar/ler mensagens

Resultado: PASS [ ] / FAIL [ ]
```

### **T5.3 - Participante Pendente Bloqueado de QR**
```
Ação: Mesmo participante (status = pending)
      Tab "Perfil"
      Procure botão "Código QR"

Verificação:
✅ Botão desabilitado (cinzento)
✅ Texto: "Bloqueado até aprovação"
✅ Não abre modal QR

Resultado: PASS [ ] / FAIL [ ]
```

### **T5.4 - Participante Aprovado Consegue Tudo**
```
Ação: Admin aprova participante (T1.3 ou T4.4)
      Participante faz logout
      Faz login novamente

Verificação:
✅ Tab "Programa" acessível
✅ Tab "Mensagens" acessível
✅ Botão "Código QR" habilitado
✅ Consegue ver/enviar mensagens
✅ Consegue exportar QR

Resultado: PASS [ ] / FAIL [ ]
```

### **T5.5 - Participante Rejeitado Não Consegue Login**
```
Ação: Participante com payment_status = "rejected"
      Tenta fazer login

Verificação:
✅ Autenticação falha?? (Ou consegue fazer login, mas com acesso bloqueado)
   
   # NOTA: Verificar se há lógica de rejeição no login
   # Se não houver, participante consegue fazer login mas vê "Acesso Bloqueado"

Resultado: PASS [ ] / FAIL [ ]
```

---

## 🔄 TESTES E2E (Full Flow)

### **T6.1 - Fluxo Completo: Aprovação**
```
Passo 1: Criar participante novo
         → payment_status = "pending"

Passo 2: Admin aprova via admin.tsx
         → PUT /api/users/:id/approve

Passo 3: Email enviado?
         → Verificar console para log de email

Passo 4: BD atualizado?
         → Supabase: payment_status = "approved"
         → Supabase: approved_at = timestamp

Passo 5: Participante consegue aceder programa?
         → Logout + Login
         → Tab "Programa" funciona

✅ TODOS OS PASSOS COMPLETADOS? Teste PASSOU!

Resultado: PASS [ ] / FAIL [ ]
```

### **T6.2 - Fluxo Completo: Rejeição**
```
Passo 1: Criar participante novo
         → payment_status = "pending"

Passo 2: Admin rejeita com motivo
         → PUT /api/users/:id/reject
         → { reason: "Documentação incompleta" }

Passo 3: Email de rejeição enviado?
         → Verificar console para log

Passo 4: BD atualizado?
         → payment_status = "rejected"
         → rejection_reason = "Documentação incompleta"
         → approved_at = timestamp

Passo 5: Participante NÃO consegue aceder?
         → Tab "Programa" bloqueado
         → Tab "Mensagens" bloqueado

✅ TODOS OS PASSOS COMPLETADOS? Teste PASSOU!

Resultado: PASS [ ] / FAIL [ ]
```

### **T6.3 - Fluxo Completo: Pagamento**
```
Passo 1: Participante aprovado
         → payment_status = "approved"

Passo 2: Admin marca como pago
         → POST /api/users/:id/payment
         → { amount: 150 }

Passo 3: Email de confirmação enviado?
         → Verificar console

Passo 4: BD atualizado?
         → payment_status = "paid"

Passo 5: Participante consegue aceder tudo?
         → Progama ✅
         → Mensagens ✅
         → QR ✅
         → Check-in ✅

Resultado: PASS [ ] / FAIL [ ]
```

---

## 📊 TESTES DE PERFORMANCE

### **T7.1 - Paginação Rápida**
```
Ação: Medir tempo resposta
      GET /api/users/participants?page=1&limit=10
      GET /api/users/participants?page=50&limit=10
      GET /api/users/participants?page=100&limit=10

Verificação:
✅ Todas < 500ms (com índices)
✅ Sem aumento de tempo com páginas altas
✅ Console.log não mostra erros BD

Resultado: PASS [ ] / FAIL [ ]
```

### **T7.2 - Filtro Rápido**
```
Ação: Medir tempo
      GET .../participants?status=pending
      GET .../participants?status=approved
      GET .../participants?status=paid

Verificação:
✅ Todas < 300ms
✅ Índice idx_users_payment_status está working

Resultado: PASS [ ] / FAIL [ ]
```

### **T7.3 - Admin Panel UI Responsiva**
```
Ação: Abrir Admin → Participantes
      Mudar página rápido: 1→2→3→1→2
      Mudar filtro rápido: Todos→Pendentes→Aprovados

Verificação:
✅ Sem lag visual
✅ Botões respondem imediatamente
✅ Sem erros console

Resultado: PASS [ ] / FAIL [ ]
```

---

## 🐛 TESTES DE CASOS EXTREMOS

### **T8.1 - Nenhum Participante Pendente**
```
Ação: Supabase: DELETE todos com payment_status="pending"
      Admin → Participantes

Verificação:
✅ Seção "Aprovação Pendente" vazia
✅ Ou não mostra a seção
✅ Sem erros

Resultado: PASS [ ] / FAIL [ ]
```

### **T8.2 - Página Fora do Range**
```
Ação: GET .../participants?page=999&limit=10

Verificação:
✅ Retorna array vazio [ ]
✅ Sem erro 500
✅ Resposta 200 OK com dados vazios

Resultado: PASS [ ] / FAIL [ ]
```

### **T8.3 - Limit Muito Alto**
```
Ação: GET .../participants?page=1&limit=10000

Verificação:
✅ Backend limita para max (ex: 100)
✅ Retorna no máximo 100 items
✅ Documentação clara

Resultado: PASS [ ] / FAIL [ ]
```

### **T8.4 - Rejeitar Mesmo Participante Duas Vezes**
```
Ação: Rejeitar participante
      Tentar rejeitar novamente (mesmo user)

Verificação:
✅ Erro gracioso: "Participante já rejeitado"
✅ Sem crash
✅ Sem alterar rejection_reason

Resultado: PASS [ ] / FAIL [ ]
```

---

## ✅ CHECKLIST RÁPIDO

**Setup:**
- [ ] SQL executado
- [ ] Servidor online
- [ ] App online

**Emails:**
- [ ] Aprovação email funciona (T2.1)
- [ ] Rejeição email funciona (T2.2)
- [ ] Pagamento email funciona (T2.3)

**Endpoints:**
- [ ] GET participantes funciona (T1.1)
- [ ] Filtro funciona (T1.2)
- [ ] Approve endpoint funciona (T1.3)
- [ ] Reject endpoint funciona (T1.4)
- [ ] Paginação backend funciona (T1.5)

**UI:**
- [ ] Admin panel carrega (T4.1)
- [ ] Filtros UI funcionam (T4.2)
- [ ] Paginação UI funciona (T4.3)
- [ ] Botão aprovar funciona (T4.4)
- [ ] Botão rejeitar funciona (T4.5)

**Acesso:**
- [ ] Pendente bloqueado programa (T5.1)
- [ ] Pendente bloqueado mensagens (T5.2)
- [ ] Pendente bloqueado QR (T5.3)
- [ ] Aprovado consegue tudo (T5.4)

**E2E:**
- [ ] Fluxo aprovação completo (T6.1)
- [ ] Fluxo rejeição completo (T6.2)
- [ ] Fluxo pagamento completo (T6.3)

**Performance:**
- [ ] Paginação rápida (T7.1)
- [ ] Filtro rápido (T7.2)
- [ ] UI responsiva (T7.3)

**Casos Extremos:**
- [ ] Sem pendentes (T8.1)
- [ ] Page fora range (T8.2)
- [ ] Limit alto (T8.3)
- [ ] Rejeitar 2x (T8.4)

---

**Todos marcados? 🎉 Parabéns! Sistema totalmente testado e pronto para produção!**

