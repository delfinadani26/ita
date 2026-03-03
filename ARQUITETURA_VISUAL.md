# 🏗️ ARQUITETURA VISUAL - Sistema de Aprovação

## Diagrama 1: Fluxo Completo de Aprovação

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE APROVAÇÃO - FLUXO COMPLETO             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Participante se  │
│ registra na app  │
└────────┬─────────┘
         │ payment_status = "pending"
         ▼
┌──────────────────────────────────────────┐
│ Status: AGUARDANDO APROVAÇÃO            │
│ Tab "Programa"    → BLOQUEADO           │
│ Tab "Mensagens"   → BLOQUEADO           │
│ Tab "QR"          → BLOQUEADO           │
│ Tab "Perfil"      → ACESSÍVEL (logout)  │
└──────────────┬───────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Admin        │  │ Auto-Reject? │
│ Aprova?      │  │ (opcional)   │
└──────┬───────┘  └──────┬───────┘
       │ YES             │ YES
       ▼                 ▼
┌─────────────────────────────────────┐
│ PUT /api/users/:id/approve          │
│ payment_status = "approved"         │
│ approved_at = NOW()                 │
│ rejection_reason = NULL             │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Email Enviado: │
         │ ✅ APROVADO    │
         └────────┬───────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│ Status: APROVADO                    │
│ Agora consegue:                      │
│ • Programa ✅                        │
│ • Mensagens ✅                       │
│ • QR ✅                              │
│ • Check-in ✅                        │
│ • Submissões ✅                      │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Admin marca como:    │
    │ PAGO                 │
    │ POST /api/.../payment│
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Email Enviado:       │
    │ 💳 PAGAMENTO CONF.   │
    └──────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Status: PAGO                        │
│ Acesso Total ✅                      │
└──────────────────────────────────────┘


ALTERNATIVA B: REJEIÇÃO
┌──────────────┐
│ Admin        │
│ Rejeita?     │
└──────┬───────┘
       │ YES
       ▼
┌──────────────────────────────┐
│ PUT /api/users/:id/reject    │
│ payment_status = "rejected"  │
│ rejection_reason = "..."     │
│ approved_at = NOW()          │
└──────────────┬───────────────┘
               │
               ▼
      ┌─────────────────┐
      │ Email Enviado:  │
      │ ❌ REJEITADO    │
      └────────┬────────┘
               │
               ▼
┌──────────────────────────────┐
│ Status: REJEITADO           │
│ ❌ Sem acesso              │
│ Motivo: [registado]         │
└──────────────────────────────┘
```

---

## Diagrama 2: Estrutura de Dados & BD

```
┌─────────────────────────────────────────────────────────┐
│                 TABELA: users                            │
├─────────────────────────────────────────────────────────┤
│ id              INTEGER PK                              │
│ name            STRING                                  │
│ email           STRING                                  │
│ password        STRING (hashed)                         │
│ payment_status  ENUM ────┐                              │
│ approved_at     TIMESTAMP (NEW) ────┐                   │
│ rejection_reason TEXT (NEW) ───────┐│                  │
│ created_at      TIMESTAMP          ││                  │
│ updated_at      TIMESTAMP          ││                  │
└─────────────────────────────────────────────────────────┘
                                      ││
                              ┌──────┘│└─────────┐
                              │                   │
        ┌─────────────────────────┐   ┌──────────────────┐
        │ payment_status values:   │   │ Exemplos:        │
        ├─────────────────────────┤   │                  │
        │ • pending               │   │ pending:         │
        │ • approved              │   │   approved_at=∅  │
        │ • paid                  │   │   reason=∅       │
        │ • exempt                │   │                  │
        │ • rejected              │   │ approved:        │
        └─────────────────────────┘   │   approved_at=✅  │
                                      │   reason=∅       │
                                      │                  │
                                      │ rejected:        │
                                      │   approved_at=✅  │
                                      │   reason="..."   │
                                      └──────────────────┘

