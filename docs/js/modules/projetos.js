import { loadCollection, saveDocument } from '../firebase-init.js';

const defaultProjetos = [
  {
    id: 'proj-001',
    nome: 'Projeto Torre Central',
    arquivo: null,
    obra: 'Torre Central',
    dataUpload: '2026-08-10',
    responsavel: 'Arq. Carlos',
    quantitativos: [
      { item: 'Concreto', quantidade: 450, unidade: 'm³' },
      { item: 'Aço', quantidade: 85, unidade: 't' },
      { item: 'Tijolos', quantidade: 120000, unidade: 'un' },
      { item: 'Cimento', quantidade: 200, unidade: 't' }
    ],
    status: 'ativo'
  }
];

function extractQuantitativesFromPDF(pdfDataUrl) {
  // Simulação de análise de PDF
  // Em produção, você integraria com PDFjs ou uma API externa (ex: CloudConvert, Aspose)
  return new Promise((resolve) => {
    // Padrões simples para detectar quantitativos no PDF
    const quantitativos = [
      { item: 'Concreto', quantidade: Math.floor(Math.random() * 500) + 300, unidade: 'm³' },
      { item: 'Aço', quantidade: Math.floor(Math.random() * 150) + 50, unidade: 't' },
      { item: 'Tijolos', quantidade: Math.floor(Math.random() * 200000) + 80000, unidade: 'un' },
      { item: 'Cimento', quantidade: Math.floor(Math.random() * 300) + 100, unidade: 't' },
      { item: 'Areia', quantidade: Math.floor(Math.random() * 200) + 50, unidade: 'm³' }
    ];
    setTimeout(() => resolve(quantitativos), 1000);
  });
}

function renderProjetos(items) {
  const list = document.getElementById('projetosList');
  const summary = document.getElementById('projetosSummary');

  if (!list || !summary) return;

  const normalized = items.length ? items : defaultProjetos;
  const ativos = normalized.filter((item) => item.status === 'ativo').length;
  const inativos = normalized.filter((item) => item.status === 'inativo').length;

  list.innerHTML = normalized
    .map(
      (item) => `
        <li class="projeto-card">
          <div class="projeto-header">
            <div>
              <strong>${item.nome || 'Projeto sem nome'}</strong>
              <small>${item.obra || 'Obra não informada'}</small>
            </div>
            <span class="status-badge ${item.status === 'ativo' ? 'ok' : 'alerta'}">${item.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
          </div>
          <small>Responsável: ${item.responsavel || 'N/A'} · Enviado: ${item.dataUpload || 'N/A'}</small>
          <div class="projeto-quantitativos">
            <strong>Quantitativos:</strong>
            <ul>
              ${(item.quantitativos || [])
                .slice(0, 4)
                .map((q) => `<li><small>${q.item}: ${q.quantidade} ${q.unidade}</small></li>`)
                .join('')}
            </ul>
          </div>
          <div class="projeto-actions">
            ${item.arquivo ? `
              <button type="button" class="tertiary-btn view-project" data-projeto-id="${item.id}">Visualizar PDF</button>
              <button type="button" class="tertiary-btn download-project" data-projeto-id="${item.id}">Download</button>
            ` : '<small>Sem arquivo anexado</small>'}
            <button type="button" class="tertiary-btn expand-quantitativos" data-projeto-id="${item.id}">Ver todos</button>
          </div>
        </li>
      `
    )
    .join('');

  summary.innerHTML = `
    <li><span>Projetos ativos</span><strong>${ativos}</strong></li>
    <li><span>Projetos inativos</span><strong>${inativos}</strong></li>
  `;
}

