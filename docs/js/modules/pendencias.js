import { loadCollection, saveDocument, updateDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';

const defaultPendencias = [
  {
    descricao: 'Ajuste de fissura na laje do 3º andar',
    obra: 'Torre Central',
    responsavel: 'Eng. Silva',
    prioridade: 'alta',
    prazo: '03/09/2026',
    status: 'aberta'
  },
  {
    descricao: 'Completar instalação elétrica do bloco B',
    obra: 'Residencial Sol',
    responsavel: 'Elétrica JF',
    prioridade: 'media',
    prazo: '05/09/2026',
    status: 'em-andamento'
  },
  {
    descricao: 'Revisar acabamento de parede na suíte',
    obra: 'Parque Vista',
    responsavel: 'Coord. Obra',
    prioridade: 'baixa',
    prazo: '07/09/2026',
    status: 'concluida'
  }
];

function getPriorityClass(priority) {
  const map = {
    alta: 'priority-high',
    media: 'priority-medium',
    baixa: 'priority-low'
  };

  return map[priority] || 'priority-medium';
}

function getStatusLabel(status) {
  const map = {
    aberta: 'Aberta',
    'em-andamento': 'Em andamento',
    concluida: 'Concluída'
  };

  return map[status] || 'Sem status';
}

function getPriorityLabel(priority) {
  const map = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa'
  };

  return map[priority] || 'Média';
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

function renderPendencias(items, filters = { obra: 'all', prioridade: 'all' }) {
  const list = document.getElementById('pendenciasList');
  const summary = document.getElementById('pendenciasSummary');
  const filterObra = document.getElementById('pendenciaFilterObra');
  const filterPrioridade = document.getElementById('pendenciaFilterPrioridade');

  if (!list || !summary) return;

  const normalized = items.length ? items : defaultPendencias;
  const filtered = normalized.filter((item) => {
    const obraMatch = filters.obra === 'all' || item.obra === filters.obra;
    const priorityMatch = filters.prioridade === 'all' || item.prioridade === filters.prioridade;
    return obraMatch && priorityMatch;
  });

  if (filterObra) {
    const obras = [...new Set(normalized.map((item) => item.obra).filter(Boolean))];
    filterObra.innerHTML = '<option value="all">Todas</option>';
    obras.forEach((obra) => {
      const option = document.createElement('option');
      option.value = obra;
      option.textContent = obra;
      if (filters.obra === obra) option.selected = true;
      filterObra.appendChild(option);
    });
  }

  const abertas = filtered.filter((item) => item.status === 'aberta').length;
  const emAndamento = filtered.filter((item) => item.status === 'em-andamento').length;
  const concluidas = filtered.filter((item) => item.status === 'concluida').length;

  list.innerHTML = filtered
    .map(
      (item) => `
        <li class="pendencia-item">
          <div class="pendencia-text">
            <strong>${item.descricao || 'Pendência sem descrição'}</strong>
            <small>${item.obra || 'Obra não informada'} · ${item.responsavel || 'Responsável não informado'}</small>
            <small>Prazo: ${item.prazo || 'Não definido'}</small>
            <div class="pendencia-gallery">
              ${(item.fotos || []).slice(0, 3).map((foto) => `<img src="${foto}" alt="Foto da pendência" />`).join('') || '<span>Sem fotos</span>'}
            </div>
          </div>
          <div class="pendencia-tags">
            <span class="priority-badge ${getPriorityClass(item.prioridade || 'media')}">${getPriorityLabel(item.prioridade || 'media')}</span>
            <span class="status-badge ${item.status || 'aberta'}">${getStatusLabel(item.status || 'aberta')}</span>
            <button type="button" class="secondary-btn complete-pendencia" data-pendencia-id="${item.id || item.descricao}">Concluído</button>
          </div>
        </li>
      `
    )
    .join('');

  summary.innerHTML = `
    <li><span>Abertas</span><strong>${abertas}</strong></li>
    <li><span>Em andamento</span><strong>${emAndamento}</strong></li>
    <li><span>Concluídas</span><strong>${concluidas}</strong></li>
  `;

  if (filterPrioridade) {
    filterPrioridade.value = filters.prioridade || 'all';
  }
}

export function initPendenciasModule() {
  const card = document.getElementById('pendenciasView');
  const button = document.querySelector('[data-pendencia-quick]');
  const form = document.getElementById('pendenciaForm');
  const filterObra = document.getElementById('pendenciaFilterObra');
  const filterPrioridade = document.getElementById('pendenciaFilterPrioridade');

  if (!card) return;
  card.dataset.module = 'pendencias';

  const refresh = () => {
    loadCollection('pendencias')
      .then((items) => renderPendencias(items, {
        obra: filterObra ? filterObra.value : 'all',
        prioridade: filterPrioridade ? filterPrioridade.value : 'all'
      }))
      .catch(() => renderPendencias(defaultPendencias, {
        obra: filterObra ? filterObra.value : 'all',
        prioridade: filterPrioridade ? filterPrioridade.value : 'all'
      }));
  };

  if (button) {
    button.addEventListener('click', () => {
      const formElement = document.getElementById('pendenciaForm');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = formElement?.querySelector('input[name="descricao"]');
      if (firstInput) firstInput.focus();
    });
  }

  if (filterObra) {
    filterObra.addEventListener('change', refresh);
  }

  if (filterPrioridade) {
    filterPrioridade.addEventListener('change', refresh);
  }

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('.complete-pendencia');
    if (!target) return;

    target.disabled = true;
    target.textContent = 'Salvando...';

    try {
      const pendenciaId = target.dataset.pendenciaId;
      if (!pendenciaId) return;

      await updateDocument('pendencias', pendenciaId, { status: 'concluida' });
      showToast('Pendência marcada como concluída!', 'success');
      refresh(); // Recarrega a lista para refletir a mudança.
    } catch (error) {
      console.error('Erro ao concluir pendência:', error);
      showToast('Erro ao concluir pendência.', 'error');
    } finally {
      target.disabled = false;
      target.textContent = 'Concluído';
    }
  });

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const fileInput = formData.getAll('fotos');
      const fotos = fileInput && fileInput.length ? await readFilesAsDataUrls(Array.from(fileInput)) : [];

      const payload = {
        id: `pend-${Date.now()}`,
        descricao: formData.get('descricao') || 'Pendência sem descrição',
        obra: formData.get('obra') || 'Não informado',
        responsavel: formData.get('responsavel') || 'Não informado',
        prioridade: formData.get('prioridade') || 'media',
        prazo: formData.get('prazo') || 'Não definido',
        status: formData.get('status') || 'aberta',
        fotos
      };

      try {
        await saveDocument('pendencias', payload);
        showToast('Pendência salva com sucesso!', 'success');
        form.reset();
        refresh();
      } catch (error) {
        showToast('Erro ao salvar pendência.', 'error');
        console.error('Erro ao salvar pendência:', error);
      }
    });
  }

  refresh();
}
