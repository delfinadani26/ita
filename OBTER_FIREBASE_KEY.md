# 🔑 Como Gerar firebase-key.json

Você tem `google-services.json` (para Android), mas precisa de `firebase-key.json` (para Node.js/Backend).

## ✅ Passo 1: Ir ao Firebase Console

1. Vá para: https://console.firebase.google.com/
2. Clique em seu projeto: **csa-urnm**

## ✅ Passo 2: Abrir Service Account

```
1. Clique na engrenagem ⚙️ (canto superior direito)
2. Selecione "Project settings"
3. Abra a aba "Service Accounts"
```

## ✅ Passo 3: Gerar Chave Privada

```
1. Você verá um botão: "Generate New Private Key"
2. Clique nele
3. Um arquivo JSON será baixado (ex: csa-urnm-XXXXX.json)
   ⚠️ ESTE É SEU firebase-key.json!
```

## ✅ Passo 4: Copiar para o Projeto

```bash
# Abra o arquivo baixado
# Copie TODO o conteúdo JSON

# Abra: ita2/firebase-key.json
# Substitua TODO o conteúdo pelo arquivo que baixou

# Salve!
```

## 🔒 IMPORTANTE - Segurança!

⚠️ **NUNCA** faça commit de `firebase-key.json` no Git!

Adicione ao `.gitignore`:
```
firebase-key.json
google-services.json
```

## ✅ Verificar se funcionou

Execute:
```bash
node -e "const key = require('./firebase-key.json'); console.log('✅ Chave carregada:', key.project_id);"
```

Resultado esperado:
```
✅ Chave carregada: csa-urnm
```

## 🎯 Depois de Atualizar

Quando terminar:
1. Rode: `npm run migrate:backup` (Passo 2)
2. Rode: `npm run migrate:restore` (Passo 3)
3. Pronto! Dados no Firebase ✅

---

**Não tem certeza?** Siga este vídeo:
https://www.youtube.com/watch?v=0OFEr9zAFyY (Firebase Service Account)

Qualquer dúvida, avise! 🚀
