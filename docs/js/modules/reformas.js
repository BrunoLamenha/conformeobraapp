import { loadCollection, saveDocument, updateDocument } from '../firebase-init.js';
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
  }
};

const disciplineLabels = {
  hidraulica: 'Hidráulica',
  eletrica: 'Elétrica',
  revestimento: 'Revestimento',
  pintura: 'Pintura',
  acabamento: 'Acabamento'
};

let allReformas = []; // Cache para as reformas carregadas
let currentReforma = null; // Armazena a reforma selecionada para vistoria

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

  allReformas = items; // Armazena os dados carregados no cache

  const normalized = Array.isArray(items) && items.length ? items : [];
  const concluido = normalized.filter((item) => item.status === 'ok').length;
  const alerta = normalized.filter((item) => item.status === 'alerta').length;
  const pendente = normalized.filter((item) => item.status === 'pendente').length;

  list.innerHTML = normalized
    .map((item) => {
      // Calcula o percentual de conclusão real
      const totalItens = item.checklistGerado?.length || 0;
      const itensConcluidos = (item.checklistGerado || []).filter(
        (checklistItem) => checklistItem.status === 'conforme'
      ).length;
      const percentual = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

      return `
        <li class="clickable" data-reforma-id="${item.id}">
          <div>
            <strong>${item.titulo || 'Etapa de reforma'}</strong>
            <small>${item.prazo || 'Prazo em revisão'}</small>
          </div>
          <div class="list-item-actions">
            <button class="tertiary-btn edit-reforma-btn" data-reforma-id="${item.id}">Editar</button>
          </div>
          <div class="progress-wrap">
            <span>${percentual}%</span>
            <div class="progress-bar"><i style="width:${percentual}%"></i></div>
          </div>
        </li>
      `;
    })
    .join('');

  summary.innerHTML = `
    <li><span>Concluídas</span><strong>${concluido}</strong></li>
    <li><span>Em alerta</span><strong>${alerta}</strong></li>
    <li><span>Pendentes</span><strong>${pendente}</strong></li>
  `;
}

function renderReformaVistoria(reforma) {
  const container = document.getElementById('reformaVistoriaList');
  const title = document.getElementById('reformaVistoriaTitle');
  const form = document.getElementById('reformaVistoriaForm');
  if (!container || !title || !form) return;

  currentReforma = reforma; // Armazena a reforma atual
  title.textContent = reforma.titulo;

  if (!reforma.checklistGerado || reforma.checklistGerado.length === 0) {
    container.innerHTML = '<div class="empty-state">Esta reforma não possui um checklist.</div>';
    form.querySelector('button[type="submit"]').style.display = 'none';
    return;
  }

  form.querySelector('button[type="submit"]').style.display = 'block';
  container.innerHTML = reforma.checklistGerado.map((item, index) => `
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
            <option value="pendente" ${item.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="conforme" ${item.status === 'conforme' ? 'selected' : ''}>Conforme</option>
            <option value="nao-aplica" ${item.status === 'nao-aplica' ? 'selected' : ''}>Não se aplica</option>
          </select>
        </label>
        <label>
          Observação
          <textarea name="observacao-${index}" rows="2" placeholder="Descreva observação...">${item.observacao || ''}</textarea>
        </label>
      </div>
    `).join('');
}