INDICES CRIADOS (Performance):
┌────────────────────────────────────────────────────────┐
│ idx_users_payment_status   → (payment_status)          │
│ idx_users_created_at       → (created_at DESC)         │
│ idx_users_approved_at      → (approved_at DESC)        │
└────────────────────────────────────────────────────────┘
```

---

## Diagrama 3: Arquitetura Backend

```
┌──────────────────────────────────────────────────────────────┐
│                     EXPRESS SERVER                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ROUTES (server/routes.ts)                             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │ GET /api/users/participants?page=X&limit=10&status=Y │  │
│  │     ├─ Chamada: Storage.getParticipants()            │  │
│  │     ├─ Retorna: { data[], pagination }              │  │
│  │     └─ Status: 200 OK                                │  │
│  │                                                        │  │
│  │ PUT /api/users/:id/approve                            │  │
│  │     ├─ Validação: user.role = admin                 │  │
│  │     ├─ Atualiza: payment_status='approved'           │  │
│  │     ├─ Registra: approved_at = NOW()                 │  │
│  │     ├─ Chama: EmailService.sendApprovalEmail()       │  │
│  │     ├─ Invalida Query Cache                          │  │
│  │     └─ Retorna: user{ ..., payment_status, ... }    │  │
│  │                                                        │  │
│  │ PUT /api/users/:id/reject                             │  │
│  │     ├─ Validação: user.role = admin                 │  │
│  │     ├─ Atualiza: payment_status='rejected'           │  │
│  │     ├─ Registra: rejection_reason = req.body.reason  │  │
│  │     ├─ Registra: approved_at = NOW()                 │  │
│  │     ├─ Chama: EmailService.sendRejectionEmail()      │  │
│  │     ├─ Invalida Query Cache                          │  │
│  │     └─ Retorna: user{ ...rejected, reason... }      │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲ │ ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STORAGE (server/storage.ts)                           │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │ getParticipants(page, limit, status?)                │  │
│  │     ├─ SQL: SELECT * FROM users                       │  │
│  │     ├─ WHERE payment_status = status (opcional)      │  │
│  │     ├─ LIMIT :limit OFFSET (:page-1)*:limit          │  │
│  │     └─ Retorna: { data, total, pages }              │  │
│  │                                                        │  │
│  │ getUser(id)                                            │  │
│  │ updateUser(id, updates)                               │  │
│  │ approveUser(id) → updateUser(id, {                   │  │
│  │   payment_status: 'approved',                         │  │
│  │   approved_at: NOW()                                  │  │
│  │ })                                                     │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲ │ ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ EMAIL SERVICE (server/email-service.ts)               │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │ sendApprovalEmail(fullName, email, category, ...)     │  │
│  │     ├─ Template HTML com logo, próximos passos       │  │
│  │     ├─ Envia: "From: noreply@..."                     │  │
│  │     ├─ Log: "✅ APPROVAL EMAIL SENT TO..."            │  │
│  │     └─ Pronto para: Nodemailer integration            │  │
│  │                                                        │  │
│  │ sendRejectionEmail(fullName, email, reason)           │  │
│  │     ├─ Template HTML com motivo da rejeição          │  │
│  │     ├─ Log: "❌ REJECTION EMAIL SENT TO..."           │  │
│  │     └─ Pronto para: Nodemailer integration            │  │
│  │                                                        │  │
│  │ sendPaymentConfirmationEmail(fullName, email, amount) │  │
│  │     ├─ Template HTML com valor, comprovante           │  │
│  │     ├─ Log: "💳 PAYMENT EMAIL SENT TO..."             │  │
│  │     └─ Pronto para: Nodemailer integration            │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲ │ ▼                               │
└──────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
         ┌──────────┐        ┌──────────────┐
         │ Supabase │        │ Console Logs │
         │ (BD)     │        │ (Dev Mode)   │
         │ users    │        │ ou SMTP      │
         │ table    │        │ (Produção)   │
         └──────────┘        └──────────────┘
