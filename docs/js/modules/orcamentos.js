export function initOrcamentosModule() {
  console.log('Módulo de orçamentos inicializado.');

  const card = document.getElementById('orcamentosView');
  if (!card) return;

  card.dataset.module = 'orcamentos';
}
