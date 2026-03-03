📋 DIAGNÓSTICO - ERRO "LIMITE DE REQUISIÇÕES"
=============================================

## ❓ O QUE CAUSA O ERRO?

"Limite de requisições do servidor atingido. Por favor, aguarde 5-10 minutos antes de tentar novamente."

**Causas Possíveis:**
1. ✅ Rate limiting por IP (mesma rede = bloqueado para todos)
2. ✅ Rate limiting por email (muitas tentativas com mesmo email)
3. ✅ Tentativas falhadas de login (brute force protection)
4. ✅ Configuração padrão do Supabase muito restritiva

---

## ✅ VERIFICAR NO SUPABASE

### PASSO 1: Acessar Configurações de Auth

```
1. Vai para: https://app.supabase.com
2. Selecciona seu projeto (ita2)
3. Vai a: Authentication → Providers → Email
4. Verifica a seção "Auth Limits"
```

**Procura por:**
- Rate limit por email signing up
- Rate limit por email de confirmação
- Rate limit de login

### PASSO 2: Verificar Limites Atuais

Padrão do Supabase:
```
❌ PADRÃO (muito restritivo):
- 5 signup requests por hora por IP
- 5 confirmations por hora por email
- 5 password resets por hora por email
- 10 tentativas de login falhadas = bloqueio temporário
```

✅ RECOMENDADO (para development):
```
- 10-15 signup requests por hora por IP
- 10 confirmations por hora por email
- 10 password resets por hora por email
- Desabilitar brute force após 20+ tentativas
```

---

## 🔧 SOLUÇÃO 1: AUMENTAR LIMITES NO SUPABASE (Frontend Dev)

Se está em development/testing:

1. **Dashboard Supabase** → Authentication → Providers
2. Clica em **"Email"**
3. Procura **"Authentication Limits"**
4. Aumenta os valores:
   - Signup rate: 15 requests/hour/IP
   - Confirmation: 15 requests/hour/email
   - Password reset: 15 requests/hour/email

---

## 🔧 SOLUÇÃO 2: IMPLEMENTAR EXPONENTIAL BACKOFF (Backend)

Adicionar retry com espera exponencial no código:

```typescript
// Exemplo de retry automático com backoff

async function registerWithRetry(
  data: RegisterData,
  maxRetries: number = 3,
  initialDelay: number = 1000
) {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await register(data);
    } catch (error: any) {
      lastError = error;
      
      // Se rate limit, aguarda e tenta novamente
      if (error.message?.includes("rate limit")) {
        const delay = initialDelay * Math.pow(2, attempt); // 1s, 2s, 4s
        console.log(`Tentativa ${attempt + 1} falhou. Aguardando ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Se erro diferente, não tenta novamente
      throw error;
    }
  }
  
  throw lastError;
}
```

---

## 🔧 SOLUÇÃO 3: USAR CACHE LOCAL (Frontend)

Armazenar tentativas para evitar múltiplas requisições:

```typescript
// No register.tsx

const [lastRegisterEmail, setLastRegisterEmail] = useState<string>("");
const [lastRegisterTime, setLastRegisterTime] = useState<number>(0);

const handleRegister = async () => {
  // ⏱️ Verifica se foi tentado há menos de 30 segundos
  if (form.email === lastRegisterEmail) {
    const timeSince = Date.now() - lastRegisterTime;
    if (timeSince < 30000) { // 30 segundos
      setErrorMessage("Aguarde alguns segundos antes de tentar novamente.");
      setErrorModalVisible(true);
      return;
    }
  }
  
  // ... resto do código de registro
  
  // Guarda email e tempo
  setLastRegisterEmail(form.email);
  setLastRegisterTime(Date.now());
};
```

---

## 🔧 SOLUÇÃO 4: IMPLEMENTAR CIRCUIT BREAKER

Desabilitar requisições temporariamente se houver erro:

```typescript
// Hook reutilizável

const useCircuitBreaker = (errorThreshold: number = 3, resetTime: number = 60000) => {
  const [failureCount, setFailureCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [resetTimer, setResetTimer] = useState<NodeJS.Timeout | null>(null);

  const recordFailure = () => {
    const newCount = failureCount + 1;
    setFailureCount(newCount);
    
    if (newCount >= errorThreshold) {
      setIsOpen(true);
      
      // Abre o circuit por 1 minuto
      const timer = setTimeout(() => {
        setIsOpen(false);
        setFailureCount(0);
      }, resetTime);
      
      setResetTimer(timer);
    }
  };

  const recordSuccess = () => {
    setFailureCount(0);
    if (resetTimer) clearTimeout(resetTimer);
  };

  return { isOpen, recordFailure, recordSuccess };
};

// Uso:
const breaker = useCircuitBreaker(3, 60000); // 3 falhas = 60s fechado

if (breaker.isOpen) {
  setErrorMessage("Sistema temporariamente indisponível. Tente novamente em 1 minuto.");
  return;
}

try {
  await register(data);
  breaker.recordSuccess();
} catch (error) {
  breaker.recordFailure();
  throw error;
}
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [ ] **Verificar limites no Supabase** (Authentication → Providers → Email)
- [ ] **Aumentar limites se necessário** (pelo menos 10-15/hora)
- [ ] **Testar com emails diferentes** (evita rate limit por email)
- [ ] **Aguardar entre tentativas** (não cliques rápido)
- [ ] **Implementar exponential backoff** (retry automático)
- [ ] **Adicionar circuit breaker** (proteção extra)

---

## 🎯 CAUSA MAIS PROVÁVEL

**Na sua situação:**
- Está testando, criando múltiplos usuários
- Pode estar com IP bloqueado temporariamente (5-10 min)
- Ou Supabase padrão tem limite baixo

**Solução Rápida:**
1. Espera 10 minutos (reset automático)
2. Vai em https://app.supabase.com
3. Verifica e aumenta os limites
4. Usa emails diferentes para testar

---

## 🔐 EM PRODUÇÃO

Não deixe os limites muito altos! Usar:
- ✅ 10 signup/hora/IP
- ✅ 5 confirmations/hora/email  
- ✅ 3 password resets/hora/email
- ✅ Brute force: bloqueio após 10 falhas

Isso protege contra ataques mas mantém UX boa.

---

**Qual é a sua situação agora?**
- Ainda tem erro? Aguarte 10 min?
- Quer que implemente backoff no código?
- Quer verificar os limites lá?
