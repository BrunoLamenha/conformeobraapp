import { loadCollection, saveDocument } from '../firebase-init.js';

const defaultVistorias = [
  {
    titulo: 'Fundação e subsolo',
    obra: 'Torre Central',
    area: 'Fundação',
    responsavel: 'Eng. Silva',
    status: 'ok',
    observacoes: 'Sem anomalias visíveis.',
    pendencias: 'Nenhuma.',
    fotos: []
  },
  {
    titulo: 'Estrutura em concreto',
    obra: 'Torre Central',
    area: 'Pilar 4',
    responsavel: 'Eng. Silva',
    status: 'alerta',
    observacoes: 'Ajuste de fissuras em pilar 4.',
    pendencias: 'Fissuras localizadas.',
    fotos: []
  },
  {
    titulo: 'Instalação elétrica',
    obra: 'Torre Central',
    area: '1º andar',
    responsavel: 'Eng. Silva',
    status: 'pendente',
    observacoes: 'Verificar aterramento final.',
    pendencias: 'Aterramento pendente.',
    fotos: []
  }
];

function getStatusLabel(status) {
  const map = {
    ok: 'OK',
    alerta: 'Alerta',
    pendente: 'Pendente'
  };

  return map[status] || 'Sem status';
}

function getReformaChecklist() {
  try {
    const reformEntries = JSON.parse(localStorage.getItem('conformeobras:reformas') || '[]');
    const last = reformEntries[reformEntries.length - 1];
    if (!last || !Array.isArray(last.checklistGerado)) return [];
    return last.checklistGerado;
  } catch (error) {
    return [];
  }
}

function renderReformaVistoriaForm() {
  const container = document.getElementById('reformaVistoriaList');
  const form = document.getElementById('reformaVistoriaForm');
  if (!container || !form) return;

  const checklist = getReformaChecklist();

  if (!checklist.length) {
    container.innerHTML = '<div class="empty-state">Cadastre uma reforma para gerar o checklist de vistoria.</div>';
    return;
  }

  container.innerHTML = checklist
    .map(
      (item, index) => `
        <div class="inspection-item" data-item-id="${index}">
          <div class="inspection-item-header">
            <div>
              <strong>${item.room}</strong>
              <small>${item.disciplina}</small>
            </div>
            <span class="status-badge pendente">Qtd: ${item.quantidade}</span>
          </div>
          <div><small>${item.item}</small></div>
          <label>
            Status
            <select name="status-${index}" data-item-status>
              <option value="conforme">Conforme</option>
              <option value="pendente" selected>Pendente</option>
              <option value="nao-aplica">Não se aplica</option>
            </select>
          </label>
          <label>
            Observação
            <textarea name="observacao-${index}" rows="2" placeholder="Descreva observação, defeito ou ajuste..."></textarea>
          </label>
        </div>
      `
    )
    .join('');
}

function renderVistorias(items) {
  const list = document.getElementById('vistoriasChecklist');

  if (!list) return;

  const reformaChecklist = getReformaChecklist();
  const normalized = reformaChecklist.length
    ? reformaChecklist.map((item) => ({
        titulo: `${item.room} · ${item.disciplina}`,
        obra: 'Reforma',
        area: item.room,
        pendencias: `${item.item} · Qtd: ${item.quantidade}`,
        status: item.status || 'pendente'
      }))
    : items.length
      ? items
      : defaultVistorias;

  list.innerHTML = normalized
    .map(
      (item) => `
        <li>
          <div>
            <strong>${item.titulo || item.area || 'Item de vistoria'}</strong>
            <small>${item.obra || 'Obra não informada'} · ${item.area || 'Área não informada'}</small>
            <small>${item.pendencias || 'Sem pendências'} </small>
          </div>
          <span class="status-badge ${item.status}">${getStatusLabel(item.status)}</span>
        </li>
      `
    )
    .join('');
}

function readFilesAsDataUrls(files) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

function renderPreviewFromFiles(files) {
  const preview = document.getElementById('photoPreview');
  if (!preview) return;

  if (!files || !files.length) {
    preview.innerHTML = '<span class="empty-state">Nenhuma foto selecionada.</span>';
    return;
  }

  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const item = document.createElement('div');
      item.className = 'photo-item';
      item.innerHTML = `<img src="${event.target.result}" alt="Pré-visualização da vistoria" />`;
      preview.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

export function initVistoriasModule() {
  const card = document.getElementById('vistoriasView');
  const button = document.querySelector('[data-vistoria-quick]');
  const form = document.getElementById('vistoriaForm');
  const photoInput = document.getElementById('inspectionPhotos');

  if (!card) return;
  card.dataset.module = 'vistorias';

  if (photoInput) {
    photoInput.addEventListener('change', (event) => {
      const preview = document.getElementById('photoPreview');
      if (preview) preview.innerHTML = '';
      renderPreviewFromFiles(event.target.files);
    });
  }

  const refresh = () => {
    loadCollection('vistorias')
      .then((items) => renderVistorias(items))
      .catch(() => renderVistorias(defaultVistorias));
  };

  if (button) {
    button.addEventListener('click', () => {
      const formElement = document.getElementById('vistoriaForm');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = formElement?.querySelector('input[name="obra"]');
      if (firstInput) firstInput.focus();
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        titulo: `Vistoria - ${formData.get('obra') || 'obra'}`,
        obra: formData.get('obra') || 'Não informado',
        area: formData.get('area') || 'Não informado',
        responsavel: formData.get('responsavel') || 'Não informado',
        status: formData.get('status') || 'pendente',
        observacoes: formData.get('observacoes') || 'Sem observações',
        pendencias: formData.get('pendencias') || 'Nenhuma.',
        fotos: photoInput && photoInput.files ? await readFilesAsDataUrls(photoInput.files) : []
      };

      saveDocument('vistorias', payload)
        .then(() => {
          form.reset();
          const preview = document.getElementById('photoPreview');
          if (preview) preview.innerHTML = '<span class="empty-state">Nenhuma foto selecionada.</span>';
          refresh();
        })
        .catch(() => {
          const existing = JSON.parse(localStorage.getItem('conformeobras:vistorias') || '[]');
          existing.push(payload);
          localStorage.setItem('conformeobras:vistorias', JSON.stringify(existing));
          form.reset();
          const preview = document.getElementById('photoPreview');
          if (preview) preview.innerHTML = '<span class="empty-state">Nenhuma foto selecionada.</span>';
          refresh();
        });
    });
  }

  const reformaVistoriaForm = document.getElementById('reformaVistoriaForm');
  if (reformaVistoriaForm) {
    renderReformaVistoriaForm();

    reformaVistoriaForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const checklist = getReformaChecklist();
      const items = checklist.map((item, index) => {
        const statusElement = reformaVistoriaForm.querySelectorAll('[data-item-status]')[index];
        const noteElement = reformaVistoriaForm.querySelectorAll('textarea')[index];

        return {
          ...item,
          status: statusElement ? statusElement.value : 'pendente',
          observacao: noteElement ? noteElement.value : ''
        };
      });

      const saved = JSON.parse(localStorage.getItem('conformeobras:vistoriasReforma') || '[]');
      saved.push({
        createdAt: new Date().toISOString(),
        itens: items
      });
      localStorage.setItem('conformeobras:vistoriasReforma', JSON.stringify(saved));
      alert('Vistoria da reforma salva com sucesso!');
    });
  }

  refresh();
}
