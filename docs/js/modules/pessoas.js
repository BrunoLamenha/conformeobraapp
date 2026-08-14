export function initPessoasModule() {
  console.log('Módulo de pessoas inicializado.');

  const card = document.getElementById('pessoasView');
  if (!card) return;

  card.dataset.module = 'pessoas';
}
