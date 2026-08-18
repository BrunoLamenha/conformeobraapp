import { loadCollection, saveDocument, updateDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js'; // Caminho corrigido para a nova estrutura
import { isHoliday } from '../data/holidays.js'; // Caminho corrigido para a nova estrutura
import { populateEmpreendimentoSelect } from './empreendimentos.js'; // Importa a função para popular empreendimentos
 
let currentOrcamento = null;
let allCronogramas = []; // Cache for all saved cronogramas
let currentCalendarDate = new Date(); // Tracks the month/year being displayed
let currentCalendarView = 'month'; // 'month', 'week', 'day'
let selectedCronogramaId = null;
let currentTask = null; // Armazena a tarefa selecionada no modal
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
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(newDate)) { // 0 = Domingo, 6 = Sábado
      addedDays++;
    }
  }
  return newDate;
}

// Helper to format dates for display
function formatDateToLocale(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper to get days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get the first day of the month (0 for Sunday, 1 for Monday...)
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// Helper to check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
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
    percentCompleted: 0, // Novo campo
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
        <label>Concluído (%)
          <input type="number" class="task-percent-completed" data-task-id="${task.id}" value="${task.percentCompleted}" min="0" max="100">
        </label>
      </div>
    </div>
  `).join('');

  // Adiciona listeners para atualizar os dados das tarefas
  container.querySelectorAll('.task-duration, .task-predecessor, .task-percent-completed').forEach(input => {
    input.addEventListener('change', (e) => {
      const taskId = e.target.dataset.taskId;
      const task = tasks.find(t => t.id === taskId);
      if (e.target.classList.contains('task-duration')) {
        task.duration = parseInt(e.target.value, 10) || 1;
      } else {
        task.predecessorId = e.target.value || null;
      }
      if (e.target.classList.contains('task-percent-completed')) {
        task.percentCompleted = parseInt(e.target.value, 10) || 0;
        if (task.percentCompleted < 0) task.percentCompleted = 0; // Garante que não seja negativo
        if (task.percentCompleted > 100) task.percentCompleted = 100; // Garante que não exceda 100
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
    const savedCronograma = await saveDocument('cronogramas', payload);
    showToast('Cronograma salvo com sucesso!', 'success');

    // Atualiza o ID selecionado para o cronograma recém-criado
    selectedCronogramaId = savedCronograma.id;
    // Recarrega o seletor de cronogramas e o calendário
    await populateCronogramaSelect();
    // Navega para a view do calendário
    document.querySelector('[data-view="calendario"]').click();
  } catch (error) {
    showToast('Erro ao salvar o cronograma.', 'error');
    console.error(error);
  }
}

/**
 * Renders the calendar grid for a given month.
 * @param {number} year - The year to render.
 * @param {number} month - The month to render (0-11).
 * @param {Array} cronogramaTasks - The tasks to display on the calendar.
 */
function renderCalendarGrid(year, month, cronogramaTasks = []) {
  const calendarContainer = document.getElementById('calendarContainer');
  if (!calendarContainer) return;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month); // 0 = Sunday, 1 = Monday

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date

  let calendarHTML = `
    <div class="calendar-grid">
      <div class="calendar-header">Dom</div>
      <div class="calendar-header">Seg</div>
      <div class="calendar-header">Ter</div>
      <div class="calendar-header">Qua</div>
      <div class="calendar-header">Qui</div>
      <div class="calendar-header">Sex</div>
      <div class="calendar-header">Sáb</div>
  `;

  // Fill leading empty days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarHTML += `<div class="calendar-day other-month"></div>`;
  }

  // Render days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDay = new Date(year, month, day);
    currentDay.setHours(0, 0, 0, 0); // Normalize current day
    const isToday = isSameDay(currentDay, today);
    const isHolidayDay = isHoliday(currentDay);
    const dayClass = isToday ? 'today' : (isHolidayDay ? 'holiday' : '');

    calendarHTML += `
      <div class="calendar-day ${dayClass}">
        <span class="day-number">${day}</span> ${isHolidayDay ? '<span class="holiday-label">Feriado</span>' : ''}
        <div class="day-tasks">
    `;

    // Add tasks for this day
    cronogramaTasks.forEach(task => {
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.endDate);
      taskStartDate.setHours(0, 0, 0, 0);
      taskEndDate.setHours(0, 0, 0, 0);

      if (currentDay >= taskStartDate && currentDay <= taskEndDate) {
        const progressClass = getTaskProgressClass(task.percentCompleted); // Define a classe de progresso
        calendarHTML += `<div class="calendar-task ${progressClass}" title="${task.name} (${formatDateToLocale(taskStartDate)} - ${formatDateToLocale(taskEndDate)})" data-task-id="${task.id}">
          <span>${task.name}</span>
          ${task.percentCompleted > 0 ? `<span class="task-percent">${task.percentCompleted}%</span>` : ''}
        </div>`;
      }
    });

    calendarHTML += `
        </div>
      </div>
    `;
  }

  calendarHTML += `</div>`;
  calendarContainer.innerHTML = calendarHTML;

  // Update current period display
  document.getElementById('currentPeriodDisplay').textContent = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function renderTaskDetailsModal(taskId) {
  const selectedCronograma = allCronogramas.find(c => c.id === selectedCronogramaId);
  if (!selectedCronograma) return;

  const task = selectedCronograma.tasks.find(t => t.id === taskId);
  if (!task) return;

  currentTask = task; // Armazena a tarefa atual
  const modal = document.getElementById('cronogramaTaskDetailModal');
  const modalBody = document.getElementById('cronogramaTaskDetailBody');
  if (!modal || !modalBody) return;

  const predecessorName = task.predecessorId 
    ? selectedCronograma.tasks.find(p => p.id === task.predecessorId)?.name || 'N/A'
    : 'Nenhuma';

  modalBody.innerHTML = `
    <div class="task-detail-list">
      <div class="task-detail-item">
        <strong>Tarefa:</strong>
        <span>${task.name}</span>
      </div>
      <div class="task-detail-item">
        <strong>Duração:</strong>
        <span>${task.duration} dia(s) útil(eis)</span>
      </div>
      <div class="task-detail-item">
        <strong>Período:</strong>
        <span>${formatDateToLocale(new Date(task.startDate))} a ${formatDateToLocale(new Date(task.endDate))}</span>
      </div>
      <div class="task-detail-item">
        <strong>Depende de:</strong>
        <span>${predecessorName}</span>
      </div>
      <div class="task-detail-item">
        <strong>Concluído:</strong>
        <input type="number" id="editTaskPercent" class="form-input" value="${task.percentCompleted}" min="0" max="100" style="width: 80px; padding: 4px;" />
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function getTaskProgressClass(percentCompleted) {
  if (percentCompleted >= 100) {
    return 'completed';
  } else if (percentCompleted > 0) {
    return 'in-progress';
  }
  return 'not-started';
}

/**
 * Populates the cronograma select dropdown, filtered by empreendimento.
 */
async function populateCronogramaSelect() {
  const selectElement = document.getElementById('calendarCronogramaSelect');
  if (!selectElement) return;

  const calendarEmpreendimentoFilter = document.getElementById('calendarEmpreendimentoFilter');
  const selectedEmpreendimentoId = calendarEmpreendimentoFilter ? calendarEmpreendimentoFilter.value : 'all';
  
  allCronogramas = await loadCollection('cronogramas'); // Load all cronogramas

  // Filter cronogramas by selected empreendimento
  const filteredCronogramas = selectedEmpreendimentoId === 'all'
    ? allCronogramas
    : allCronogramas.filter(c => c.empreendimentoId === selectedEmpreendimentoId);

  // Clear existing options, keep the first "Selecione um cronograma"
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  filteredCronogramas.forEach(cronograma => {
    const option = document.createElement('option');
    option.value = cronograma.id;
    option.textContent = cronograma.name;
    selectElement.appendChild(option);
  });

  // If there's a selected cronograma, try to pre-select it
  if (selectedCronogramaId && filteredCronogramas.some(c => c.id === selectedCronogramaId)) {
    selectElement.value = selectedCronogramaId;
  } else if (filteredCronogramas.length > 0) {
    // Otherwise, select the first one by default
    selectedCronogramaId = filteredCronogramas[0].id;
    selectElement.value = selectedCronogramas[0].id; // Use the ID from the first cronograma
  } else {
    selectedCronogramaId = null; // No cronograma selecionado
    selectElement.value = ""; // Garante que o select mostre "Selecione"
  }

  // Show/hide delete button based on selection
  const deleteCronogramaBtn = document.getElementById('deleteCronogramaBtn');
  if (deleteCronogramaBtn) {
    deleteCronogramaBtn.style.display = selectedCronogramaId ? 'inline-block' : 'none';
  }

  renderCalendar(); // Render calendar with the selected cronograma
}

/**
 * Renders the calendar grid for a given week.
 * @param {Date} date - A date within the week to render.
 * @param {Array} cronogramaTasks - The tasks to display.
 */
function renderWeekView(date, cronogramaTasks = []) {
  const calendarContainer = document.getElementById('calendarContainer');
  if (!calendarContainer) return;

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Go to Sunday

  // For simplicity, we'll just list tasks for the week. A full grid is more complex.
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const tasksThisWeek = cronogramaTasks.filter(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    return taskStart <= endOfWeek && taskEnd >= startOfWeek;
  });

  if (tasksThisWeek.length === 0) {
    calendarContainer.innerHTML = '<p class="empty-state">Nenhuma tarefa para esta semana.</p>';
  } else {
    calendarContainer.innerHTML = `
      <div class="day-view-container">
        ${tasksThisWeek.map(task => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);
          const progressClass = getTaskProgressClass(task.percentCompleted); // Define a classe de progresso
          return `
          <div class="day-view-task ${progressClass}" data-task-id="${task.id}">
            ${task.percentCompleted > 0 ? `<span class="task-percent">${task.percentCompleted}%</span>` : ''}

            <strong>${task.name}</strong>
            <small>${formatDateToLocale(new Date(task.startDate))} - ${formatDateToLocale(new Date(task.endDate))}</small>
          </div>
        `;}).join('')}
      </div>
    `;
  }

  document.getElementById('currentPeriodDisplay').textContent = 
    `${formatDateToLocale(startOfWeek)} - ${formatDateToLocale(endOfWeek)}`;
}

