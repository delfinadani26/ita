# 🧪 TESTE PRÁTICO: Delfina & Admin Approval System

## 📋 O QUE FOI CORRIGIDO

### **Problema 1: ✅ Login bloqueado para usuários "pending"**
- **Antes:** Delfina via "Email ou senha incorreto"
- **Depois:** Delfina vê "Sua inscrição aguarda aprovação do administrador"

### **Problema 2: ✅ Admin agora vê a lista de participantes**
- **Antes:** Admin → Gestão → (vazio ou erro)
- **Depois:** Admin → Gestão → Lista completa com filtros

### **Problema 3: ✅ Email automático ao aprovar**
- **Antes:** Admin aprova, mas sem notificação
- **Depois:** Admin aprova → Email automático sent → Delfina pode fazer login

---

## 🚀 COMO TESTAR

### **FASE 1: Preparação (5 minutos)**

```
1. Crie uma conta TEST no app
   Email: delfina.test@example.com
   Senha: SenhaForte123!
   
   Status esperado: payment_status = "pending" (por padrão)
   
2. Faça logout
3. Tente fazer login novamente com Delfina
   
   ESPERADO: ❌ "Sua inscrição aguarda aprovação"
   (Não consegue entrar no app)
```

**Se vir isso → ✅ Problema 1 CORRIGIDO!**

---

### **FASE 2: Admin Aprova Delfina (10 minutos)**

```
1. Faça login como ADMIN (papel: admin)
   Email: admin@example.com
   Senha: admin123

2. Vá para: Admin Tab → [tab de Gestão/Participantes]

3. ESPERADO: Ver seção "Aprovação Pendente"
   ├─ Delfina (delfina.test@example.com)
   ├─ ✅ Botão verde (Aprovar)
   └─ ❌ Botão vermelho (Rejeitar)

4. Clique botão ✅ VERDE para aprovar Delfina

ESPERADO: 
   ✅ Toast "Participante aprovado e notificado por email"
   ✅ Delfina sai de "Aprovação Pendente"
   ✅ Email enviado!
```

**Se vir isso → ✅ Problema 2 CORRIGIDO!**

---

### **FASE 3: Email Automático (2 minutos)**

```
1. Abra Console/Terminal:
   💻 npm run dev

2. No console, procure por:
   📧 LOG: "✅ APPROVAL EMAIL SENT"
   
   Linha típica:
   ✅ APPROVAL EMAIL SENT
   To: delfina.test@example.com
   Subject: ✅ Sua Inscrição Foi Aprovada
   
3. Se vir isso → Email funciona! ✅

Na produção (com Nodemailer):
   • Email entra na inbox de Delfina
   • "Sua Inscrição Foi Aprovada"
   • Link para fazer login
```

**Se vir isso → ✅ Problema 3 CORRIGIDO!**

---

### **FASE 4: Delfina Consegue Fazer Login (5 minutos)**

```
1. Faça logout do ADMIN

2. Tente login com Delfina novamente:
   Email: delfina.test@example.com
   Senha: SenhaForte123!

ESPERADO:
   ✅ Login bem-sucedido!
   ✅ Consegue aceder ao app
   ✅ Consegue ver:
       • Programa ✅
       • Mensagens ✅
       • Código QR ✅
       • tudo funcionando!
```

**Se vir isso → SISTEMA 100% FUNCIONANDO! 🎉**

---

## 🔍 TESTES AVANÇADOS

### **Teste A: Rejeição com Motivo**

```
1. Admin cria novo teste: rejeito@example.com
2. Go: Admin → Gestão → "Aprovação Pendente"
3. Clique ❌ VERMELHO (Rejeitar)
4. Confirma na caixa de diálogo
5. ESPERADO: 
   ✅ Toast "Participante rejeitado"
   ✅ Email enviado ❌ "Sua inscrição foi rejeitada"
   
6. rejeito@example.com tenta fazer login
7. ESPERADO: ❌ "Sua inscrição foi rejeitada"
   (Não consegue entrar)
```

---

### **Teste B: Filtros Funcionam**

```
1. Admin → Gestão → Filtro de Status
2. Clique "Pendentes" → Ver apenas pending
3. Clique "Aprovados" → Ver apenas approved
4. Clique "Pagos" → Ver apenas paid
5. Clique "Rejeitados" → Ver apenas rejected
6. Clique "Todos" → Ver todos

ESPERADO: Items filtrados corretamente
```

---

### **Teste C: Paginação**

```
Se houver > 10 participantes:
1. Admin → Gestão
2. Ver: "Página 1 de X • Y participantes"
3. Clique "2" para ir página 2
4. Items diferentes de página 1
5. Clique "<Anterior" volta para página 1
6. Clique "Próximo>" vai para página 2

ESPERADO: Navegação funciona
```

