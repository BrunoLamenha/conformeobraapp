export function initChecklistModule() {
  console.log('Módulo de checklist inicializado.');

  const card = document.getElementById('checklistView');
  if (!card) return;

  card.dataset.module = 'checklist';
}
