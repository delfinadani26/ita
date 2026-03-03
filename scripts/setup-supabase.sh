#!/bin/bash

# ============================================
# SCRIPT: Setup Supabase 100% (Automático)
# ============================================

echo "🚀 Iniciando migração para Supabase 100%..."

# 1. Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI não encontrado."
    echo "Instale com: npm install -g @supabase/cli"
    echo ""
    echo "OU faça manualmente:"
    echo "1. Abra: https://supabase.com/dashboard"
    echo "2. Vá para SQL Editor"
    echo "3. Cole o conteúdo de: supabase/rpc_functions.sql"
    echo "4. Clique RUN"
    exit 1
fi

echo "✅ Supabase CLI encontrado"

# 2. Login no Supabase
echo ""
echo "🔐 Fazendo login no Supabase..."
supabase link

# 3. Executar migrations
echo ""
echo "📊 Executando SQL scripts..."
supabase db push

echo ""
echo "✅ SETUP COMPLETO!"
echo ""
echo "Próximos passos:"
echo "1. Parar Express: Ctrl+C"
echo "2. Iniciar app: npm run expo:dev"
echo "3. Testar: Registar → Login → Admin Approval"