```

---

## Diagrama 4: Arquitetura Frontend

```
┌──────────────────────────────────────────────────────────────┐
│                     REACT NATIVE APP                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ADMIN PANEL (app/(tabs)/admin.tsx)                    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │ ┌─ FILTER BAR ────────────────────────────────────┐   │  │
│  │ │ [Todos] [Pendentes] [Aprovados] [Pagos] [Rejeit.]│   │  │
│  │ └──────────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │ ┌─ APROVAÇÃO PENDENTE SECTION ─────────────────────┐  │  │
│  │ │ ⚠️ Aguardando Aprovação (47)                       │  │  │
│  │ │                                                    │  │  │
│  │ │ [Participante 1] [✅] [❌]                        │  │  │
│  │ │ [Participante 2] [✅] [❌]                        │  │  │
│  │ │ [Participante 3] [✅] [❌]                        │  │  │
│  │ │ ...                                                │  │  │
│  │ │ [Participante 10] [✅] [❌]                       │  │  │
│  │ │                                                    │  │  │
│  │ └────────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │ ┌─ PAGINATION ─────────────────────────────────────┐   │  │
│  │ │ < [1] [2] [3] [4] [5] >                          │   │  │
│  │ │ Página 1 de 5 • 47 participantes                  │   │  │
│  │ └──────────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │ ESTADO DO COMPONENTE:                                  │  │
│  │ • currentPage: number (1-5)                            │  │
│  │ • participantStatus: "pending"|"approved"|...          │  │
│  │ • participantsData: { data[], pagination }            │  │
│  │                                                        │  │
│  │ HANDLERS:                                              │  │
│  │ • handleApproveParticipant(userId)                     │  │
│  │   └─ PUT /api/users/:id/approve                        │  │
│  │   └─ Invalida cache React Query                        │  │
│  │   └─ Toast: "Aprovado com sucesso"                     │  │
│  │                                                        │  │
│  │ • handleRejectParticipant(userId)                      │  │
│  │   └─ Alert: "Tem certeza? Digite motivo"               │  │
│  │   └─ PUT /api/users/:id/reject                         │  │
│  │   └─ Invalida cache React Query                        │  │
│  │   └─ Toast: "Rejeitado com sucesso"                    │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PROGRAM TAB (app/(tabs)/program.tsx)                  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │ const access = useAccessControl(user)                 │  │
│  │                                                        │  │
│  │ if (!access.canViewProgram) {                          │  │
│  │   return <RestrictedAccessScreen                       │  │
│  │     title="Programa Indisponível"                      │  │
│  │     message="Aguarde sua aprovação..."                 │  │
│  │   />                                                   │  │
│  │ }                                                      │  │
│  │                                                        │  │
│  │ // Mostrar programa normal                             │  │
│  │ return <ProgramContent ... />                          │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲ │ ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ACCESS CONTROL HOOK (lib/useAccessControl.ts)        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │ useAccessControl(user) → AccessPermission             │  │
│  │                                                        │  │
│  │ if (user.payment_status === 'pending') {              │  │
│  │   return {                                             │  │
│  │     canViewProgram: false,                             │  │
│  │     canViewMessages: false,                            │  │
│  │     canViewQR: false,                                  │  │
│  │     canViewCheckIn: false,                             │  │
│  │     canViewSubmissions: false,                         │  │
│  │     pendingApprovalMessage: "Aguarde..."               │  │
│  │   }                                                    │  │
│  │ }                                                      │  │
│  │                                                        │  │
│  │ if (admin or approved or paid or exempt) {             │  │
│  │   return { all: true }                                 │  │
│  │ }                                                      │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲ │ ▼                               │
└──────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
         ┌──────────────┐      ┌──────────────────┐
         │ React Query  │      │ Auth Context     │
         │ (caching)    │      │ (user session)   │
         │ {cache}      │      │ {user object}    │
         └──────────────┘      └──────────────────┘