/**
 * Renders the tasks for a single day.
 * @param {Date} date - The date to render.
 * @param {Array} cronogramaTasks - The tasks to display.
 */
function renderDayView(date, cronogramaTasks = []) {
  const calendarContainer = document.getElementById('calendarContainer');
  if (!calendarContainer) return;

  const tasksToday = cronogramaTasks.filter(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    return date >= taskStart && date <= taskEnd;
  });

  if (tasksToday.length === 0) {
    calendarContainer.innerHTML = '<p class="empty-state">Nenhuma tarefa para hoje.</p>';
  } else {
    calendarContainer.innerHTML = `
      <div class="day-view-container">
        ${tasksToday.map(task => {
          const progressClass = getTaskProgressClass(task.percentCompleted); // Define a classe de progresso
          return `<div class="day-view-task ${progressClass}" data-task-id="${task.id}">
                                    ${task.percentCompleted > 0 ? `<span class="task-percent">${task.percentCompleted}%</span>` : ''}

                                    <strong>${task.name}</strong>
                                    ${task.percentCompleted > 0 ? `<small>Concluído: ${task.percentCompleted}%</small>` : ''}
                                  </div>`;}).join('')}
      </div>
    `;
  }

  document.getElementById('currentPeriodDisplay').textContent = formatDateToLocale(date);
}

