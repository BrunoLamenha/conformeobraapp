# Conforme Obras - PWA de Gestão de Obras e Reformas

Aplicação web leve e responsiva para gestão operacional de obras, reformas, vistorias, pendências, projetos e relatórios. Funciona em desktop e mobile, com ou sem conexão à internet.

## 🎯 Características Principais

### Módulos Operacionais
- **Dashboard**: Visão geral de obras ativas, pendências e reformas
- **Reformas**: Registro de reformas por cômodo com disciplinas e quantidades
- **Vistorias**: Checklist de inspeção com suporte a fotos
- **Projetos**: Upload e análise de PDFs de projeto com quantitativos
- **Pendências**: Gerenciamento de questões abertas com prioridade e status
- **Relatórios**: Geração de relatórios operacionais com exportação para impressão
- **Usuários**: Cadastro e gerenciamento de usuários
- **Orçamentos**: Estimativas de materiais e custos

### Tecnologia
- **Estrutura**: SPA estática com HTML, CSS e JavaScript vanilla
- **Armazenamento**: localStorage (offline) com fallback para Firestore (quando configurado)
- **Responsivo**: Mobile-first, funciona em celulares e navegadores
- **PWA**: Instalável como app, com service worker para offline

## 🚀 Como Usar Sem Instalar Muita Coisa

### Opção 1: Abrir Diretamente no Navegador
1. Navegue até a pasta `docs/`
2. Clique duas vezes em `index.html`
3. O app abre e funciona 100% no navegador

### Opção 2: Usar um Servidor Local

#### Windows - PowerShell (recomendado)
```powershell
cd "c:\Users\...\conformeobraapp"
# Use Python 3
python -m http.server 8000
# OU se não tiver Python, use Node
npx http-server docs
```

#### macOS / Linux
```bash
cd ~/conformeobraapp
python3 -m http.server 8000
```

Acesse: **http://localhost:8000**

## 📱 Primeiro Uso

### Fluxo de Login
1. **Selecione empresa**: Construtora Alpha, Obras Premium ou Urbaniza Norte
2. **Digite nome**: Seu nome de usuário
3. **Senha**: Qualquer valor (demo, sem autenticação real)
4. Clique em **Entrar**

### Navegação Principal
Após login, use os ícones no menu para acessar os módulos:

| Ícone | Módulo | Descrição |
|-------|--------|-----------|
| 🏠 | Dashboard | Resumo geral da operação |
| 🛠️ | Reformas | Registre reformas por cômodo e discipline |
| 🧾 | Vistorias | Inspeções com fotos e checklist |
| 📐 | Projetos | Upload e análise de PDFs |
| 📄 | Relatórios | Gera relatório consolidado |
| 🚧 | Pendências | Controle de problemas em aberto |
| 👤 | Usuários | Cadastro de usuários do projeto |
| 💰 | Orçamentos | Estimativas de custos |

## 💾 Armazenamento de Dados

### Modo Offline (localStorage)
- Dados salvos automaticamente no navegador
- Funciona 100% offline
- Dados persistem após fechar o navegador
- Limite: ~10 MB por domínio

### Modo Online (Firestore)
- Sincronização em tempo real entre dispositivos
- Backup automático na nuvem
- Requer configuração (ver seção Firebase abaixo)

## 🔥 Configurar Firebase (Opcional)

Para usar sincronização em nuvem:

### 1. Crie um Projeto Firebase
- Acesse https://console.firebase.google.com
- Clique em **"Criar projeto"**
- Preencha nome e configurações
- Aceite o contrato e crie

### 2. Ative Firestore Database
- No painel do projeto, vá para **"Firestore Database"**
- Clique em **"Criar banco de dados"**
- Escolha modo: **iniciar em modo teste** (depois configure segurança)
- Escolha localização: **southamerica-east1** (São Paulo)

### 3. Configure a App
- No arquivo `docs/js/firebase-init.js`, procure:
  ```javascript
  const firebaseConfig = {
    apiKey: 'SUA_API_KEY_AQUI',
    authDomain: 'seu-projeto.firebaseapp.com',
    projectId: 'seu-projeto',
    storageBucket: 'seu-projeto.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456'
  };
  ```

- Substitua pelas suas credenciais (encontre em Configurações do Projeto > Apps Web)