```

---

## Diagrama 5: Fluxo de Requisição (Passo a Passo)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER CLICKS "✅ APPROVE" BUTTON IN ADMIN PANEL                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: admin.tsx → handleApproveParticipant(userId)           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Show loading state                                            │
│ 2. Call: PUT /api/users/:id/approve                              │
│    Headers: { Authorization: "Bearer <token>" }                  │
└──────────┬────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER: routes.ts → router.put("/api/users/:id/approve")        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Validate token → req.user (admin only)                        │
│ 2. Get userId from req.params.id                                 │
│ 3. Call: Storage.updateUser(userId, {                            │
│      payment_status: "approved",                                 │
│      approved_at: new Date().toISOString()                       │
│    })                                                             │
│ 4. Fetch updated user from BD                                    │
│ 5. Call: EmailService.sendApprovalEmail(                         │
│      user.full_name,                                             │
│      user.email,                                                 │
│      user.category,                                              │
│      user.institution                                            │
│    )                                                              │
│ 6. Return: { user object without password }                      │
└──────────┬────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: Supabase                                               │
├─────────────────────────────────────────────────────────────────┤
│ UPDATE users SET                                                 │
│   payment_status = 'approved',                                   │
│   approved_at = '2026-03-02T10:30:00.000Z',                      │
│   updated_at = NOW()                                             │
│ WHERE id = :userId                                               │
│                                                                   │
│ RESULT: ✅ 1 row updated                                         │
└──────────┬────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ EMAIL SERVICE: email-service.ts → sendApprovalEmail()           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Generate HTML template                                        │
│ 2. Log to console:                                               │
│    "✅ APPROVAL EMAIL SENT"                                      │
│    "To: usuario@email.com"                                       │
│    "Subject: ✅ Sua Inscrição Foi Aprovada"                      │
│    "HTML: <html>...</html>"                                      │
│                                                                   │
│    [Ready for: Nodemailer.transporter.sendMail()]               │
│                                                                   │
│ 3. Return: { email: "...", sent: true }                          │
└──────────┬────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSE: HTTP 200 OK                                            │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "id": 5,                                                       │
│   "name": "João Silva",                                          │
│   "email": "joao@email.com",                                     │
│   "payment_status": "approved",                                  │
│   "approved_at": "2026-03-02T10:30:00Z",                         │
│   "rejection_reason": null,                                      │
│   "created_at": "2026-01-15T08:00:00Z",                          │
│   "updated_at": "2026-03-02T10:30:00Z"                           │
│ }                                                                │
└──────────┬────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: admin.tsx → Response received                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. queryClient.invalidateQueries([                                │
│      "/api/users/participants", page, status                     │
│    ])                                                             │
│    ↓ Forces refetch of participants list                          │
│                                                                   │
│ 2. showToast({                                                    │
│      title: "✅ Sucesso",                                        │
│      description: "Participante aprovado com sucesso!"            │
│    })                                                             │
│                                                                   │
│ 3. UI Updates:                                                    │
│    - Remove participante da seção "Aprovação Pendente"           │
│    - Refetch com filtro "pending" → user desaparece              │
│    - Se em filtro "todos", status muda para "✅ Aprovado"        │
│                                                                   │
│ 4. Hide loading state                                            │
└──────────┬────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ PARTICIPANTE (logout + login)                                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. Recebe email: ✅ Sua Inscrição Foi Aprovada                  │
│ 2. Faz login                                                     │
│ 3. Auth context atualiza: user.payment_status = "approved"      │
│ 4. Tenta aceder programa:                                        │
│    useAccessControl(user) → canViewProgram = true                │
│    ✅ Consegue ver programa!                                    │
│ 5. Agora consegue:                                               │
│    - Programa ✅                                                │
│    - Mensagens ✅                                               │
│    - QR ✅                                                       │
│    - Check-in ✅                                                │
│    - Submissões ✅                                              │
└─────────────────────────────────────────────────────────────────┘

TEMPO TOTAL: ~500-1000ms (com rede)
CACHE: Particip. invalida, refetch automático
AUDITORIA: Registada em BD (approved_at, updated_at)
```

---

## Diagrama 6: Estados de Acesso

