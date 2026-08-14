# 📱 Guia de Compartilhamento por WhatsApp

## Visão Geral

A funcionalidade de compartilhamento por WhatsApp permite enviar relatórios, vistorias, projetos e pendências diretamente via WhatsApp, sem necessidade de downloads ou conversões manuais.

## 🎯 Onde Usar

### 1. **Relatórios** 
- **Local:** Menu principal → Relatórios
- **Botão:** 📱 WhatsApp (verde)
- **Dados Compartilhados:**
  - Data do relatório
  - Métricas de reformas (completas, em andamento)
  - Total de pendências
  - Alertas críticos
  - Próximas ações

### 2. **Vistorias**
- **Local:** Menu principal → Vistorias
- **Botão:** 📱 WhatsApp (verde)
- **Dados Compartilhados:**
  - Status da vistoria (✅ Conforme / ⚠️ Alerta / ❌ Pendente)
  - Obra e área/setor visitado
  - Responsável pela inspeção
  - Data da vistoria
  - Observações completas
  - Pendências identificadas

### 3. **Projetos**
- **Local:** Menu principal → Projetos e Documentação
- **Botão:** 📱 WhatsApp (verde)
- **Dados Compartilhados:**
  - Nome do projeto
  - Obra associada
  - Responsável
  - Status do projeto
  - Data de upload
  - Quantitativos analisados (se disponível)

### 4. **Pendências**
- **Local:** Menu principal → Pendências
- **Botão:** 📱 WhatsApp (verde)
- **Dados Compartilhados:**
  - Total de pendências ativas
  - Distribuição por prioridade (Crítica/Alta/Normal)
  - Listagem das 5 principais pendências
  - Emojis indicadores de prioridade

## 📋 Como Usar

### Passo 1: Abrir o Compartilhamento
1. Navegue até o módulo desejado (Relatórios, Vistorias, Projetos ou Pendências)
2. Clique no botão verde **📱 WhatsApp**

### Passo 2: Configurar Envio
Uma modal aparecerá com:

- **Campo de Telefone (opcional)**
  - Formato: `55 11 99999-9999`
  - Deixe em branco para usar WhatsApp Web
  - Se preenchido, irá direto para o contato

- **Campo de Mensagem**
  - A mensagem vem pré-preenchida com dados formatados
  - Você pode editar se desejar personalizar
  - A mensagem inclui emoji e formatação para facilitar leitura

### Passo 3: Enviar
1. Revise a mensagem
2. Clique em **📤 Enviar**
3. Uma aba do WhatsApp abrirá automaticamente com a mensagem pronta

### Passo 4: Confirmar no WhatsApp
- Se você informou um número, a conversa abrirá já com esse contato
- Se deixou em branco, o WhatsApp Web pedirá para você escolher o contato
- Revise a mensagem e clique em Enviar no WhatsApp

## 💾 Histórico de Compartilhamentos

Todos os compartilhamentos são salvos em histórico local:
- **Locação:** localStorage do navegador
- **Dados Guardados:** Tipo, título, resumo, timestamp
- **Limite:** Últimos 50 compartilhamentos
- **Permanência:** Até limpar dados do navegador

## 🔒 Privacidade e Segurança

- ✅ Nenhum dado é enviado para servidor externo
- ✅ Compartilhamento é feito diretamente via WhatsApp Web
- ✅ Dados sensíveis permanecem no seu dispositivo
- ✅ Histórico é armazenado localmente

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Dispositivos
- ✅ Desktop/Laptop
- ✅ Tablet
- ✅ Smartphone

## ⚙️ Requisitos

1. **WhatsApp Instalado ou Web**
   - Se informar número: WhatsApp Web aberto no navegador
   - Se deixar em branco: WhatsApp Web abrirá automaticamente

2. **Dados Disponíveis**
   - Cada módulo precisa ter dados salvos para compartilhar
   - Se não houver dados, uma mensagem padrão será enviada

3. **Conexão com Internet**
   - Necessária para abrir WhatsApp Web

## 🎨 Formatação das Mensagens

Cada tipo de documento tem formatação otimizada:

### Relatório
```
📊 *RELATÓRIO DE CONFORMIDADE*

*Data:* XX/XX/XXXX
*Período:* Junho 2024

*Métricas:*
✅ Reformas concluídas: X
⏳ Reformas em andamento: X
❌ Pendências identificadas: X
⚠️ Alertas críticos: X

*Próximas ações:*
• Ação 1
• Ação 2
```

### Vistoria
```
📋 *RELATÓRIO DE VISTORIA*

[STATUS] *Status:* CONFORME/ALERTA/PENDENTE
*Obra:* ...
*Área/Setor:* ...
*Responsável:* ...
*Data:* XX/XX/XXXX

*Observações:*
...

*Pendências:* ...
```

### Projeto
```
📄 *PROJETO - DOCUMENTAÇÃO*

*Nome:* ...
*Obra:* ...
*Responsável:* ...
*Status:* ...
*Data Upload:* XX/XX/XXXX

*Quantitativos Analisados:*
• Item 1: valor
• Item 2: valor
```

### Pendências
```
⚠️ *RELATÓRIO DE PENDÊNCIAS*

*Total:* X pendências

*Por Prioridade:*
🔴 Críticas: X
🟡 Altas: X
🟢 Normais: X

*Principais Pendências:*
🔴 Pendência 1
🟡 Pendência 2
🟢 Pendência 3
```

## 🆘 Solução de Problemas

### "WhatsApp não abriu"
- Verifique se WhatsApp Web está aberto em outra aba
- Tente novamente deixando o campo de telefone em branco
- Se usar número, certifique-se do formato correto

### "Mensagem não aparece corretamente"
- Alguns caracteres especiais podem não suportar em todos os dispositivos
- Tente reenviar ou editar a mensagem no WhatsApp

### "Histórico desapareceu"
- O histórico é armazenado no localStorage
- Limpar dados do navegador apagará o histórico
- Considere fazer backup manualmente

## 📊 Casos de Uso Recomendados

1. **Compartilhar com Clientes**
   - Envie relatórios periódicos
   - Mantenha cliente atualizado sobre progresso

2. **Comunicação com Obra**
   - Compartilhe vistorias com responsáveis da obra
   - Comunique pendências críticas

3. **Documentação de Projetos**
   - Distribua projetos para equipes
   - Compartilhe análises quantitativas

4. **Alertas de Pendências**
   - Notifique sobre itens críticos
   - Coordene correções com fornecedores

## 🔄 Integração com Fluxos Existentes

O compartilhamento se integra com:
- ✅ Dashboard de Relatórios
- ✅ Sistema de Vistorias
- ✅ Gerenciador de Projetos
- ✅ Rastreamento de Pendências

## 📝 Notas

- As mensagens são **traduzidas para português** automaticamente
- Todos os dados são **não-sensíveis** (sem senha ou tokens)
- O compartilhamento é **auditado no histórico local**
- Mensagens podem ser **personalizadas antes de enviar**

---

**Versão:** 1.0  
**Última atualização:** 2024  
**Suporte:** ConformeObraApp