### 4. Adicione SDKs ao HTML
No final da tag `<head>` do arquivo `docs/index.html`, adicione:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"></script>
```

### 5. Configure Segurança Firestore
No console Firebase, vá a **Firestore > Regras** e adicione:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Demo - depois configure autenticação real
    }
  }
}
```

## 📊 Fluxo de Trabalho Recomendado

### 1. Cadastrar Usuários
- Menu > Usuários > Novo usuário
- Preencha nome, email, papel

### 2. Registrar Reformas
- Menu > Reformas > Novo projeto
- Selecione cômodos (suíte, banheiro, cozinha, etc)
- Sistema gera checklist automaticamente por disciplina
- Escolha quantidade por cômodo

### 3. Realizar Inspeção
- Menu > Vistorias > Nova vistoria
- Preencha dados gerais (obra, responsável)
- Para cada item, marque status (conforme/pendente/não aplica)
- Adicione observações
- Anexe fotos (até múltiplas por pendência)

### 4. Gerenciar Pendências
- Menu > Pendências
- Filtre por obra ou prioridade
- Visualize fotos anexadas
- Marque como "Concluído" quando resolvida

### 5. Gerar Relatório
- Menu > Relatórios
- Clique em "Gerar relatório"
- Visualize resumo executivo com percentuais
- Clique em "Exportar PDF" para imprimir

## 📁 Estrutura de Arquivos

```
conformeobraapp/
├── public/
│   ├── index.html                 # App shell principal
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker (offline)
│   ├── css/
│   │   ├── global.css             # Estilos principais
│   │   └── wizard.css             # Estilos do wizard
│   ├── js/
│   │   ├── app.js                 # Controlador principal
│   │   ├── firebase-init.js       # Configuração Firebase
│   │   └── modules/               # Lógica dos módulos
│   │       ├── reformas.js
│   │       ├── vistorias.js
│   │       ├── projetos.js
│   │       ├── relatorios.js
│   │       ├── pendencias.js
│   │       └── ... (outros módulos)
│   └── assets/
│       └── logo/
│           └── logo.png           # Logo da empresa
├── firebase.json                  # Config Firebase Hosting
├── .firebaserc                    # Projeto Firebase padrão
└── README.md                      # Este arquivo
```

## 🎨 Design e UX

- **Cores**: Palette de engenharia com azuis e cinzas (segurança, confiança)
- **Layout**: Grid responsivo, mobile-first
- **Acessibilidade**: ARIA labels, navegação por teclado
- **Performance**: Sem dependências pesadas, <200KB total

## 📷 Recursos de Imagem

### Upload de Fotos
- Suporte a múltiplas fotos por pendência/inspeção
- Preview em galeria thumbnail
- Armazenamento em base64 no localStorage

### Projetos (PDFs)
- Upload de arquivo PDF
- Análise automática de quantitativos (simulada)
- Visualização em iframe do navegador
- Download do PDF original

## 🔒 Segurança

### Dados Locais (localStorage)
- Sem criptografia (dados em texto plano no navegador)
- Acesso restrito ao domínio
- Limite de armazenamento (~10MB)

### Firebase (quando ativado)
- Configure regras de Firestore (ver seção acima)
- Recomenda-se adicionar autenticação antes de produção
- Chaves de API devem ser restringidas no console Firebase

## ⚠️ Limitações

- Sem autenticação real (demo)
- Sem backend robusto (localStorage tem limite)
- Análise de PDF é simulada (implemente com API real: Google Vision, Aspose, etc)
- Sem suporte a versionamento de projetos

## 🚀 Melhorias Futuras

- [ ] Autenticação com Firebase Auth
- [ ] Integração com API de OCR real para PDFs
- [ ] Sincronização Firestore completa
- [ ] Histórico de versões de projetos
- [ ] Exportação para Word/Excel avançada
- [ ] App nativa mobile (React Native/Flutter)
- [ ] Dashboard analítico com gráficos

## 📞 Suporte

Para questões, problemas ou sugestões de features, consulte a documentação acima ou revise o código-fonte nos arquivos JavaScript.

---

**Desenvolvido com foco em simplicidade, leveza e usabilidade para campo.**  
*v1.0 - Agosto 2026*
