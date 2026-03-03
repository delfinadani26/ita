# 🚀 Guia de Configuração Supabase

## Passo 1: Criar as Tabelas no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login
3. Clique no projeto **ita2**
4. Vá até **SQL Editor** (lado esquerdo)
5. Clique em **+ New Query**
6. Copie todo o conteúdo do arquivo `supabase_setup.sql` deste projeto
7. Cole na janela de SQL
8. Clique em **Run** (botão azul canto superior direito)
9. Aguarde que termine (você verá uma confirmação)

## Passo 2: Configurar Variáveis de Ambiente ✅ (JÁ FEITO)

O arquivo `.env.local` já foi preenchido com:
```env
DATABASE_URL=postgresql://postgres:Isaiasqueta*33@vmboexvqywxlkrhphfpl.supabase.co:5432/postgres
EXPO_PUBLIC_SUPABASE_URL=https://vmboexvqywxlkrhphfpl.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_fIWAW0zRADVjiB1Rc1xxDw_59sAOE
```

## Passo 3: Aplicar Migrations (Opcional - se estiver usando Drizzle Kit)

Se quiser usar o Drizzle Kit para gerenciar as tabelas:

```bash
# Gerar migrations
npm run db:push

# Ou
drizzle-kit push:pg
```

## Passo 4: Testar a Conexão

No terminal, execute:

```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:Isaiasqueta*33@vmboexvqywxlkrhphfpl.supabase.co:5432/postgres'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Erro:', err.message);
  else console.log('✅ Conectado ao Supabase!', res.rows[0]);
  pool.end();
});
"
```

## Passo 5: Iniciar o Servidor

```bash
npm run server:dev
```

## 📊 Esquema das Tabelas

### users
- Armazena informações dos usuários (participantes, avaliadores, admins)
- Inclui informações de pagamento e check-in

### submissions
- Artigos/trabalhos enviados pelos usuários
- Inclui informações de revisão

### messages
- Sistema de chat/mensagens entre usuários
- Relacionado a submissões

### congress_program
- Programa do congresso (agenda)
- Eventos e atividades

## 🔒 Segurança

- RLS (Row Level Security) foi ativado no Supabase
- Recomendado: Usar Supabase Auth para autenticação de usuários
- Nunca exponha a senha do banco em cliente (só use a chave pública)

## ⚠️ Importante

- A `DATABASE_URL` contém a senha - **NÃO commit no Git**
- Adicione `.env.local` ao `.gitignore`
- Para produção, use variáveis de ambiente do servidor seguras

## ❓ Problemas?

Se receber erro de conexão:
1. Verifique se a senha está correta na DATABASE_URL
2. Confirme que o IP do seu servidor está na whitelist do Supabase
3. Verifique o status do projeto em [supabase.com](https://supabase.com)
