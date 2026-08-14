export function initCalendarioModule() {
  console.log('Módulo de calendário inicializado.');

  const card = document.getElementById('calendarioView');
  if (!card) return;

  card.dataset.module = 'calendario';
}
