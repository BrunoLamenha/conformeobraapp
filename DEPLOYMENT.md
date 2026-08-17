# 🚀 Guia de Deployment e Instalação no Celular

## Visão Geral

Este guia mostra como:
1. Configurar Firebase Firestore (banco de dados)
2. Fazer deploy na internet
3. Instalar no celular
4. Compartilhar dados entre dispositivos

---

## 📋 Pré-requisitos

- [ ] Conta no Google (para Firebase)
- [ ] Conta no GitHub
- [ ] Navegador moderno (Chrome, Firefox, Safari)
- [ ] Celular com Android ou iOS

---

## 🔧 PASSO 1: Configurar Firebase Firestore

### 1.1 Criar Projeto Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **"Criar projeto"**
3. Preencha o nome do projeto (ex: `conformeobraapp`)
4. Desative "Google Analytics" (opcional)
5. Clique em **"Criar projeto"**

### 1.2 Habilitar Firestore

1. No menu esquerdo, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha a localização mais próxima da sua obra (ex: `southamerica-east1` - São Paulo)
4. Escolha **"Iniciar no modo de teste"**
5. Clique em **"Ativar"**

### 1.3 Obter Configuração do Firebase

1. Clique no ícone de **⚙️ Engrenagem** (Configurações)
2. Vá para **"Configurações do projeto"**
3. Em **"Seus aplicativos"**, clique em **"</>"** para registrar um app web
4. Dê um nome (ex: "Web App")
5. Marque **"Também configure o Hosting do Firebase..."** (opcional)
6. Clique em **"Registrar app"**

### 1.4 Copiar Configuração

Você verá um objeto JavaScript assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYzABcDefG",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**Copie este objeto completo** (você vai usar no próximo passo)

---

## 💾 PASSO 2: Adicionar Configuração do Firebase ao App

### 2.1 Criar arquivo de configuração local

1. Na pasta do app, crie um arquivo chamado `firebase-config.local.js`
2. Cole o seguinte conteúdo:

```javascript
export const firebaseConfig = {
  apiKey: "COLAR_AQUI",
  authDomain: "COLAR_AQUI",
  projectId: "COLAR_AQUI",
  storageBucket: "COLAR_AQUI",
  messagingSenderId: "COLAR_AQUI",
  appId: "COLAR_AQUI"
};
```

3. Substitua os valores pelos dados copiados do Firebase
4. **Salve o arquivo**

### 2.2 Adicionar CDN do Firebase

No arquivo `public/index.html`, adicione no `<head>` (ANTES das outras tags script):

```html
<head>
  <!-- ... outros meta tags ... -->
  
  <!-- Firebase -->
  <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"></script>
</head>
```

### 2.3 Atualizar firebase-init.js

O arquivo `public/js/firebase-init.js` já está preparado para importar sua configuração local. Você não precisa alterá-lo.

Ele tentará carregar as credenciais do `firebase-config.local.js`. Se o arquivo não for encontrado, o app exibirá um alerta no console e continuará funcionando em modo offline.

A lógica implementada é similar a esta:

```js
// Dentro de firebase-init.js (exemplo conceitual)
import { firebaseConfig } from './firebase-config.local.js';
// ... inicializa o Firebase com o objeto importado.
```

---

## 🔐 PASSO 3: Configurar Regras de Segurança Firestore

### 3.1 Ir para Regras Firestore

1. No Firebase Console, vá para **Firestore Database**
2. Clique na aba **"Regras"**
3. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if the user belongs to the company of the resource.
    // It checks for a 'companyId' custom claim in the user's auth token.
    function isUserInCompany(companyId) {
      return request.auth != null && request.auth.token.companyId == companyId;
    }

    // Secure rules for collections.
    // Assumes each document in these collections has a 'companyId' field.
    match /obras/{obraId} {
      allow read, write: if isUserInCompany(resource.data.companyId);
    }
    match /vistorias/{vistoriaId} {
      allow read, write: if isUserInCompany(resource.data.companyId);
    }
    match /relatorios/{relatorioId} {
      allow read, write: if isUserInCompany(resource.data.companyId);
    }
    match /projetos/{projetoId} {
      allow read, write: if isUserInCompany(resource.data.companyId);
    }
    match /pendencias/{pendenciaId} {
      allow read, write: if isUserInCompany(resource.data.companyId);
    }

    // Users can only read/write their own data.
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

4. Clique em **"Publicar"**

---

## 📤 PASSO 4: Fazer Commit e Push para GitHub

### 4.1 Inicializar Git (se ainda não fez)

```bash
cd conformeobraapp
git init
git add .
git commit -m "Initial commit: ConformeObraApp com Firebase"
```

### 4.2 Criar repositório no GitHub

1. Acesse https://github.com/new
2. Preencha:
   - **Repository name**: `conformeobraapp`
   - **Description**: "App para gestão de obras e conformidade em construção"
   - **Public** (para facilitar deploy)
3. Clique em **"Create repository"**

### 4.3 Fazer Push do código

```bash
git remote add origin https://github.com/seu-usuario/conformeobraapp.git
git branch -M main
git push -u origin main
```

**Pronto! Seu código está no GitHub! 🎉**

---

