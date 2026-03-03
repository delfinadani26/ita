# ✅ CHECKLIST: Setup 100% Supabase (Passo-a-Passo)

## 🎯 OBJETIVO
Migrar app para conexão 100% Supabase (sem Express local)

---

## 📋 PASSO 1: Executar SQL no Supabase Dashboard

### **INSTRUÇÕES:**

1. **Abra o Dashboard Supabase:**
   - URL: https://supabase.com/dashboard/project/vmboexvqywxlkrhphfpl/editor

2. **Vá para SQL Editor:**
   - Clique em **"SQL Editor"** (menu esquerdo)
   - Clique em **"New Query"**

3. **Cole o SQL:**
   - Abra arquivo: `supabase/rpc_functions.sql`
   - Copie TUDO
   - Cole no editor do Supabase

4. **Execute:**
   - Clique **"Run"** (canto superior direito)
   - Espere completar (Verde = Sucesso)

5. **Confirme permissões:**
   - Cole este SQL também:
   ```sql
   GRANT EXECUTE ON FUNCTION register_participant TO anon;
   GRANT EXECUTE ON FUNCTION login_user TO anon;
   GRANT SELECT, INSERT, UPDATE ON users TO anon;
   ```
   Clique **Run**

### ✅ VERIFICAÇÃO:
- Deve aparecer "✓ Success" no final
- Se houver erro, procure linhas em vermelho

---

## 🧪 PASSO 2: Testar o App (Sem Express)

### **INSTRUÇÕES:**

1. **Parar o servidor Express:**
   - Se estiver rodando, pressione **Ctrl+C**

2. **Iniciar a app:**
   ```bash
   npm run expo:dev
   ```
   Ou
   ```bash
   npm start
   ```

3. **Escanear QR Code:**
   - Abra o app **Expo Go** no celular
   - Escaneia QR code que apareceu no terminal

4. **Testar Fluxo Completo:**

   ✅ **4.1: Registar novo participante**
   - Clique em "Registar"
   - Preencha:
     - Nome: "teste admin"
     - Email: "admin@test.com"
     - Senha: "12345678"
     - Categoria: "docente"
     - Afiliação: "urnm"
   - Clique "Registar"
   - Resultado esperado: ✅ Mensagem "Registado com sucesso"

   ✅ **4.2: Tentar Login (DEVE BLOQUEAR)**
   - Clique em "Entrar"
   - Email: "admin@test.com"
   - Password: "12345678"
   - Clique "Entrar"
   - Resultado esperado: ❌ Mensagem "Sua inscrição aguarda aprovação"

   ✅ **4.3: Admin Approva**
   - Registar outro usuário como ADMIN (role=admin):
     ```
     Nome: "Admin User"
     Email: "admin_user@test.com"
     Senha: "admin123"
     Role: admin
     ```
   - Login com admin_user@test.com
   - Vá para aba **"Gestão"** → **"Participantes"**
   - Deve ver seção **"Aprovação Pendente"** com "teste admin"
   - Clique **botão verde (✓)** para aprovar
   - Resultado esperado: ✅ "Participante aprovado com sucesso"

   ✅ **4.4: Login com usuário aprovado**
   - Logout (clique perfil → logout)
   - Login novamente como "teste admin"
   - Email: "admin@test.com"
   - Password: "12345678"
   - Resultado esperado: ✅ LOGIN BEM-SUCEDIDO → Vai para Home

---

## ⚠️ TROUBLESHOOTING

### **Erro: "Erro ao fazer login"**
- Verificar se RPC functions foram criadas no Supabase
- Verificar se `.env.local` tem as credenciais Supabase corretas

### **Erro: "Email ou palavra-passe incorretos"**
- Verificar se email está digitado corretamente
- Verificar se senha está correta

### **Erro: "RPC function not found"**
- Significa que o SQL não foi executado
- Repita PASSO 1

### **App não abre após Ctrl+Atalho**
```bash
# Limpar cache
rm -rf .expo/
npm start -- --reset-cache
```

---

## ✅ SE TUDO DEU CERTO:

Você tem agora:
- ✅ Registro funcional
- ✅ Login com validação de status
- ✅ Admin approval workflow
- ✅ **100% Supabase** (sem Express)

---

## 🚀 PASSO 3: Gerar APK

Quando tudo funcionar:

```bash
eas build --platform android --local
```

O APK vai funcionar porque:
- Conecta direto ao Supabase (cloud)
- Sem necessidade de servidor local
- Funciona em qualquer lugar

---

## 📞 PRECISA DE AJUDA?

Se houver erros, responda com:
1. Mensagem de erro exata (copiar e colar)
2. Qual passo estava fazendo
3. O que estava esperando

Vou ajudar! ✅
