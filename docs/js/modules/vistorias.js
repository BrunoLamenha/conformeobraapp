import { loadCollection, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js'; // Caminho padronizado
import { populateEmpreendimentoSelect } from './empreendimentos.js';
import { populateUserSelect } from './usuarios.js';
import { conferenceChecklists } from '../data/checklist-templates.js';

let allVistorias = []; // Cache para as vistorias carregadas
let currentVistoria = null; // Armazena a vistoria atualmente exibida no modal

function getStatusLabel(status) {
  const map = {
    conforme: 'Conforme',
    'nao-conforme': 'Não Conforme',
    'nao-aplica': 'N/A'
  };

  return map[status] || 'Sem status';
}

function renderReformaVistoriaForm() {
  const container = document.getElementById('reformaVistoriaList');
  // Esta função pode ser removida ou adaptada se não for mais usada.
  if (container) container.innerHTML = '<p>Módulo de vistoria de reforma desativado.</p>';
}

function renderVistorias(items) {
  const list = document.getElementById('vistoriasList');
  if (!list) return;

  if (!items || items.length === 0) {
    list.innerHTML = '<li class="empty-state">Nenhuma vistoria encontrada.</li>';
    return;
  }

  allVistorias = items; // Armazena os dados carregados no cache

  list.innerHTML = items.map(item => {
    const conformidade = item.itens.filter(i => i.status === 'conforme').length;
    const totalItens = item.itens.length;
    const percentual = totalItens > 0 ? Math.round((conformidade / totalItens) * 100) : 0;

    return `
      <li class="clickable" data-vistoria-id="${item.id}">
        <div>
          <strong>${item.templateLabel}</strong>
          <small>${item.empreendimentoName} · ${item.area}</small>
          <small>Responsável: ${item.responsavelName}</small>
        </div>
        <div class="progress-wrap">
          <span>${percentual}% Conforme</span>
          <div class="progress-bar"><i style="width:${percentual}%"></i></div>
        </div>
      </li>
    `;
  }).join('');
}

function renderChecklistForVistoria(templateKey) {
  const container = document.getElementById('vistoriaChecklistContainer');
  if (!container) return;

  const template = conferenceChecklists[templateKey];
  if (!template) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = template.items.map((item, index) => `
    <div class="inspection-item" data-item-id="${index}">
      <p>${item}</p>
      <div class="inspection-item-actions">
        <label>
          Status
          <select name="status-${index}" data-item-status required>
            <option value="conforme">Conforme</option>
            <option value="nao-conforme">Não Conforme</option>
            <option value="nao-aplica">Não se Aplica</option>
          </select>
        </label>
        <label>
          Observação
          <input type="text" name="obs-${index}" placeholder="Opcional: descreva o problema...">
        </label>
      </div>
    </div>
  `).join('');
}

function renderVistoriaDetails(vistoria) {
  const modalBody = document.getElementById('vistoriaDetailBody');
  if (!modalBody) return;

  const headerHTML = `
    <div class="vistoria-detail-header">
      <strong>${vistoria.templateLabel}</strong>
      <small><strong>Empreendimento:</strong> ${vistoria.empreendimentoName}</small>
      <small><strong>Área/Setor:</strong> ${vistoria.area}</small>
      <small><strong>Responsável:</strong> ${vistoria.responsavelName}</small>
    </div>
  `;

  const itemsHTML = vistoria.itens.map(item => `
    <div class="inspection-item">
      <p>${item.item}</p>
      <div class="inspection-item-actions">
        <span class="status-badge ${item.status}">${getStatusLabel(item.status)}</span>
        ${item.observacao ? `<small><strong>Obs:</strong> ${item.observacao}</small>` : ''}
      </div>
    </div>
  `).join('');

  modalBody.innerHTML = headerHTML + `<div class="inspection-list">${itemsHTML}</div>`;
}

export function initVistoriasModule() {
  const card = document.getElementById('vistoriasView');
  const form = document.getElementById('vistoriaForm');
  const templateSelect = document.getElementById('checklistTemplateSelect');
  const detailModal = document.getElementById('vistoriaDetailModal');
  const vistoriasList = document.getElementById('vistoriasList');
  const pdfBtn = document.getElementById('vistoriaDetailPdfBtn');
  const whatsappBtn = document.getElementById('vistoriaDetailWhatsappBtn');

  if (!card) return;
  card.dataset.module = 'vistorias';

  // --- Lógica do Modal de Detalhes ---
  if (detailModal) {
    // Gerar PDF
    pdfBtn.addEventListener('click', async () => {
      if (!currentVistoria) return;

      // Função auxiliar para carregar a imagem do logo como Base64
      const getLogoBase64 = () => new Promise((resolve) => {
        const img = new Image();
        img.src = 'assets/logo/logo.png'; // Caminho para o seu logo
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          console.error("Não foi possível carregar o logo para o PDF.");
          resolve(null); // Retorna nulo se o logo não puder ser carregado
        };
      });

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 15; // Posição vertical inicial

      // Adiciona o logo ao PDF
      const logoData = await getLogoBase64();
      if (logoData) {
        doc.addImage(logoData, 'PNG', 14, y, 25, 25); // (imagem, formato, x, y, largura, altura)
      }

      // Cabeçalho
      doc.setFontSize(18);
      doc.text('Relatório de Vistoria', 105, y + 10, { align: 'center' });
      y += 30; // Aumenta o espaço vertical para acomodar o logo

      doc.setFontSize(12);
      doc.text(`Empreendimento: ${currentVistoria.empreendimentoName}`, 14, y);
      y += 7;
      doc.text(`Área/Setor: ${currentVistoria.area}`, 14, y);
      y += 7;
      doc.text(`Responsável: ${currentVistoria.responsavelName}`, 14, y);
      y += 12;

      // Itens do Checklist
      doc.setFontSize(14);
      doc.text('Itens Verificados', 14, y);
      y += 10;

      doc.setFontSize(10);
      currentVistoria.itens.forEach(item => {
        if (y > 280) { // Nova página se o conteúdo estiver no final
          doc.addPage();
          y = 20;
        }
        doc.text(`- ${item.item}`, 14, y);
        y += 5;
        doc.text(`  Status: ${getStatusLabel(item.status)}`, 18, y);
        y += 5;
        if (item.observacao) {
          doc.text(`  Obs: ${item.observacao}`, 18, y);
          y += 5;
        }
        y += 3; // Espaço entre itens
      });

      doc.save(`Vistoria_${currentVistoria.empreendimentoName.replace(/\s/g, '_')}.pdf`);
    });

    // Compartilhar no WhatsApp
    whatsappBtn.addEventListener('click', () => {
      if (!currentVistoria) return;

      const conformidade = currentVistoria.itens.filter(i => i.status === 'conforme').length;
      const totalItens = currentVistoria.itens.length;
      const percentual = totalItens > 0 ? Math.round((conformidade / totalItens) * 100) : 0;

      let message = `*📋 RELATÓRIO DE VISTORIA*\n\n`;
      message += `*Serviço:* ${currentVistoria.templateLabel}\n`;
      message += `*Empreendimento:* ${currentVistoria.empreendimentoName}\n`;
      message += `*Área:* ${currentVistoria.area}\n`;
      message += `*Responsável:* ${currentVistoria.responsavelName}\n`;
      message += `*Conformidade:* ${percentual}%\n\n`;
      message += `*Itens Verificados:*\n`;

      currentVistoria.itens.forEach(item => {
        const statusIcon = {
          conforme: '✅',
          'nao-conforme': '❌',
          'nao-aplica': '➖'
        }[item.status];

        message += `${statusIcon} ${item.item}\n`;
        if (item.observacao) {
          message += `  *Obs:* ${item.observacao}\n`;
        }
      });

      // Chama a função global de compartilhamento
      window.shareOnWhatsApp(message);
    });

    detailModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        detailModal.classList.add('hidden');
      }
    });
  }

  if (templateSelect) {
    templateSelect.addEventListener('change', (e) => {
      renderChecklistForVistoria(e.target.value);
    });
  }

  const refresh = () => {
    loadCollection('vistorias').then(renderVistorias).catch(() => renderVistorias([]));
  }

  if (vistoriasList) {
    vistoriasList.addEventListener('click', (e) => {
      const listItem = e.target.closest('li[data-vistoria-id]');
      if (!listItem) return;

      const vistoriaId = listItem.dataset.vistoriaId;
      const vistoria = allVistorias.find(v => v.id === vistoriaId);

      if (vistoria && detailModal) {
        currentVistoria = vistoria; // Armazena a vistoria selecionada
        renderVistoriaDetails(vistoria);
        detailModal.classList.remove('hidden');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Salvando...';

      try {
        const formData = new FormData(form);
        const templateKey = formData.get('template');
        const template = conferenceChecklists[templateKey];

        const itensVistoriados = template.items.map((item, index) => ({
          item: item,
          status: formData.get(`status-${index}`),
          observacao: formData.get(`obs-${index}`) || '',
        }));

        const payload = {
          templateKey: templateKey,
          templateLabel: template.label,
          empreendimentoId: formData.get('empreendimentoId'),
          empreendimentoName: form.querySelector('#vistoriaEmpreendimentoSelect option:checked')?.textContent,
          area: formData.get('area'),
          responsavelId: formData.get('responsavelId'),
          responsavelName: form.querySelector('#vistoriaResponsavelSelect option:checked')?.textContent,
          itens: itensVistoriados,
        };

        await saveDocument('vistorias', payload);
        showToast('Vistoria salva com sucesso!', 'success');
        form.reset();
        document.getElementById('vistoriaChecklistContainer').innerHTML = '';
        refresh();
      } catch (error) {
        console.error('Erro ao salvar vistoria:', error);
        showToast('Erro ao salvar vistoria.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar vistoria';
      }
    });
  }

  // Popula os selects com dados de outros módulos
  loadCollection('empreendimentos').then(data => populateEmpreendimentoSelect(data, 'vistoriaEmpreendimentoSelect'));
  loadCollection('users').then(data => populateUserSelect(data, 'vistoriaResponsavelSelect'));

  // Carrega a lista inicial de vistorias
  refresh();
}
