📡 GUIA COMPLETO - REALTIME EM TEMPO REAL COM SUPABASE
======================================================

## O QUE FOI CRIADO?

Criei um sistema profissional de real-time que permite que sua aplicação:
✅ Receba atualizações em tempo real quando dados mudam no banco
✅ Suporte múltiplas tabelas simultaneamente
✅ Tenha callbacks específicos para INSERT, UPDATE e DELETE
✅ Seja reutilizável em qualquer tela/componente

---

## ARQUIVOS CRIADOS

1. **lib/useRealtimeSubscription.ts** - Hook principal com 3 variações
2. **lib/REALTIME_EXAMPLES.ts** - Exemplos práticos de implementação

---

## COMO USAR

### 1️⃣ MODO SIMPLES - Recarregar dados quando mudarem

```tsx
import { useRealtimeSubscription } from "@/lib/useRealtimeSubscription";

export function MinhaTelaScreen() {
  const [dados, setDados] = useState([]);

  // Subscrever e recarregar dados quando houver mudança
  useRealtimeSubscription({
    table: "congress_program",
    onPayload: () => {
      console.log("Dados foram atualizados!");
      loadData(); // Recarrega os dados
    },
  });

  return <View>{/* Seu conteúdo */}</View>;
}
```

---

### 2️⃣ MODO PROFISSIONAL - Callbacks específicos

```tsx
useRealtimeSubscription({
  table: "submissions",
  
  // Quando um novo item é inserido
  onInsert: (newSubmission) => {
    setSubmissions(prev => [...prev, newSubmission]);
    showNotification("Nova submissão recebida! ✅");
  },

  // Quando um item é atualizado
  onUpdate: (updatedSubmission) => {
    setSubmissions(prev =>
      prev.map(s => s.id === updatedSubmission.id ? updatedSubmission : s)
    );
    showNotification(`Submissão ${updatedSubmission.id} atualizada 🔄`);
  },

  // Quando um item é deletado
  onDelete: (deletedSubmission) => {
    setSubmissions(prev => prev.filter(s => s.id !== deletedSubmission.id));
    showNotification('Submissão removida 🗑️');
  },
});
```

---

### 3️⃣ MODO AVANÇADO - Monitorar múltiplas tabelas

```tsx
import { useRealtime } from "@/lib/useRealtimeSubscription";

export function HomeScreen() {
  const [programs, setPrograms] = useState([]);
  const [messages, setMessages] = useState([]);

  // Monitorar 2 ou mais tabelas ao mesmo tempo
  useRealtime([
    {
      table: "congress_program",
      onInsert: (newProgram) => setPrograms(prev => [...prev, newProgram]),
      onUpdate: (updated) => setPrograms(prev => 
        prev.map(p => p.id === updated.id ? updated : p)
      ),
    },
    {
      table: "messages",
      onInsert: (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
        playSound('notification.mp3');
      },
    },
  ]);

  return <View>{/* Seu conteúdo */}</View>;
}
```

---

### 4️⃣ EXEMPLO ATUAL - Program.tsx (j atualizado)

```tsx
useRealtimeSubscription({
  table: "congress_program",
  onInsert: (newProgram) => {
    console.log("✅ Novo programa adicionado em tempo real");
    setProgram((prev) => [...prev, newProgram]);
  },
  onUpdate: (updatedProgram) => {
    console.log("🔄 Programa atualizado:", updatedProgram.id);
    setProgram((prev) =>
      prev.map((p) => (p.id === updatedProgram.id ? updatedProgram : p))
    );
  },
  onDelete: (deletedProgram) => {
    console.log("🗑️ Programa deletado:", deletedProgram.id);
    setProgram((prev) => prev.filter((p) => p.id !== deletedProgram.id));
  },
});
```

---

## CASOS DE USO RECOMENDADOS

### 📊 Tabela: congress_program
Monitorar changes para atualizar cronograma em tempo real
```tsx
table: "congress_program"
```

### 💬 Tabela: messages
Receber novas mensagens em tempo real
```tsx
table: "messages",
onInsert: (msg) => {
  playSound('notification.mp3');
  showNewMessageNotification(msg);
}
```

### 📝 Tabela: submissions
Monitorar status de submissões
```tsx
table: "submissions",
onUpdate: (submission) => {
  if (submission.status === "approved") {
    showNotification("Sua submissão foi aprovada! 🎉");
  }
}
```

