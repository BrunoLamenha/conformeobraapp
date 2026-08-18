#!/bin/bash

# 🚀 Script de Deploy Automático no Firebase Hosting
# 
# Uso: bash deploy.sh
# 
# Este script:
# 1. Verifica se Firebase CLI está instalado
# 2. Faz login no Firebase (se necessário)
# 3. Deploy do app
# 4. Mostra a URL final

echo "🚀 Iniciando deploy do ConformeObraApp..."
echo ""

# Verificar se firebase-tools está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI não encontrado!"
    echo "Instale com: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI encontrado"
echo ""

# Verificar se está no diretório correto
if [ ! -f "firebase.json" ]; then
    echo "❌ Erro: firebase.json não encontrado!"
    echo "Execute este script na raiz do projeto conformeobraapp"
    exit 1
fi

echo "✅ Arquivo firebase.json encontrado"
echo ""

# Verificar se o diretório de deploy (docs) e o index.html existem
if [ ! -d "docs" ] || [ ! -f "docs/index.html" ]; then
    echo "❌ Erro: Pasta 'docs' ou 'docs/index.html' não encontrada!"
    echo "Certifique-se de que todos os arquivos do aplicativo estão dentro da pasta 'docs'."
    exit 1
fi

echo "✅ Estrutura do projeto validada"
echo ""

# Fazer login se necessário
echo "📱 Verificando autenticação Firebase..."
firebase auth:export --format json &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔐 Fazendo login no Firebase..."
    firebase login
else
    echo "✅ Já autenticado no Firebase"
fi

echo ""
echo "📤 Fazendo deploy para Firebase Hosting..."
echo ""

# Deploy
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "🌐 Seu app está disponível em:"
    echo ""
    firebase hosting:channel:list 2>/dev/null || echo "   Verifique em: https://console.firebase.google.com"
    echo ""
    echo "📱 Para instalar no celular:"
    echo "   1. Acesse a URL acima no navegador do celular"
    echo "   2. Toque no menu (⋮) > 'Instalar aplicativo'"
    echo "   3. Pronto! O app está na home do seu celular"
    echo ""
else
    echo ""
    echo "❌ Erro no deploy. Tente novamente."
    exit 1
fi
