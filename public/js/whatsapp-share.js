/**
 * Módulo de compartilhamento por WhatsApp
 * Permite enviar relatórios, vistorias, projetos e pendências via WhatsApp
 */

const whatsappShare = {
  currentData: null,
  currentType: null,

  // Inicializar module
  init() {
    this.setupEventListeners();
  },

  // Configurar event listeners
  setupEventListeners() {
    // Botões de compartilhamento
    const compartilharRelatorio = document.getElementById('compartilharRelatorioWhatsapp');
    const compartilharVistoria = document.getElementById('compartilharVistoriaWhatsapp');
    const compartilharProjeto = document.getElementById('compartilharProjetoWhatsapp');
    const compartilharPendencias = document.getElementById('compartilharPendenciasWhatsapp');

    // Modal
    const closeBtn = document.querySelector('.close-whatsapp');
    const cancelBtn = document.getElementById('whatsappCancelBtn');
    const sendBtn = document.getElementById('whatsappSendBtn');

    if (compartilharRelatorio) {
      compartilharRelatorio.addEventListener('click', () => this.openShareModal('relatorio'));
    }
    if (compartilharVistoria) {
      compartilharVistoria.addEventListener('click', () => this.openShareModal('vistoria'));
    }
    if (compartilharProjeto) {
      compartilharProjeto.addEventListener('click', () => this.openShareModal('projeto'));
    }
    if (compartilharPendencias) {
      compartilharPendencias.addEventListener('click', () => this.openShareModal('pendencias'));
    }

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeShareModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeShareModal());
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendViaWhatsapp());
  },

  // Abrir modal de compartilhamento
  openShareModal(type) {
    this.currentType = type;
    const data = this.prepareMessageData(type);
    this.currentData = data;

    // Pré-preencher a mensagem
    const messageArea = document.getElementById('whatsappMessage');
    if (messageArea) {
      messageArea.value = data.message;
    }

    // Mostrar modal
    const modal = document.getElementById('whatsappShareModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  },

  // Fechar modal
  closeShareModal() {
    const modal = document.getElementById('whatsappShareModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    document.getElementById('whatsappPhone').value = '';
    document.getElementById('whatsappMessage').value = '';
  },

  // Preparar dados da mensagem com base no tipo
  prepareMessageData(type) {
    switch (type) {
      case 'relatorio':
        return this.prepareRelatarioData();
      case 'vistoria':
        return this.prepareVistoriaData();
      case 'projeto':
        return this.prepareProjetoData();
      case 'pendencias':
        return this.preparePendenciasData();
      default:
        return { message: '' };
    }
  },

  // Preparar dados de relatório
  prepareRelatarioData() {
    const relatorios = window.loadedData?.relatorios || [];
    const ultimoRelatorio = relatorios[relatorios.length - 1];

    if (!ultimoRelatorio) {
      return {
        message: '📊 Relatório de Conformidade\n\nSem dados disponíveis ainda.'
      };
    }

    const timestamp = new Date(ultimoRelatorio.data).toLocaleDateString('pt-BR');
    const message = `📊 *RELATÓRIO DE CONFORMIDADE*\n\n` +
      `*Data:* ${timestamp}\n` +
      `*Período:* Junho 2024\n\n` +
      `*Métricas:*\n` +
      `✅ Reformas concluídas: ${ultimoRelatorio.reformasCompletas || 0}\n` +
      `⏳ Reformas em andamento: ${ultimoRelatorio.reformasAndamento || 0}\n` +
      `❌ Pendências identificadas: ${ultimoRelatorio.pendenciasTotal || 0}\n` +
      `⚠️ Alertas críticos: ${ultimoRelatorio.alertasCriticos || 0}\n\n` +
      `*Próximas ações:*\n` +
      `• Revisão de fachada - Bloco A\n` +
      `• Acabamento interior - Bloco B\n` +
      `• Inspeção elétrica\n\n` +
      `Enviado via ConformeObraApp`;

    return {
      message,
      title: 'Relatório de Conformidade',
      type: 'relatório'
    };
  },

  // Preparar dados de vistoria
  prepareVistoriaData() {
    const vistorias = window.loadedData?.vistorias || [];
    const ultimaVistoria = vistorias[vistorias.length - 1];

    if (!ultimaVistoria) {
      return {
        message: '📋 Vistoria\n\nSem dados disponíveis ainda.'
      };
    }

    const statusEmoji = ultimaVistoria.status === 'ok' ? '✅' : 
                        ultimaVistoria.status === 'alerta' ? '⚠️' : '❌';

    const message = `📋 *RELATÓRIO DE VISTORIA*\n\n` +
      `${statusEmoji} *Status:* ${ultimaVistoria.status.toUpperCase()}\n` +
      `*Obra:* ${ultimaVistoria.obra || 'Não informado'}\n` +
      `*Área/Setor:* ${ultimaVistoria.area || 'Não informado'}\n` +
      `*Responsável:* ${ultimaVistoria.responsavel || 'Não informado'}\n` +
      `*Data:* ${new Date(ultimaVistoria.data).toLocaleDateString('pt-BR')}\n\n` +
      `*Observações:*\n${ultimaVistoria.observacoes || 'Nenhuma observação'}\n\n` +
      `${ultimaVistoria.pendencias ? `*Pendências:* ${ultimaVistoria.pendencias}\n\n` : ''}` +
      `Enviado via ConformeObraApp`;

    return {
      message,
      title: 'Relatório de Vistoria',
      type: 'vistoria'
    };
  },

  // Preparar dados de projeto
  prepareProjetoData() {
    const projetos = window.loadedData?.projetos || [];
    const ultimoProjeto = projetos[projetos.length - 1];

    if (!ultimoProjeto) {
      return {
        message: '📄 Projeto\n\nSem dados disponíveis ainda.'
      };
    }

    const message = `📄 *PROJETO - DOCUMENTAÇÃO*\n\n` +
      `*Nome:* ${ultimoProjeto.nome || 'Não informado'}\n` +
      `*Obra:* ${ultimoProjeto.obra || 'Não informado'}\n` +
      `*Responsável:* ${ultimoProjeto.responsavel || 'Não informado'}\n` +
      `*Status:* ${ultimoProjeto.status || 'Não informado'}\n` +
      `*Data Upload:* ${new Date(ultimoProjeto.dataUpload).toLocaleDateString('pt-BR')}\n\n` +
      `*Quantitativos Análisados:*\n` +
      (ultimoProjeto.quantitativos ? 
        Object.entries(ultimoProjeto.quantitativos)
          .map(([key, value]) => `• ${key}: ${value}`)
          .join('\n') : 
        'Não analisado ainda') +
      `\n\nEnviado via ConformeObraApp`;

    return {
      message,
      title: 'Projeto - Documentação',
      type: 'projeto'
    };
  },

  // Preparar dados de pendências
  preparePendenciasData() {
    const pendencias = window.loadedData?.pendencias || [];
    
    if (pendencias.length === 0) {
      return {
        message: '⚠️ Pendências\n\nSem pendências registradas.'
      };
    }

    const criticas = pendencias.filter(p => p.prioridade === 'crítica').length;
    const altas = pendencias.filter(p => p.prioridade === 'alta').length;
    const normais = pendencias.filter(p => p.prioridade === 'normal').length;

    let message = `⚠️ *RELATÓRIO DE PENDÊNCIAS*\n\n` +
      `*Total:* ${pendencias.length} pendências\n\n` +
      `*Por Prioridade:*\n` +
      `🔴 Críticas: ${criticas}\n` +
      `🟡 Altas: ${altas}\n` +
      `🟢 Normais: ${normais}\n\n` +
      `*Principais Pendências:*\n`;

    // Listar as 5 primeiras pendências
    pendencias.slice(0, 5).forEach((p, idx) => {
      const prioEmoji = p.prioridade === 'crítica' ? '🔴' : 
                        p.prioridade === 'alta' ? '🟡' : '🟢';
      message += `${prioEmoji} ${p.titulo || `Pendência ${idx + 1}`}\n`;
    });

    if (pendencias.length > 5) {
      message += `\n... e mais ${pendencias.length - 5} pendências\n`;
    }

    message += `\nEnviado via ConformeObraApp`;

    return {
      message,
      title: 'Relatório de Pendências',
      type: 'pendências'
    };
  },

  // Enviar via WhatsApp
  sendViaWhatsapp() {
    const phone = document.getElementById('whatsappPhone').value.trim();
    const message = document.getElementById('whatsappMessage').value.trim();

    if (!message) {
      alert('Preencha a mensagem antes de enviar!');
      return;
    }

    // Remover caracteres especiais do telefone
    const cleanPhone = phone.replace(/[^\d]/g, '');

    if (cleanPhone && cleanPhone.length < 10) {
      alert('Número de telefone inválido! Use o formato: 55 11 99999-9999');
      return;
    }

    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message);

    // Criar URL do WhatsApp
    let whatsappURL;
    if (cleanPhone) {
      // Enviar para número específico
      whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    } else {
      // Usar WhatsApp Web (selecionar contato depois)
      whatsappURL = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    }

    // Abrir WhatsApp em nova aba
    window.open(whatsappURL, '_blank');

    // Salvar histórico de compartilhamento
    this.saveShareHistory(this.currentType, this.currentData);

    // Fechar modal após envio
    this.closeShareModal();

    alert('✅ Redirecionando para WhatsApp...\n\nSe não abrir automaticamente, clique no link que será enviado.');
  },

  // Salvar histórico de compartilhamentos
  saveShareHistory(type, data) {
    const history = JSON.parse(localStorage.getItem('whatsappHistory') || '[]');
    
    history.push({
      type,
      title: data.title || 'Compartilhamento',
      message: data.message.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      data: data
    });

    // Manter apenas os últimos 50 compartilhamentos
    if (history.length > 50) {
      history.shift();
    }

    localStorage.setItem('whatsappHistory', JSON.stringify(history));
  }
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => whatsappShare.init());
} else {
  whatsappShare.init();
}