```
┌────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE ACESSO                             │
├────────────────────────────────────────────────────────────────┤

┌─────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Recurso │ PENDING  │ APPROVED │  PAID    │  EXEMPT  │ REJECTED │
├─────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│Programa │    ❌    │    ✅    │    ✅    │    ✅    │    ❌    │
│Mensagens│    ❌    │    ✅    │    ✅    │    ✅    │    ❌    │
│QR/Código│    ❌    │    ✅    │    ✅    │    ✅    │    ❌    │
│Check-in │    ❌    │    ✅    │    ✅    │    ✅    │    ❌    │
│Submiss. │    ❌    │    ✅    │    ✅    │    ✅    │    ❌    │
│Perfil   │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │
│Logout   │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │
└─────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

ADMIN: Acesso a TUDO + Painel admin
AVALIADOR: Acesso a TUDO (sem painel admin)
```

---

## Diagrama 7: Banco de Dados com Índices

```
┌──────────────────────────────────────────────────────┐
│            TABELA: users (Supabase)                  │
├──────────────────────────────────────────────────────┤

COLUNAS:
┌─────────────────────────────────────────────────────┐
│ ID (PK) │ name      │ email          │ password    │
├─────────────────────────────────────────────────────┤
│ 1       │ João      │ joao@gmail.com │ hash123...  │
│ 2       │ Maria     │ maria@...      │ hash456...  │
│ 3       │ Pedro     │ pedro@...      │ hash789...  │
│ ...     │ ...       │ ...            │ ...         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ payment_status│ approved_at        │ rejection_reason│
├─────────────────────────────────────────────────────┤
│ pending       │ NULL               │ NULL            │
│ approved      │ 2026-03-02 10:30   │ NULL            │
│ paid          │ 2026-03-02 11:00   │ NULL            │
│ rejected      │ 2026-03-02 10:45   │ Docs incom...   │
│ pending       │ NULL               │ NULL            │
│ ...           │ ...                │ ...             │
└─────────────────────────────────────────────────────┘

ÍNDICES (Performance):
┌─────────────────────────────────────────────────────┐
│ INDEX: idx_users_payment_status                     │
│ ON users(payment_status)                            │
│ → SELECT * FROM users WHERE payment_status='pending'│
│   ⚡ 30ms (com index) vs 500ms (sem index)          │
│                                                     │
│ INDEX: idx_users_created_at                         │
│ ON users(created_at DESC)                           │
│ → SELECT * FROM users ORDER BY created_at DESC     │
│   ⚡ Ordenação rápida                              │
│                                                     │
│ INDEX: idx_users_approved_at                        │
│ ON users(approved_at DESC)                          │
│ → SELECT * FROM users WHERE approved_at IS NOT NULL│
│   ⚡ Filtra aprovados rapidamente                   │
└─────────────────────────────────────────────────────┘
```

---

## Resumo: Em Código

```javascript
// EXEMPLO: Fluxo completo em pseudocódigo

// 1. ADMIN CLICA BOTÃO
const handleApproveParticipant = async (userId) => {
  try {
    // 2. CHAMADA HTTP
    const response = await fetch(`/api/users/${userId}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 3. SERVER PROCESSA
    // (vê acima, diagrama 5)
    
    // 4. RESPONSE CHEGA
    const approvedUser = await response.json();
    // {
    //   id: 5,
    //   payment_status: "approved",
    //   approved_at: "2026-03-02T10:30:00Z"
    // }
    
    // 5. INVALIDA CACHE
    queryClient.invalidateQueries(["/api/users/participants"]);
    
    // 6. MOSTRA TOAST
    showToast("✅ Aprovado com sucesso!");
    
    // 7. UI RECARREGA (automático com React Query)
    // Participante sai da lista de pending
    
  } catch (error) {
    showToast("❌ Erro na aprovação");
  }
};

// 8. PARTICIPANTE RECEBE EMAIL
// "✅ Sua Inscrição Foi Aprovada!"

// 9. PARTICIPANTE FAZ LOGIN
// Auth.user.payment_status = "approved"

// 10. useAccessControl(user) RETORNA
// { canViewProgram: true, canViewMessages: true, ... }

// 11. ACESSO DESBLOQUEADO ✅
```