export function initReformasModule() {
  const card = document.getElementById('reformasView');
  const form = document.getElementById('reformaForm');
  const preview = document.getElementById('reformaChecklistPreview');
  const reformasList = document.getElementById('reformasList');
  const vistoriaForm = document.getElementById('reformaVistoriaForm');

  if (!card) return;
  card.dataset.module = 'reformas';

  const refresh = () => {
    loadCollection('reformas')
      .then((items) => renderReformas(items))
      .catch(() => renderReformas([]));
  };

  if (reformasList) {
    reformasList.addEventListener('click', (e) => {
      const editButton = e.target.closest('.edit-reforma-btn');
      if (editButton) {
        e.stopPropagation(); // Impede que o clique para vistoria seja acionado
        const reformaId = editButton.dataset.reformaId;
        const reforma = allReformas.find(r => r.id === reformaId);
        if (reforma) {
          // Preenche o formulário principal para edição
          form.dataset.editId = reforma.id; // Marca o formulário como "modo de edição"
          form.querySelector('#reformaFormEmpreendimentoSelect').value = reforma.empreendimentoId;
          // Dispara o evento 'change' para carregar as unidades
          form.querySelector('#reformaFormEmpreendimentoSelect').dispatchEvent(new Event('change'));
          
          // Aguarda um pouco para o select de unidades ser populado
          setTimeout(() => {
            form.querySelector('#reformaFormUnidadeSelect').value = reforma.unidadeId;
          }, 100);

          form.querySelector('#reformaFormResponsavelSelect').value = reforma.responsavelId;
          form.querySelector('input[name="prazo"]').value = reforma.prazo;
          form.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Lógica existente para carregar a vistoria
        const listItem = e.target.closest('li[data-reforma-id]');
        if (!listItem) return;

        const reformaId = listItem.dataset.reformaId;
        const reforma = allReformas.find(r => r.id === reformaId);

        if (reforma) {
          renderReformaVistoria(reforma);
          vistoriaForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

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
      const editId = form.dataset.editId;
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

        if (editId) {
          // --- MODO DE EDIÇÃO ---
          const payload = {
            empreendimentoId: formData.get('empreendimentoId'),
            unidadeId: formData.get('unidadeId'),
            obra: form.querySelector('#reformaFormEmpreendimentoSelect option:checked')?.textContent || 'Não informado',
            titulo: `Reforma - ${form.querySelector('#reformaFormEmpreendimentoSelect option:checked')?.textContent || 'obra'}`,
            responsavelId: formData.get('responsavelId'),
            responsavel: form.querySelector('#reformaFormResponsavelSelect option:checked')?.textContent || 'Não informado',
            prazo: formData.get('prazo') || 'A definir'
          };
          await updateDocument('reformas', editId, payload);
          showToast('Reforma atualizada com sucesso!', 'success');
          delete form.dataset.editId; // Limpa o modo de edição
        } else {
          // --- MODO DE CRIAÇÃO ---
          const payload = {
            empreendimentoId: formData.get('empreendimentoId'),
            unidadeId: formData.get('unidadeId'),
            obra: form.querySelector('#reformaFormEmpreendimentoSelect option:checked')?.textContent || 'Não informado',
            titulo: `Reforma - ${form.querySelector('#reformaFormEmpreendimentoSelect option:checked')?.textContent || 'obra'}`,
            responsavelId: formData.get('responsavelId'),
            responsavel: form.querySelector('#reformaFormResponsavelSelect option:checked')?.textContent || 'Não informado',
            comodos: Object.entries(selection)
              .filter(([, item]) => item.enabled)
              .map(([roomKey, item]) => ({
                room: roomCatalog[roomKey]?.label || roomKey,
                quantidade: item.quantidade || 1
              })),
            checklistGerado,
            status: 'pendente',
            percentual: 0,
            prazo: formData.get('prazo') || 'A definir'
          };
          await saveDocument('reformas', payload);
          showToast('Reforma salva com sucesso!', 'success');
        }

        form.reset();
        if (preview) renderChecklistPreview({});
        refresh();
      } catch (error) {
        showToast('Erro ao salvar a reforma.', 'error');
        console.error('Erro ao salvar reforma:', error);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Reforma';
      }
    });
  }

  if (vistoriaForm) {
    vistoriaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentReforma) {
        showToast('Nenhuma reforma selecionada para vistoriar.', 'error');
        return;
      }

      const submitButton = vistoriaForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Salvando...';

      try {
        const updatedChecklist = currentReforma.checklistGerado.map((item, index) => {
          const status = vistoriaForm.querySelector(`[name="status-${index}"]`)?.value;
          const observacao = vistoriaForm.querySelector(`[name="observacao-${index}"]`)?.value;
          return { ...item, status, observacao };
        });

        // Recalcula o percentual e o status geral da reforma
        const totalItens = updatedChecklist.length;
        const itensConcluidos = updatedChecklist.filter(i => i.status === 'conforme').length;
        const percentual = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
        const status = percentual === 100 ? 'ok' : (percentual > 0 ? 'alerta' : 'pendente');

        const payload = {
          checklistGerado: updatedChecklist,
          percentual,
          status,
        };

        await updateDocument('reformas', currentReforma.id, payload);
        showToast('Vistoria da reforma salva com sucesso!', 'success');
        refresh(); // Atualiza a lista de reformas para refletir o novo percentual
      } catch (error) {
        showToast('Erro ao salvar a vistoria da reforma.', 'error');
        console.error('Erro ao salvar vistoria da reforma:', error);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar vistoria';
      }
    });
  }

  refresh();
}
