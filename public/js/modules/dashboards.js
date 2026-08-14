export function initDashboardsModule() {
  console.log('Módulo de dashboards inicializado.');

  const card = document.getElementById('dashboardView');
  if (!card) return;

  card.dataset.module = 'dashboard';
}