## 🌐 PASSO 5: Deploy no Firebase Hosting

### 5.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 5.2 Fazer Login no Firebase

```bash
firebase login
```

Isso abrirá o navegador para você autorizar.

### 5.3 Inicializar Projeto Firebase

```bash
firebase init hosting
```

Respostas sugeridas:
- **Use an existing Firebase project?** → Escolha seu projeto
- **What do you want to use as your public directory?** → `public`
- **Configure as single-page app?** → `y` (yes)
- **Set up automatic builds and deploys with GitHub?** → `n` (no, por enquanto)

### 5.4 Fazer Deploy

```bash
firebase deploy
```

Você verá uma URL como: `https://seu-projeto.firebaseapp.com`

**Salve esta URL - é a URL do seu app na internet! 📍**

---

## 📱 PASSO 6: Instalar no Celular (PWA)

### 6.1 Acessar no Celular

1. Abra o navegador do celular
2. Digite a URL: `https://seu-projeto.firebaseapp.com`
3. Aguarde carregar completamente

### 6.2 Android

#### Opção A: Adicionar à Home (Chrome)
1. Toque no menu **⋮** (três pontos)
2. Selecione **"Instalar aplicativo"** ou **"Adicionar à Home"**
3. Toque em **"Instalar"**
4. O app aparecerá como um ícone na home

#### Opção B: Atalho Direto (Firefox)
1. Pressione o botão de menu **⋮**
2. Selecione **"Adicionar à Home"**

### 6.3 iOS (iPhone/iPad)

1. Toque no ícone de **Compartilhar** (quadrado com seta)
2. Role para baixo e selecione **"Adicionar à Home"**
3. Digite um nome (ex: "ConformeObra")
4. Toque em **"Adicionar"**
5. O app aparecerá como um ícone na home

---

## 🔄 PASSO 7: Usar o App com Sincronização

### Como Funciona:

1. **Primeiro Acesso**: O app salva os dados no Firebase
2. **Sem Internet**: Dados são salvos localmente (offline-first)
3. **Volta Internet**: Dados sincronizam automaticamente com o Firebase
4. **Outro Dispositivo**: Vê os dados sincronizados em tempo real

### Compartilhamento de Dados:

Se você estiver logado na mesma obra/empresa:
- ✅ Todos veem as mesmas vistorias
- ✅ Todos veem os mesmos relatórios
- ✅ Todos veem as mesmas pendências
- ✅ Alterações aparecem em tempo real (ou quando sincroniza)

---

## 🧪 PASSO 8: Testar Sincronização

### Teste 1: Mesmo Dispositivo

1. Abra o app no navegador do computador
2. Abra também no celular
3. Crie uma reforma/vistoria no celular
4. Recarregue o navegador do PC
5. ✅ Os dados devem aparecer

### Teste 2: Dispositivos Diferentes

1. Um usuário logado no celular A
2. Outro usuário logado no celular B
3. Um cria uma vistoria
4. O outro recarrega a página
5. ✅ Devem ver a vistoria criada

### Teste 3: Offline

1. Ative Modo Avião no celular
2. Crie uma vistoria
3. Dados salvam localmente ✅
4. Desative Modo Avião
5. Dados sincronizam com Firebase ✅

---

## 📊 Regras de Negócio Sugeridas

Para melhorar a segurança, você pode:

1. **Adicionar Autenticação Real**
   - Emails/senhas
   - Google Sign-In
   - Autenticação de empresa

2. **Separar Dados por Obra**
   - Apenas ver sua obra
   - Apenas editar suas pendências

3. **Audit Trail**
   - Quem criou cada item
   - Quando foi criado/modificado
   - Histórico de mudanças

Veja `README.md` para mais detalhes sobre autenticação.

---

## 🆘 Solução de Problemas

### "Dados não aparecem no Firebase"
1. Verifique se Firebase está habilitado
2. Verifique as regras de segurança (modo teste = deve funcionar)
3. Verifique o console do navegador (F12) para erros

### "App não carrega no celular"
1. Verifique a URL (copie do Firebase Hosting)
2. Verifique se tem internet
3. Tente atualizar a página

### "Dados não sincronizam entre dispositivos"
1. Verifique se ambos estão com internet
2. Aguarde alguns segundos
3. Recarregue a página se necessário

### "Recebe erro de permissão"
1. Verifique as regras do Firestore
2. Teste no "Modo de teste" primeiro (seguro para desenvolvimento)

---

## 🔐 Segurança em Produção

Antes de usar com dados reais:

1. **Habilite Autenticação** (veja em Autenticação no Firebase)
2. **Atualize as Regras** (modo teste é apenas para desenvolvimento)
3. **Copie dados sensíveis** para `.env` ou arquivo local não versionado
4. **Teste backup** de dados regularmente
5. **Configure HTTPS** (Firebase faz automaticamente)

---

## 📞 Suporte Rápido

```bash
# Ver logs do deployment
firebase deploy --debug

# Limpar cache
firebase use --unaliased

# Ver versão instalada
firebase --version
```

---

**Pronto! Agora seu app está rodando na obra com sincronização em tempo real! 🚀**

Qualquer dúvida, abra uma issue no GitHub ou entre em contato.
