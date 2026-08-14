# 🌐 RESUMO RÁPIDO: Deploy e Instalação

## 📋 Checklist Rápido

- [ ] Criou projeto no Firebase Console
- [ ] Criou arquivo `firebase-config.local.js`
- [ ] Adicionou CDN do Firebase no `public/index.html`
- [ ] Fez `git commit` e `git push` para GitHub
- [ ] Instalou Firebase CLI: `npm install -g firebase-tools`
- [ ] Fez login: `firebase login`
- [ ] Fez deploy: `firebase deploy`
- [ ] Instalou no celular acessando a URL gerada

---

## ⚡ Comandos Rápidos

```bash
# 1. Configurar Firebase Firestore
# (Acesse https://console.firebase.google.com e siga DEPLOYMENT.md)

# 2. Criar arquivo de config local
# (Copie firebase-config.example.js e renomeie para firebase-config.local.js)

# 3. Fazer commit
git add .
git commit -m "Add Firebase config and deployment setup"
git push origin main

# 4. Instalar Firebase CLI (primeira vez)
npm install -g firebase-tools

# 5. Login no Firebase
firebase login

# 6. Deploy automático
bash deploy.sh
# OU manual:
firebase deploy --only hosting

# 7. Ver URL do app
# Acesse: https://seu-projeto.firebaseapp.com

# 8. Instalar no celular
# Abra a URL acima no navegador do celular
# Menu (⋮) > "Instalar aplicativo"
```

---

## 🎯 O Que Funciona

### Online (Com Firestore)
- ✅ Dados sincronizam entre dispositivos
- ✅ Vários usuários veem as mesmas reformas/vistorias
- ✅ Offline-first: salva localmente, sincroniza quando volta internet

### Offline (Sem Firestore)
- ✅ Funciona 100% sem internet
- ✅ Dados salvos no localStorage
- ✅ Cada dispositivo tem seus próprios dados

---

## 📱 Instalação no Celular (Passo-a-Passo)

### Android (Chrome)
1. Abra: `https://seu-projeto.firebaseapp.com`
2. Menu (⋮) > **"Instalar aplicativo"**
3. Confirme
4. App instalado na home ✅

### iPhone (Safari)
1. Abra: `https://seu-projeto.firebaseapp.com`
2. Compartilhar (↑)
3. **"Adicionar à Home"**
4. Confirme
5. App instalado na home ✅

---

## 🔄 Compartilhamento de Dados

### Mesma Empresa/Obra
Se dois usuários estão na mesma empresa:
- Usuário A cria uma vistoria
- Usuário B (no celular) recarrega
- ✅ Vê a vistoria criada por A

### Dados Sincronizam Quando:
- ✅ Ambos com internet
- ✅ Após salvar dados
- ✅ Ao mudar de view
- ✅ A cada 30 segundos (verificação automática)

---

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Firebase não definido" | Adicione CDN no `<head>` do HTML |
| "Erro de permissão" | Configure modo teste nas regras Firestore |
| "Dados não sincronizam" | Verifique internet, recarregue página |
| "App não instala" | Tente HTTPS, não HTTP |
| "Offline não funciona" | Verifique service worker em DevTools |

---

## 📚 Próximos Passos

1. **Autenticação Real**: Trocar por Google Sign-In ou Email/Senha
2. **Backup Automático**: Configurar backup diário
3. **Notificações**: Alertas de pendências críticas
4. **Compartilhamento**: Enviar dados por email/WhatsApp

Ver detalhes em `DEPLOYMENT.md` e `WHATSAPP_GUIDE.md`.

---

**Tudo pronto! Seu app está na obra com sincronização em tempo real 🚀**
