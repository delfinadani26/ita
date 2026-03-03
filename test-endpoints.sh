#!/bin/bash

# ============================================
# SCRIPT DE TESTE - VERIFICAR ENDPOINT
# CSA 2026 - Testar API
# ============================================

echo "🔍 Testando endpoints da API..."
echo ""

# TESTE 1: Verificar se servidor está online
echo "1️⃣ Verificando se servidor está online..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://10.129.63.84:5000/api/public/stats

echo ""
echo "2️⃣ Obtendo dados de /api/public/stats..."
curl -s http://10.129.63.84:5000/api/public/stats | jq .

echo ""
echo "3️⃣ Contando participantes diretos..."
curl -s http://10.129.63.84:5000/api/check/raw-sql 2>&1 | jq .

echo ""
echo "4️⃣ Debug completo..."
curl -s http://10.129.63.84:5000/api/debug/users 2>&1 | jq .

echo ""
echo "✅ Testes completos!"
