# 🎯 REMOVER APROVAÇÃO - PASSO A PASSO

## ✅ PASSO 1: EXECUTAR SQL NO SUPABASE

1. Abra: https://supabase.com/dashboard/project/vmboexvqywxlkrhphfpl/editor

2. **SQL Editor → New Query**

3. Abra o arquivo: **REMOVER_APROVACAO.sql** (nesta pasta)

4. **Copie TUDO** e cole no Supabase

5. Clique **RUN**

6. **Esperado:** ✅ Success (em verde)

---

## ✅ PASSO 2: TESTAR A NOVA FUNCIONALIDADE

### Novo Fluxo (sem aprovação):

1. **Registar:**
   - Email: teste@example.com
   - Password: teste123
   - Resultado: ✅ "Registado com sucesso"
   - Status na BD: `payment_status = 'approved'` (automático!)

2. **Login imediato:**
   - Email: teste@example.com
   - Password: teste123
   - Resultado: ✅ Login funciona SEM esperar aprovação do admin!

3. **Pode submeter logo:**
   - Entra na app
   - Vai para Submissões
   - Submete trabalho imediatamente ✅

---

## 📝 MUDANÇAS FEITAS:

| O que | Antes | Depois |
|------|-------|--------|
| Novo registo | `payment_status = 'pending'` (bloqueado) | `payment_status = 'approved'` (acesso imediato) |
| Login | Bloqueado se pending | Funciona logo após registar |
| Submissão | Após admin aprovação | Logo após registar |
| Admin panel | Mostra lista para aprovar | Ainda existe (para rejeitar só) |

---

## ⚙️ O QUE NÃO MUDA:

- ✅ Rejeitados continuam bloqueados
- ✅ QR check-in continua a funcionar
- ✅ Biometria ainda funciona
- ✅ Admin pode rejeitar se necessário

---

## 🚀 PRÓXIMOS PASSOS:

1. ✅ Executar SQL no Supabase
2. Regenerar APK: `npx eas build --platform android`
3. Instalar novo APK e testar

---

**Simples! Nenhuma aprovação mais!** ✅
