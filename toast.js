/**
 * Cria e exibe uma notificação "toast" na tela.
 * @param {string} message A mensagem a ser exibida.
 * @param {'success' | 'error' | 'info'} type O tipo de notificação (controla a cor).
 * @param {number} duration A duração em milissegundos que o toast ficará visível.
 */
export function showToast(message, type = 'info', duration = 3000) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Anima a entrada do toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Agenda a remoção do toast
  setTimeout(() => {
    toast.classList.remove('show');
    // Remove o elemento do DOM após a animação de saída
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }, duration);
}