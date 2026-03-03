# 📱 GERAR APK - GUIA COMPLETO

## ✅ PASSO 1: LOGIN NO EAS PRIMEIRO

O sistema precisa que você faça login na sua conta EAS (da Expo).

### Opção A: Login com Email (Recomendado)

1. Abra um terminal na pasta do projeto

2. Execute:
```bash
eas login
```

3. Escolha: **Email or username**

4. Digite: **osvaldodelfina02@outlook.pt** (o seu email)

5. Digite a sua **password do EAS account** (ou Expo account)

6. Se não tem conta, crie uma em: https://expo.dev

---

### Opção B: Login com token (Avançado)

Se preferir, pode usar um token:

1. Vá para: https://expo.dev/settings/tokens
2. Crie um novo token
3. Execute: `eas login --personal-access-token SEU_TOKEN_AQUI`

---

## ✅ PASSO 2: GERAR O APK

Depois de fazer login, execute este comando:

```bash
npx eas build --platform android --local
```

**O que vai acontecer:**
- ⏳ Compila a aplicação (demora 10-30 minutos na primeira vez)
- 📦 Cria o arquivo APK
- ✅ Mostra o caminho onde o APK foi guardado

**Esperado:**
```
✅ Build finished successfully
📁 Your APK is ready at: /path/to/app.apk
```

---

## ✅ PASSO 3: INSTALAR NO TELEMÓVEL

Depois de gerar o APK:

### No Emulador Android:
```bash
adb install app-release.apk
```

### No Telemóvel:
1. Copie o arquivo `app-release.apk` para o telemóvel
2. Abra o gerenciador de ficheiros
3. Localize o arquivo APK
4. Clique para instalar
5. Aceite as permissões

---

## ❓ PROBLEMAS COMUNS

### Problema: "Conta não encontrada"
**Solução:** Verifique se conta foi criada em https://expo.dev

### Problema: "Password incorreta"
**Solução:** Use a password da sua conta Expo/EAS, não do Gmail

### Problema: "Build falhou com erro X"
**Solução:** 
1. Verifique se o SQL foi executado no Supabase
2. Verifique se não há erros de compilação: `npm run lint`
3. Tente limpar cache: `npm cache clean --force`

### Problema: "APK muito grande" (>500MB)
**Normal na primeira build!** Próximas serão menores (50-100MB)

---

## 🎉 SUCESSO!

Quando o APK for gerado com sucesso:
- ✅ O aplicativo funciona em **qualquer telemóvel**
- ✅ Conecta ao **Supabase online** (não precisa de servidor local)
- ✅ Pode usar biometria (Face ID, Fingerprint, etc)
- ✅ Pronto para distribuição!

---

**Precisa de ajuda? Volte a chamar!** 💪