### 👤 Tabela: users
Sincronizar dados de perfil
```tsx
table: "users",
onUpdate: (user) => {
  updateAuthContext(user);
}
```

---

## PADRÕES PROFISSIONAIS

### ✅ BOM - Separar lógica de estado

```tsx
const handleNewSubmission = useCallback((newSub) => {
  setSubmissions(prev => [...prev, newSub]);
  logActivity(`Nova submissão: ${newSub.title}`);
}, []);

useRealtimeSubscription({
  table: "submissions",
  onInsert: handleNewSubmission,
});
```

### ❌ RUIM - Lógica complexa diretamente

```tsx
useRealtimeSubscription({
  table: "submissions",
  onInsert: (newSub) => {
    // Muito código aqui ❌
    // Difícil de testar
    setSubmissions(prev => [...prev, newSub]);
    // ... mais 50 linhas
  },
});
```

---

## OPÇÕES DE CONFIGURAÇÃO

```tsx
interface RealtimeConfig {
  table: string;                    // Nome da tabela (obrigatório)
  event?: "*" | "INSERT" | "UPDATE" | "DELETE"; // Tipo de evento (padrão: "*")
  schema?: string;                  // Schema do banco (padrão: "public")
  onInsert?: (payload) => void;     // Callback para INSERT
  onUpdate?: (payload) => void;     // Callback para UPDATE
  onDelete?: (payload) => void;     // Callback para DELETE
  onPayload?: (payload) => void;    // Callback genérico
}
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

Para cada tela que precisa de realtime:

- [ ] Importar o hook: `import { useRealtimeSubscription } from "@/lib/useRealtimeSubscription"`
- [ ] Chamar useRealtimeSubscription com a tabela desejada
- [ ] Implementar os callbacks (onInsert, onUpdate, onDelete)
- [ ] Testar em tempo real (editar dados no painel Supabase)
- [ ] Adicionar console.log para debug
- [ ] Testar destroy/cleanup do componente

---

## DEBUG

Adicione logs para ver as mudanças em tempo real:

```tsx
useRealtimeSubscription({
  table: "congress_program",
  onInsert: (data) => console.log("📥 Insert:", data),
  onUpdate: (data) => console.log("🔄 Update:", data),
  onDelete: (data) => console.log("🗑️ Delete:", data),
});
```

Abra o console do Expo/React Native para ver os logs:
- `expo logs` (no terminal)
- Ou veja em VS Code Debug Console

---

## TELAS JÁ IMPLEMENTADAS

✅ Program.tsx - Monitorando congress_program

---

## PRÓXIMOS PASSOS

Para implementar em outras telas:

1. **Messages.tsx**
   ```tsx
   useRealtimeSubscription({
     table: "messages",
     onInsert: handleNewMessage,
   });
   ```

2. **Submissions.tsx**
   ```tsx
   useRealtimeSubscription({
     table: "submissions",
     onUpdate: handleSubmissionStatusChange,
   });
   ```

3. **Profile.tsx**
   ```tsx
   useRealtimeSubscription({
     table: "users",
     onUpdate: (user) => setUserData(user),
   });
   ```

---

## PERFORMANCE

A implementação é otimizada para:
- ✅ Cleanup automático de subscriptions
- ✅ Sem re-renders desnecessários
- ✅ Suporta múltiplas subscriptions simultaneamente
- ✅ Gerenciamento automático de memória

---

## TROUBLESHOOTING

### Problema: Realtime não está funcionando
**Solução**: Verifique as RLS Policies no Supabase:
```sql
-- Ativar Realtime em uma tabela
ALTER TABLE congress_program REPLICA IDENTITY FULL;
```

### Problema: Muitos re-renders
**Solução**: Use useCallback para otimizar:
```tsx
const handleUpdate = useCallback((data) => {
  setItems(prev => updateItem(prev, data));
}, []);

useRealtimeSubscription({
  table: "congress_program",
  onUpdate: handleUpdate,
});
```

### Problema: Memory leak
**Solução**: O hook cuida automaticamente, mas se precisar cleanup manual:
```tsx
const subscription = supabase
  .channel("meu-canal")
  .on(...)
  .subscribe();

return () => supabase.removeChannel(subscription);
```

---

Tudo pronto! A aplicação agora tem realtime profissional em tempo real! 🚀