function renderProjetoDetalhes(projeto) {
  const modal = document.getElementById('projetoModal');
  const modalContent = modal?.querySelector('.modal-content');

  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-header">
      <h3>${projeto.nome}</h3>
      <button type="button" class="close-modal">×</button>
    </div>
    <div class="modal-body">
      <div class="projeto-info">
        <p><strong>Obra:</strong> ${projeto.obra}</p>
        <p><strong>Responsável:</strong> ${projeto.responsavel}</p>
        <p><strong>Data de upload:</strong> ${projeto.dataUpload}</p>
        <p><strong>Status:</strong> <span class="status-badge ${projeto.status === 'ativo' ? 'ok' : 'alerta'}">${projeto.status}</span></p>
      </div>
      <div class="quantitativos-tabela">
        <h4>Quantitativos Completos</h4>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Unidade</th>
            </tr>
          </thead>
          <tbody>
            ${(projeto.quantitativos || [])
              .map((q) => `<tr><td>${q.item}</td><td>${q.quantidade}</td><td>${q.unidade}</td></tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
      ${projeto.arquivo ? `
        <div class="projeto-embed">
          <h4>Visualização do PDF</h4>
          <div class="pdf-viewer">
            <iframe src="${projeto.arquivo}" type="application/pdf" width="100%" height="600"></iframe>
          </div>
        </div>
      ` : '<p class="empty-state">Nenhum PDF anexado a este projeto.</p>'}
    </div>
    <div class="modal-footer">
      ${projeto.arquivo ? `<a href="${projeto.arquivo}" download="${projeto.nome}.pdf" class="primary-btn">Download PDF</a>` : ''}
      <button type="button" class="secondary-btn close-modal">Fechar</button>
    </div>
  `;

  modal.style.display = 'flex';
}

export function initProjetosModule() {
  const card = document.getElementById('projetosView');
  const button = document.querySelector('[data-projeto-quick]');
  const form = document.getElementById('projetoForm');
  const fileInput = document.getElementById('projetoFile');
  const analysisDiv = document.getElementById('projetoAnalise');
  const modal = document.getElementById('projetoModal');

  if (!card) return;
  card.dataset.module = 'projetos';

  const refresh = () => {
    loadCollection('projetos')
      .then((items) => renderProjetos(items))
      .catch(() => renderProjetos(defaultProjetos));
  };

  if (button) {
    button.addEventListener('click', () => {
      const formElement = document.getElementById('projetoForm');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = formElement?.querySelector('input[name="nome"]');
      if (firstInput) firstInput.focus();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.includes('pdf')) {
        alert('Por favor, selecione um arquivo PDF válido.');
        return;
      }

      if (analysisDiv) {
        analysisDiv.innerHTML = '<p class="loading">Analisando PDF...</p>';
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const pdfDataUrl = e.target.result;

          // Simula análise do PDF
          const quantitativos = await extractQuantitativesFromPDF(pdfDataUrl);

          if (analysisDiv) {
            analysisDiv.innerHTML = `
              <div class="analise-resultado">
                <h4>Quantitativos Detectados</h4>
                <ul>
                  ${quantitativos.map((q) => `<li><strong>${q.item}:</strong> ${q.quantidade} ${q.unidade}</li>`).join('')}
                </ul>
                <small>Estes valores foram gerados automaticamente. Revise e edite conforme necessário.</small>
              </div>
            `;
          }

          // Armazena os quantitativos no formulário
          form.dataset.quantitativos = JSON.stringify(quantitativos);
          form.dataset.pdfDataUrl = pdfDataUrl;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        if (analysisDiv) {
          analysisDiv.innerHTML = `<p class="error">Erro ao processar o PDF. Tente novamente.</p>`;
        }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const quantitativos = form.dataset.quantitativos
        ? JSON.parse(form.dataset.quantitativos)
        : [];

      const payload = {
        id: `proj-${Date.now()}`,
        nome: formData.get('nome') || 'Projeto sem nome',
        obra: formData.get('obra') || 'Não informado',
        responsavel: formData.get('responsavel') || 'Não informado',
        dataUpload: new Date().toISOString().split('T')[0],
        arquivo: form.dataset.pdfDataUrl || null,
        quantitativos,
        status: formData.get('status') || 'ativo'
      };

      saveDocument('projetos', payload)
        .then(() => {
          form.reset();
          if (analysisDiv) analysisDiv.innerHTML = '';
          delete form.dataset.quantitativos;
          delete form.dataset.pdfDataUrl;
          refresh();
        })
        .catch(() => {
          const existing = JSON.parse(localStorage.getItem('conformeobras:projetos') || '[]');
          existing.push(payload);
          localStorage.setItem('conformeobras:projetos', JSON.stringify(existing));
          form.reset();
          if (analysisDiv) analysisDiv.innerHTML = '';
          delete form.dataset.quantitativos;
          delete form.dataset.pdfDataUrl;
          refresh();
        });
    });
  }

  // Handlers para visualizar e fazer download
  document.addEventListener('click', async (event) => {
    const viewBtn = event.target.closest('.view-project');
    const downloadBtn = event.target.closest('.download-project');
    const expandBtn = event.target.closest('.expand-quantitativos');
    const closeBtn = event.target.closest('.close-modal');

    if (viewBtn || expandBtn) {
      const projetoId = (viewBtn || expandBtn).dataset.projetoId;
      await handleProjetoAction(projetoId, (projeto) => {
        renderProjetoDetalhes(projeto);
      });
    }

    if (downloadBtn) {
      const projetoId = downloadBtn.dataset.projetoId;
      await handleProjetoAction(projetoId, (projeto) => {
        if (projeto.arquivo) {
          const link = document.createElement('a');
          link.href = projeto.arquivo;
          link.download = `${projeto.nome}.pdf`;
          document.body.appendChild(link); // Necessário para Firefox
          link.click();
          document.body.removeChild(link);
        }
      });
    }

    if (closeBtn) {
      if (modal) modal.style.display = 'none';
    }
  });

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  refresh();
}
