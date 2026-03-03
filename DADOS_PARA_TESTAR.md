# 📝 DADOS PARA TESTAR

## Admin (para aprovar participantes)

```
Email: admin@urnm.ao
Password: admin123
```

Se não funcionar, procure na tabela `users` alguém com `role = 'admin'` ou `role = 'superadmin'`

---

## Participante de Teste (crie você mesmo)

### Na tela de REGISTRO:

```
Nome Completo: João Silva (ou qualquer nome)
Email: joao.silva@example.com (use um email que não existe ainda)
Senha: MinhaSenha123!
Grau Académico: Licenciado
Categoria: estudante_urnm (ou outra)
Afiliação: URNM
Instituição: Universidade Nacional de Moçambique
```

**Resultado esperado:**
- ✅ Mensagem: "Registado com sucesso"
- Status na BD: `payment_status = 'pending'`
- Can NOT login yet

---

## Fluxo Completo de Teste (para verificar tudo)

### 1. Register
- **Email novo:** teste1@example.com
- **Senha:** teste123
- **Esperado:** ✅ "Registado com sucesso"

### 2. Tentar Login (vai falhar)
- **Email:** teste1@example.com
- **Senha:** teste123
- **Esperado:** ❌ "Sua inscrição aguarda aprovação do administrador"

### 3. Admin aprova
- **Login admin** com admin@urnm.ao / admin123
- **Vai para:** Gestão → Participantes
- **Procura:** teste1@example.com
- **Clica:** Botão verde "Aprovar"
- **Esperado:** ✅ "Participante aprovado com sucesso"

### 4. Login agora funciona
- **Logout** (sair como admin)
- **Login** com teste1@example.com / teste123
- **Esperado:** ✅ Entra na app, vai para Home

---

## Dados que aparecem na BD depois de tudo

**Tabela `users` (participante):**

| Campo | Valor |
|-------|-------|
| id | (auto) |
| full_name | João Silva |
| email | joao.silva@example.com |
| password | bcrypt(MinhaSenha123!) |
| role | participant |
| payment_status | **approved** (depois de admin clicar no botão) |
| payment_amount | 3000 (estudante_urnm) |
| qr_code | URNM-1234567890-abc123def |
| is_checked_in | false |
| approved_at | 2024-01-15 10:30:00 (timestamp quando admin aprovou) |
| created_at | 2024-01-15 10:25:00 |

---

## QR Code Check-in (teste avançado)

Se tudo funcionar, pode testar à scanner:

1. **Na tesouraria/entrada:**
   - Abra o Scanner (aba Scanner)
   - Escaneia o QR code do participante

2. **QR code encontra-se em:**
   - Na BD: coluna `qr_code` (formato: `URNM-{timestamp}-{hash}`)
   - Pode gerar também: https://qr-server.com/api/v1/create-qr-code/?size=300x300&data=URNM-1234567890-abc123def

3. **Esperado:**
   - ✅ "Check-in realizado com sucesso"
   - Campo `is_checked_in` muda para `true` na BD

---

## Dados que o Admin vê

**Quando admin entra em "Gestão de Participantes":**

| Nome | Email | Status | Ação |
|------|-------|--------|------|
| João Silva | joao.silva@example.com | **pending** | 🟢 Aprovar 🔴 Rejeitar |
| Maria Costa | maria@example.com | **approved** | ✅ (já aprovado) |

---

**Sucesso no teste = Aplicação está pronta para APK!** 🎉
