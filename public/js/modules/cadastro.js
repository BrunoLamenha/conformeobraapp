export function initCadastroModule() {
  console.log('Módulo de cadastro inicializado.');

  const card = document.getElementById('cadastroView');
  if (!card) return;

  card.dataset.module = 'cadastro';
}
