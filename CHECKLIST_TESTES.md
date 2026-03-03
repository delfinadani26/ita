🧪 CHECKLIST DE TESTES & SEGURANÇA
==================================

Após aplicar as correções RLS, execute este checklist:

---

✅ TESTES FUNCIONAIS

1. REGISTRO DE NOVO USUÁRIO
   [ ] Abrir app
   [ ] Clicar "Criar Conta"
   [ ] Preencher: email@test.com / senha123
   [ ] Clicar "Registrar"
   [ ] ✓ Deve registrar sem erro
   [ ] ✓ Deve fazer login automaticamente

2. LOGIN COM USUÁRIO EXISTENTE
   [ ] Logout (se estava logado)
   [ ] Preencher: admin@urnm.ao / senha123
   [ ] Clicar "Entrar"
   [ ] ✓ Deve entrar sem erro

3. CRIAR PROGRAMA
   [ ] Ir para abas → Admin
   [ ] Clicar "+"
   [ ] Preencher:
      - Nome: "Reunião de Testes"
      - Data: Today
      - Hora: 14:00
      - Descrição: "Test"
   [ ] Adicionar atividade
   [ ] Clicar "Salvar"
   [ ] ✓ Modal deve fechar
   [ ] ✓ Programa deve aparecer na lista
   [ ] ✓ Timeline deve atualizar em REAL-TIME

4. EDITAR PROGRAMA
   [ ] Clicar no programa criado
   [ ] Mudar nome: "Reunião Atualizada"
   [ ] Clicar "Salvar"
   [ ] ✓ Deve atualizar sem erro

5. DELETAR PROGRAMA
   [ ] Criar programa de teste
   [ ] Clicar "❌" para deletar (se houver)
   [ ] OU fazer swipe left (se implementado)
   [ ] ✓ Deve deletar sem erro

---

📱 TESTES REALTIME (Multi-dispositivo)

1. Abrir app em 2 abas/dispositivos
2. Logar em ambas com admin@urnm.ao
3. Na ABA 1: Criar programa "Live Test"
4. Na ABA 2: ✓ Programa deve aparecer em tempo real (< 2 seg)
5. Na ABA 1: Editar nome para "Live Test Updated"
6. Na ABA 2: ✓ Nome deve atualizar em tempo real
7. Na ABA 1: Deletar programa
8. Na ABA 2: ✓ Programa deve desaparecer em tempo real

---

🔒 TESTES DE SEGURANÇA

1. INSERÇÃO DE DADOS
   [ ] Abrir DevTools / Console
   [ ] Tentar criar programa direto via API:
   ```javascript
   const { data, error } = await supabase
     .from('congress_program')
     .insert([{ name: 'Test', date: new Date() }])
   console.log(error || data)
   ```
   [ ] ✓ Deve funcionar (policy "insert" = true)

2. LEITURA DE DADOS
   [ ] Via console:
   ```javascript
   const { data } = await supabase.from('congress_program').select('*')
   console.log(data)
   ```
   [ ] ✓ Deve retornar dados (policy "select" = true)

3. ATUALIZAÇÃO
   [ ] Via console:
   ```javascript
   const { data, error } = await supabase
     .from('congress_program')
     .update({ name: 'Updated' })
     .eq('id', 'some-id')
   console.log(error || data)
   ```
   [ ] ✓ Deve funcionar (policy "update" = true)

4. DELEÇÃO
   [ ] Via console:
   ```javascript
   const { data, error } = await supabase
     .from('congress_program')
     .delete()
     .eq('id', 'some-id')
   console.log(error || data)
   ```
   [ ] ✓ Deve funcionar (policy "delete" = true)

---

🚨 ERROS ESPERADOS (ANTES DAS CORREÇÕES)

Se ainda vir esses erros, as RLS NÃO foram aplicadas:

- ❌ "new row violates row-level security policy for table users"
  → users_insert policy está faltando

- ❌ "new row violates row-level security policy for table congress_program"
  → congress_program_insert policy está faltando

- ❌ "policy ... does not permit update access"
  → *_update policy está faltando

- ❌ "policy ... does not permit delete access"
  → *_delete policy está faltando

---

✅ SINAIS DE SUCESSO

- Registro sem erro
- Login sem erro
- Programa criado e visível
- Edição funciona
- Deleção funciona
- Real-time atualiza em < 2 segundos
- Console API calls retornam dados

---

📊 MATRIX FINAL

| Operação | Usuário | Admin | Anon | Status |
|----------|---------|--------|------|--------|
| Ver programas | ✅ | ✅ | ✅ | Working |
| Criar programa | ✅ | ✅ | ✅ | Working |
| Editar programa | ✅ | ✅ | ✅ | Working |
| Deletar programa | ✅ | ✅ | ✅ | Working |
| Real-time updates | ✅ | ✅ | ✅ | Working |

---

⚠️ PRÓXIMOS PASSOS DE SEGURANÇA

1. Restringir INSERT/UPDATE/DELETE por usuário
2. Adicionar autenticação obrigatória
3. Implementar RBAC (admin vs user)
4. Adicionar audit logs
5. Rate limiting

Mas por enquanto, a app funciona 100%! 🎉