/**
 * Main calendar rendering function.
 */
async function renderCalendar() {
  const calendarContainer = document.getElementById('calendarContainer');
  if (!calendarContainer) return;

  if (!selectedCronogramaId) {
    calendarContainer.innerHTML = '<p class="empty-state">Selecione um cronograma para visualizar.</p>';
    return;
  }

  const selectedCronograma = allCronogramas.find(c => c.id === selectedCronogramaId);
  if (!selectedCronograma) {
    calendarContainer.innerHTML = '<p class="empty-state">Cronograma não encontrado.</p>';
    return;
  }

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Render based on currentCalendarView (for now, only month)
  if (currentCalendarView === 'month') {
    renderCalendarGrid(year, month, selectedCronograma.tasks);
  } else if (currentCalendarView === 'week') {
    renderWeekView(currentCalendarDate, selectedCronograma.tasks);
  } else if (currentCalendarView === 'day') {
    renderDayView(currentCalendarDate, selectedCronograma.tasks);
  }
}

async function handleDeleteCronograma() {
  if (!selectedCronogramaId) {
    showToast('Nenhum cronograma selecionado para exclusão.', 'error');
    return;
  }

  if (!confirm('Tem certeza que deseja excluir este cronograma? Esta ação é irreversível.')) {
    return;
  }

  try {
    await deleteDocument('cronogramas', selectedCronogramaId);
    showToast('Cronograma excluído com sucesso!', 'success');
    selectedCronogramaId = null; // Limpa a seleção
    await populateCronogramaSelect(); // Recarrega cronogramas e atualiza a UI
  } catch (error) {
    showToast('Erro ao excluir cronograma.', 'error');
    console.error('Erro ao excluir cronograma:', error);
  }
}

