# 🚀 ATIVAR 100% SUPABASE - APENAS 3 PASSOS

## ✅ PASSO 1: COPIAR E COLAR SQL NO SUPABASE

1. Abra: https://supabase.com/dashboard/project/vmboexvqywxlkrhphfpl/editor

2. Clique em **SQL Editor** (lado esquerdo)

3. Clique em **New Query** (botão azul)

4. **Apague tudo** que estiver lá

5. Abra o arquivo: **SETUP_SQL_COPIE_COLE.sql** (nessa mesma pasta)

6. **Copie TUDO** (Ctrl+A → Ctrl+C)

7. Cole no SUPABASE SQL Editor

8. Clique no botão **Run** (azul, canto superior direito)

9. **Deve aparecer: ✅ Success** (em verde)

**⚠️ Se der erro:**
- Se disser "função já existe" = está tudo bem! Quer dizer que você executou antes
- Se disser "erro de sintaxe" = copie o SQL novamente e tente

---

## ✅ PASSO 2: TESTAR NO APLICATIVO

1. **Encerre o servidor Express** (se estiver a correr)
   - Pressione `Ctrl+C` no terminal onde iniciou o servidor

2. Abra um novo terminal

3. Execute:
   ```bash
   npm run expo:dev
   ```

4. Teste o fluxo **completo**:

### Teste 1️⃣: REGISTAR
- Clique em "Criar Conta" (Register)
- Preencha dados (qualquer email, password qualquer)
- Submeta
- **Esperado:** Mensagem "Registado com sucesso" ✅

### Teste 2️⃣: LOGIN SEM APROVAÇÃO (vai falhar)
- Tente fazer login com a conta que criou
- **Esperado:** Mensagem "Sua inscrição aguarda aprovação do administrador" ❌

### Teste 3️⃣: ADMIN APROVA
1. Faça logout
2. Login como **admin**:
   - Email: `admin@urnm.ao` (ou qualquer admin que tenha na DB)
   - Password: `admin123` (ou a que tem na DB)

3. Vá para **Gestão de Participantes**

4. Procure o participante que criou

5. Clique no botão verde **"Aprovar"**

6. **Esperado:** Mensagem de sucesso ✅

### Teste 4️⃣: LOGIN AGORA FUNCIONA
1. Faça logout
2. Try login com a conta que criou
3. **Esperado:** Login sucede e vai para Home ✅

### (Bonus) Teste 5️⃣: BIOMETRIA
- Se aparecer modal "Ativar Biometria?" = está tudo funcionando 🎉

---

## ✅ PASSO 3: GERAR APK

Uma vez tudo a funcionar:

```bash
eas build --platform android --local
```

Será gerado um arquivo **APK** que funciona em **qualquer telemóvel** (não precisa mais de localhost!) 🎉

---

## 📋 CHECKLIST FINAL

- [ ] SQL executado no Supabase (apareceu ✅ Success)
- [ ] Aplicativo testado (npm run expo:dev)
- [ ] Fluxo de Registro → Login Bloqueado → Aprovação → Login OK funcionando
- [ ] APK gerado com `eas build`
- [ ] Enviado para telemóvel/emulador

**Tudo pronto!** 🚀

---

## ❓ DÚVIDAS COMUNS

**P: Dá erro de "função já existe"?**
R: É normal! Quer dizer que o SQL foi executado antes. Pode ignorar.

**P: O app continua a usar o servidor Express?**
R: Não, agora usa 100% Supabase. Se o seu Express estiver a rodar, desligue com `Ctrl+C`.

**P: E se falhar o login?**
R: Verifique se:
1. SQL foi executado (ler mensagens do Supabase)
2. Express está desligado (`Ctrl+C`)
3. Email/password está correto

**P: Como sei que está tudo bem?**
R: Se conseguir registar → bloqueio no login → aprovação → login OK, está perfeito!

---

**Precisa de ajuda? Volte a chamar.** Estou aqui! 😊
