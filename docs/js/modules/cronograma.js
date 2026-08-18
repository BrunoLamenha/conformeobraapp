import { loadCollection, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';

let currentOrcamento = null;
let tasks = [];

/**
 * Adiciona um número de dias úteis a uma data, pulando fins de semana.
 * @param {Date} date - A data inicial.
 * @param {number} days - O número de dias úteis a adicionar.
 * @returns {Date} A nova data.
 */
function addWorkingDays(date, days) {
  let newDate = new Date(date);
  let addedDays = 0;
  while (addedDays < days) {
    newDate.setDate(newDate.getDate() + 1);
    const dayOfWeek = newDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
      addedDays++;
    }
  }
  return newDate;
}

/**
 * Renderiza a interface de planejamento do cronograma a partir de um orçamento.
 * @param {object} orcamento - O documento do orçamento.
 */
export function renderCronogramaPlanner(orcamento) {
  currentOrcamento = orcamento;
  const container = document.getElementById('cronogramaItensContainer');
  const title = document.getElementById('cronogramaTitle');

  title.textContent = `Cronograma para: ${orcamento.name}`;

  tasks = orcamento.itens.map((item, index) => ({
    id: `task_${index}`,
    name: item.descricao,
    duration: 1, // Duração padrão de 1 dia
    predecessorId: null,
  }));

  container.innerHTML = tasks.map(task => `
    <div class="cronograma-item inspection-item">
      <p>${task.name}</p>
      <div class="cronograma-item-inputs">
        <label>Duração (dias)
          <input type="number" class="task-duration" data-task-id="${task.id}" value="${task.duration}" min="1" required>
        </label>
        <label>Depende de
          <select class="task-predecessor" data-task-id="${task.id}">
            <option value="">Nenhuma</option>
            ${tasks.filter(t => t.id !== task.id).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </label>
      </div>
    </div>
  `).join('');

  // Adiciona listeners para atualizar os dados das tarefas
  container.querySelectorAll('.task-duration, .task-predecessor').forEach(input => {
    input.addEventListener('change', (e) => {
      const taskId = e.target.dataset.taskId;
      const task = tasks.find(t => t.id === taskId);
      if (e.target.classList.contains('task-duration')) {
        task.duration = parseInt(e.target.value, 10) || 1;
      } else {
        task.predecessorId = e.target.value || null;
      }
    });
  });
}

/**
 * Calcula as datas de início e fim de todas as tarefas.
 * @param {Date} projectStartDate - A data de início do projeto.
 * @returns {Array} A lista de tarefas com as datas calculadas.
 */
function calculateSchedule(projectStartDate) {
  const calculatedTasks = JSON.parse(JSON.stringify(tasks)); // Cópia profunda
  const taskMap = new Map(calculatedTasks.map(t => [t.id, t]));
  const calculated = new Set();

  function calculateTask(taskId) {
    if (calculated.has(taskId)) return;

    const task = taskMap.get(taskId);
    if (!task) return;

    if (task.predecessorId && !calculated.has(task.predecessorId)) {
      calculateTask(task.predecessorId); // Calcula a predecessora primeiro
    }

    const predecessor = task.predecessorId ? taskMap.get(task.predecessorId) : null;
    const startDate = predecessor ? predecessor.endDate : projectStartDate;
    
    task.startDate = startDate;
    task.endDate = addWorkingDays(startDate, task.duration);
    
    calculated.add(taskId);
  }

  calculatedTasks.forEach(task => calculateTask(task.id));
  return Array.from(taskMap.values());
}

async function handleSaveCronograma() {
  const startDateInput = document.getElementById('cronogramaStartDate');
  if (!startDateInput.value) {
    showToast('Por favor, defina a data de início da obra.', 'error');
    return;
  }

  const projectStartDate = new Date(startDateInput.value);
  const scheduledTasks = calculateSchedule(projectStartDate);

  const payload = {
    orcamentoId: currentOrcamento.id,
    empreendimentoId: currentOrcamento.empreendimentoId,
    companyId: currentOrcamento.companyId,
    name: `Cronograma - ${currentOrcamento.name}`,
    startDate: projectStartDate,
    tasks: scheduledTasks,
  };

  try {
    await saveDocument('cronogramas', payload);
    showToast('Cronograma salvo com sucesso!', 'success');
  } catch (error) {
    showToast('Erro ao salvar o cronograma.', 'error');
    console.error(error);
  }
}

export function initCronogramaModule() {
  const saveBtn = document.getElementById('saveCronogramaBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveCronograma);
  }
}

export function initCalendarioModule() {
  // Lógica do calendário será implementada na Fase 2
}