export function initCronogramaModule() {
  const saveBtn = document.getElementById('saveCronogramaBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveCronograma);
  }
}

export function initCalendarioModule() {
  const calendarCronogramaSelect = document.getElementById('calendarCronogramaSelect');
  const prevPeriodBtn = document.getElementById('prevPeriodBtn');
  const nextPeriodBtn = document.getElementById('nextPeriodBtn');
  const calendarEmpreendimentoFilter = document.getElementById('calendarEmpreendimentoFilter');
  const viewMonthBtn = document.getElementById('calViewMonth');
  const viewWeekBtn = document.getElementById('calViewWeek');
  const viewDayBtn = document.getElementById('calViewDay');
  const taskDetailModal = document.getElementById('cronogramaTaskDetailModal');
  const deleteCronogramaBtn = document.getElementById('deleteCronogramaBtn');
  const saveTaskBtn = document.getElementById('saveTaskDetailsBtn');
  const calendarContainer = document.getElementById('calendarContainer');
  const viewControls = [viewMonthBtn, viewWeekBtn, viewDayBtn];

  // Popula o filtro de empreendimentos e adiciona listener
  if (calendarEmpreendimentoFilter) {
    loadCollection('empreendimentos').then(empreendimentos => {
      populateEmpreendimentoSelect(empreendimentos, 'calendarEmpreendimentoFilter');
    });
    calendarEmpreendimentoFilter.addEventListener('change', populateCronogramaSelect); // Recarrega cronogramas ao mudar empreendimento
  }

  if (deleteCronogramaBtn) {
    deleteCronogramaBtn.addEventListener('click', handleDeleteCronograma);
  }

  if (calendarCronogramaSelect) {
    calendarCronogramaSelect.addEventListener('change', (e) => {
      selectedCronogramaId = e.target.value;
      renderCalendar();
    });
  }

  if (prevPeriodBtn) {
    prevPeriodBtn.addEventListener('click', () => {
      if (currentCalendarView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      } else if (currentCalendarView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
      } else {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
      }
      renderCalendar();
    });
  }
  if (nextPeriodBtn) {
    nextPeriodBtn.addEventListener('click', () => {
      if (currentCalendarView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      } else if (currentCalendarView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
      } else {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
      }
      renderCalendar();
    });
  }

  viewControls.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        viewControls.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCalendarView = btn.id.replace('calView', '').toLowerCase();
        renderCalendar();
      });
    }
  });

  // --- Lógica do Modal de Detalhes da Tarefa ---
  if (taskDetailModal) {
    taskDetailModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        taskDetailModal.classList.add('hidden');
        currentTask = null; // Limpa a tarefa atual ao fechar
      }
    });
  }

  if (saveTaskBtn) {
    saveTaskBtn.addEventListener('click', async () => {
      if (!currentTask || !selectedCronogramaId) return;

      const newPercent = parseInt(document.getElementById('editTaskPercent').value, 10);
      if (isNaN(newPercent) || newPercent < 0 || newPercent > 100) {
        showToast('Por favor, insira um valor de 0 a 100.', 'error');
        return;
      }

      try {
        const selectedCronograma = allCronogramas.find(c => c.id === selectedCronogramaId);
        const taskIndex = selectedCronograma.tasks.findIndex(t => t.id === currentTask.id);
        selectedCronograma.tasks[taskIndex].percentCompleted = newPercent;

        await updateDocument('cronogramas', selectedCronogramaId, { tasks: selectedCronograma.tasks });
        showToast('Progresso da tarefa atualizado!', 'success');
        taskDetailModal.classList.add('hidden');
        renderCalendar(); // Atualiza o calendário para mostrar o novo percentual
      } catch (error) {
        showToast('Erro ao salvar o progresso.', 'error');
        console.error(error);
      }
    });
  }

  if (calendarContainer) {
    calendarContainer.addEventListener('click', (e) => {
      const taskElement = e.target.closest('.calendar-task, .day-view-task');
      if (taskElement && taskElement.dataset.taskId) {
        renderTaskDetailsModal(taskElement.dataset.taskId);
      }
    });
  }

  populateCronogramaSelect(); // Initial load of cronogramas and calendar
}