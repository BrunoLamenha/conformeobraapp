import { loadCollection, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';

const roomCatalog = {
  suite: {
    label: 'Suíte',
    disciplinas: {
      hidraulica: ['Pia', 'Box', 'Ducha', 'Vaso sanitário', 'Registro e ramal'],
      eletrica: ['Tomadas', 'Iluminação', 'Interruptores', 'Luminárias'],
      revestimento: ['Piso', 'Parede', 'Rodapé', 'Gesso'],
      pintura: ['Pintura interna', 'Acabamento de juntas', 'Selador'],
      acabamento: ['Armários', 'Espelhos', 'Portas', 'Móveis embutidos']
    }
  },
  banheiro: {
    label: 'Banheiro',
    disciplinas: {
      hidraulica: ['Pia', 'Louça', 'Ducha', 'Válvulas', 'Registro'],
      eletrica: ['Tomadas', 'Luminária', 'Interruptores', 'Ventilação'],
      revestimento: ['Piso', 'Parede', 'Revestimento', 'Rodapé'],
      pintura: ['Pintura', 'Selador', 'Embasamento'],
      acabamento: ['Porta', 'Box', 'Espelho', 'Decorativo']
    }
  },
  cozinha: {
    label: 'Cozinha',
    disciplinas: {
      hidraulica: ['Pia', 'Módulo de pia', 'Torneiras', 'Drenagem'],
      eletrica: ['Tomadas', 'Cooktop', 'Micro-ondas', 'Luminárias'],
      revestimento: ['Piso', 'Parede', 'Rodapé', 'Backsplash'],
      pintura: ['Pintura', 'Acabamento', 'Selador'],
      acabamento: ['Armários', 'Gabinete', 'Prateleiras']
    }
  },
  quarto: {
    label: 'Quarto',
    disciplinas: {
      eletrica: ['Tomadas', 'Luminárias', 'Interruptores'],
      revestimento: ['Piso', 'Parede', 'Rodapé'],
      pintura: ['Pintura', 'Acabamento', 'Selador'],
      acabamento: ['Armários', 'Portas', 'Móveis']
    }
  },
  sala: {
    label: 'Sala',
    disciplinas: {
      eletrica: ['Tomadas', 'Iluminação', 'Luminárias'],
      revestimento: ['Piso', 'Parede', 'Rodapé'],
      pintura: ['Pintura', 'Acabamento', 'Selador'],
      acabamento: ['Portas', 'Rodapés', 'Móveis']
    }
  },
  areaExterna: {
    label: 'Área externa',
    disciplinas: {
      hidraulica: ['Água', 'Esgoto', 'Valas', 'Registros'],
      eletrica: ['Luminárias', 'Tomadas externas', 'Iluminação'],
      revestimento: ['Piso', 'Parede', 'Emboço'],
      pintura: ['Pintura externa', 'Proteção', 'Selador'],
      acabamento: ['Portões', 'Grades', 'Mobiliário']
    }
  },
  const roomCatalog = {
  novoComodo: {
    label: 'Novo Cômodo',
    disciplinas: { ... }
  }
};

const disciplineLabels = {
  hidraulica: 'Hidráulica',
  eletrica: 'Elétrica',
  revestimento: 'Revestimento',
  pintura: 'Pintura',
  acabamento: 'Acabamento'
};

function buildChecklistFromSelection(selection) {
  return Object.entries(selection)
    .filter(([, value]) => value?.enabled)
    .flatMap(([roomKey, value]) => {
      const room = roomCatalog[roomKey];
      if (!room) return [];

      const quantity = Number(value.quantidade || 1);

      return Object.entries(room.disciplinas).flatMap(([disciplineKey, serviceList]) =>
        serviceList.map((service) => ({
          room: room.label,
          disciplina: disciplineLabels[disciplineKey] || disciplineKey,
          item: service,
          quantidade: quantity,
          status: 'pendente'
        }))
      );
    });
}

function renderChecklistPreview(selection) {
  const preview = document.getElementById('reformaChecklistPreview');
  if (!preview) return;

  const checklist = buildChecklistFromSelection(selection);

  if (!checklist.length) {
    preview.innerHTML = '<li class="empty-state">Selecione ao menos um cômodo para gerar o checklist.</li>';
    return;
  }

  preview.innerHTML = checklist
    .map(
      (item) => `
        <li>
          <div>
            <strong>${item.room}</strong>
            <small>${item.disciplina}</small>
            <small>${item.item}</small>
          </div>
          <span class="status-badge pendente">Qtd: ${item.quantidade}</span>
        </li>
      `
    )
    .join('');
}

function renderReformas(items) {
  const list = document.getElementById('reformasList');
  const summary = document.getElementById('reformasSummary');

  if (!list || !summary) return;

  const normalized = Array.isArray(items) && items.length ? items : [
    { titulo: 'Reforma de suíte', status: 'alerta', percentual: 72, prazo: '3 dias restantes' },
    { titulo: 'Reforma de banheiro', status: 'pendente', percentual: 42, prazo: 'Em execução' },
    { titulo: 'Acabamento de cozinha', status: 'ok', percentual: 100, prazo: 'Concluído' }
  ];

  const concluido = normalized.filter((item) => item.status === 'ok').length;
  const alerta = normalized.filter((item) => item.status === 'alerta').length;
  const pendente = normalized.filter((item) => item.status === 'pendente').length;

  list.innerHTML = normalized
    .map(
      (item) => `
        <li>
          <div>
            <strong>${item.titulo || 'Etapa de reforma'}</strong>
            <small>${item.prazo || 'Prazo em revisão'}</small>
          </div>
          <div class="progress-wrap">
            <span>${item.percentual || 0}%</span>
            <div class="progress-bar"><i style="width:${item.percentual || 0}%"></i></div>
          </div>
        </li>
      `
    )
    .join('');

  summary.innerHTML = `
    <li><span>Concluídas</span><strong>${concluido}</strong></li>
    <li><span>Em alerta</span><strong>${alerta}</strong></li>
    <li><span>Pendentes</span><strong>${pendente}</strong></li>
  `;
}

export function initReformasModule() {
  const card = document.getElementById('reformasView');
  const form = document.getElementById('reformaForm');
  const preview = document.getElementById('reformaChecklistPreview');

  if (!card) return;
  card.dataset.module = 'reformas';

  const refresh = () => {
    loadCollection('reformas')
      .then((items) => renderReformas(items))
      .catch(() => renderReformas([]));
  };

  if (form) {
    const roomInputs = form.querySelectorAll('[data-room]');

    roomInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const selection = {};

        roomInputs.forEach((item) => {
          const roomKey = item.dataset.room;
          const quantityInput = form.querySelector(`[data-room-qty="${roomKey}"]`);
          selection[roomKey] = {
            enabled: item.checked,
            quantidade: quantityInput ? Number(quantityInput.value || 1) : 1
          };
        });

        renderChecklistPreview(selection);
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Salvando...';

      try {
        const formData = new FormData(form);
        const selection = {};

        roomInputs.forEach((input) => {
          const roomKey = input.dataset.room;
          const quantityInput = form.querySelector(`[data-room-qty="${roomKey}"]`);
          selection[roomKey] = {
            enabled: input.checked,
            quantidade: quantityInput ? Number(quantityInput.value || 1) : 1
          };
        });

        const checklistGerado = buildChecklistFromSelection(selection);
        const payload = {
          titulo: `Reforma - ${formData.get('obra') || 'obra'}`,
          obra: formData.get('obra') || 'Não informado',
          responsavel: formData.get('responsavel') || 'Não informado',
          comodos: Object.entries(selection)
            .filter(([, item]) => item.enabled)
            .map(([roomKey, item]) => ({
              room: roomCatalog[roomKey]?.label || roomKey,
              quantidade: item.quantidade || 1
            })),
          checklistGerado, // O checklist gerado é incluído no payload para ser salvo no Firestore/localStorage
          status: 'pendente',
          percentual: 20,
          prazo: formData.get('prazo') || 'A definir'
        };

        await saveDocument('reformas', payload);
        showToast('Reforma salva com sucesso!', 'success');
        form.reset();
        if (preview) renderChecklistPreview({});
        refresh();
      } catch (error) {
        showToast('Erro ao salvar a reforma.', 'error');
        console.error('Erro ao salvar reforma:', error);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar reforma';
      }
    });
  }

  refresh();
}