---

### **Teste D: Admins vs Participantes**

```
PARTICIPANTE COM PENDING:
   • Login: ❌ Bloqueado ("aguarda aprovação")
   • Acesso: Nenhum

PARTICIPANTE APROVADO:
   • Login: ✅ Sucesso
   • Acesso: Programa, Mensagens, QR, Tudo

ADMIN/AVALIADOR:
   • Login: ✅ sempre sucesso (mesmo se não aprovado)
   • Acesso: Acedo a Admin panel + Gestão
```

---

## 📊 DIAGNÓSTICO RÁPIDO

Se algo não funcionar, verificar:

### **❌ Login de Delfina volta erro "credenciais inválidas"**
```
Motivo: BD não foi atualizada com nova coluna 'rejection_reason'
Solução:
   1. Execute supabase_add_audit_fields.sql no Supabase
   2. Reinicie o servidor
   3. Tente novamente
```

### **❌ Admin não vê nada na lista de Participantes**
```
Motivo 1: Query URL incorreta
Solução: Verificar Console → Network tab → URL deve ser:
   /api/users/participants?page=1&limit=10

Motivo 2: Admin não está com role="admin"
Solução: Verificar no Supabase → users table → seu role deve ser "admin"

Motivo 3: Sem permissão
Solução: Endpoint retorna 403 se não é admin
   → Ver console do servidor para erro exato
```

### **❌ Email não aparece no console**
```
Motivo: sendApprovalEmail não foi chamada
Verificar:
   1. Clicou botão ✅ verde?
   2. Viu toast "Participante aprovado"?
   3. Se sim → Abrir Console (F12)
   4. Procurar por "APPROVAL EMAIL SENT"
   
   Se não vê → Erro no servidor
   Solução: Ver terminal do npm para erro
```

### **❌ Email é enviado mas BD não atualiza**
```
Motivo: Erro no updateUser
Verificar:
   1. Terminal: ver erro exato
   2. Supabase: verificar se users table tem columnas
      approved_at, rejection_reason
   3. Se não tem → Execute SQL script
```

---

## 🆘 COMANDO DEBUG RÁPIDO

### **Ver dados de Delfina no BD:**
```
Supabase Dashboard → SQL Editor → Execute:

SELECT id, full_name, email, payment_status, approved_at, rejection_reason 
FROM users 
WHERE email = 'delfina.test@example.com';

ESPERADO:
├─ id: 123
├─ full_name: Delfina Silva
├─ email: delfina.test@example.com
├─ payment_status: "pending" (antes aprovar) ou "approved" (depois)
├─ approved_at: NULL (antes) ou timestamp (depois)
└─ rejection_reason: NULL
```

### **Ver erros do servidor:**
```
Terminal 1: npm run dev
   → Ver logs em tempo real
   → Procurar por:
      ✅ "APPROVAL EMAIL SENT"
      ❌ "Error:" (erros)
      🔴 "401" (não autenticado)
      🔴 "403" (sem permissão)
```

### **Ver requisições do app:**
```
Browser DevTools (F12) → Network tab
   → Filtrar por "api"
   → Clique botão ✅ Aprovar
   → Ver requisição:
      Method: PUT
      URL: /api/users/123/approve
      Status: 200 ✅
         ou 403 ❌ (sem permissão)
         ou 404 ❌ (user não encontrado)
```

---

## ✅ CHECKLIST FINAL

- [ ] SQL script executado no Supabase
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Delfina criou conta
- [ ] Delfina tenta login → vê "aguarda aprovação"
- [ ] Admin consegue ver "Aprovação Pendente"
- [ ] Admin clica ✅ para aprovar Delfina
- [ ] Console mostra "APPROVAL EMAIL SENT"
- [ ] Delfina consegue fazer login agora
- [ ] Delfina consegue ver Programa, Mensagens, QR
- [ ] Admin consegue filtrar participantes
- [ ] Admin consegue pagination (se > 10 items)

**Todos marcados? 🎉 SISTEMA COMPLETO E FUNCIONANDO!**

---

## 📞 PRÓXIMAS AÇÕES

1. **Configurar Email Real** (Opcional)
   - Instalar Nodemailer
   - Configurar SMTP (Gmail, SendGrid, etc.)
   - Descomentar código no email-service.ts
   - Emails reais vão para inbox

2. **Teste com Usuários Reais**
   - Convide participantes reais para se registarem
   - Admin aprova/rejeita conforme necessário
   - Acompanhe emails sendo enviados

3. **Monitorar em Produção**
   - Ver logs de erro
   - Verificar BD para registos de auditoria
   - Garantir emails chegando

---

**Sucesso! Sistema funcionando corretamente! 🚀**

