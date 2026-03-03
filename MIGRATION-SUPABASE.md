# 🚀 Migração: Expo + Supabase Direct

Sua app agora se conecta **diretamente ao Supabase** em vez de passar pelo servidor Express!

## ✅ O que foi feito:

1. **Instalado `@supabase/supabase-js`** - client do Supabase
2. **Criado `lib/supabase.ts`** - instância do cliente Supabase
3. **Atualizado `AuthContext.tsx`** - agora usa Supabase Auth + Database

## 🔑 Variáveis de Ambiente (já configuradas)

```env
EXPO_PUBLIC_SUPABASE_URL=https://vmboexvqywxlkrhphfpl.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_fIWAW0zRADVjiB1Rc1xxDw_59sAOE
```

## 📋 Como funciona agora:

### Login
```
Expo App → Supabase Auth → Supabase Database
```

Antes:
```
Expo App → Servidor Express → PostgreSQL
```

## ⚠️ IMPORTANTE: Segurança na Tabela `users`

**Problema:** A coluna `password` está na tabela pública!

### Solução: Remover a coluna password (use Supabase Auth)

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar uma nova coluna user_id_auth para vincular com auth.users
ALTER TABLE public.users ADD COLUMN user_id_auth UUID;

-- Copiar IDs do auth.users (você precisa fazer isso manualmente)
-- Isso requer uma função ou procedure

-- Depois que vinculado, remova a coluna password
ALTER TABLE public.users DROP COLUMN password;

-- Adicionar constraint
ALTER TABLE public.users 
  ADD CONSTRAINT users_user_id_auth_fkey 
  FOREIGN KEY (user_id_auth) 
  REFERENCES auth.users(id);
```

Ou **mantenha simples por enquanto** e apenas:
- **Nunca exponha a coluna password** nas políticas RLS
- Use Supabase Auth para login (já feito ✅)

## 🧪 Testar:

1. Abra o app
2. Tente fazer login com credenciais criadas antes
3. Se não funcionou, vá em Supabase Dashboard → Auth → Users
4. Crie um novo usuário teste

## 📚 Recursos:

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## 🚨 Se der erro de conexão:

1. Verifique se as chaves estão corretas em `.env.local`
2. Confirme que as tabelas foram criadas em Supabase (vá em Database → Tables)
3. Cheque as RLS policies (elas podem bloquear acesso)

## Próximas Melhorias:

- [ ] Implementar recuperação de senha com Supabase
- [ ] Usar Supabase para storage de arquivos (submissões)
- [ ] Real-time para messages com Supabase Realtime
- [ ] Melhorar RLS policies para segurança

**Agora você não precisa do servidor Express rodando para login!** 🎉
