#!/bin/bash

# 📝 Script para fazer Commit e Push para GitHub
#
# Uso: bash commit.sh
# 
# Este script prepara tudo para fazer commit de uma forma organizada

echo "📝 Preparando commit para GitHub..."
echo ""

# Verificar se está em um repositório git
if [ ! -d ".git" ]; then
    echo "❌ Não está em um repositório Git!"
    echo "Execute: git init"
    exit 1
fi

echo "✅ Repositório Git encontrado"
echo ""

# Mostra o status
echo "📊 Status dos arquivos:"
git status -s
echo ""

# Adicionar todos os arquivos
echo "➕ Adicionando todos os arquivos..."
git add .

# Criar commit com mensagem
echo ""
echo "📝 Digite a mensagem do commit (ex: 'Add Firebase deployment setup'):"
read -p "> " commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update: Firebase deployment and offline sync setup"
fi

echo ""
echo "💾 Fazendo commit com mensagem: '$commit_message'"
git commit -m "$commit_message"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Commit criado com sucesso!"
    echo ""
    echo "📤 Fazendo push para GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Código enviado para GitHub com sucesso!"
        echo ""
        echo "🎉 Próximos passos:"
        echo "1. Crie projeto no Firebase: https://console.firebase.google.com"
        echo "2. Configure credenciais (veja DEPLOYMENT.md)"
        echo "3. Execute: bash deploy.sh"
        echo "4. Abra URL gerada no celular"
        echo ""
    else
        echo ""
        echo "⚠️  Erro no push. Verifique credenciais do GitHub."
        exit 1
    fi
else
    echo ""
    echo "⚠️  Nada para fazer commit."
    exit 1
fi
