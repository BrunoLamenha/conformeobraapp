import { saveDocument, loadCollection } from '../firebase-init.js';

function renderUsuarios(users = []) {
  const list = document.getElementById('userList');
  if (!list) return;

  if (!users.length) {
    list.innerHTML = '<li class="empty-state">Nenhum usuário cadastrado ainda.</li>';
    return;
  }

  list.innerHTML = users
    .map(
      (user) => `
        <li>
          <strong>${user.nome || 'Usuário sem nome'}</strong>
          <small>${user.empresa || 'Empresa não informada'} · ${user.perfil || 'Perfil não definido'}</small>
        </li>
      `
    )
    .join('');
}

export function initUsuariosModule() {
  const form = document.getElementById('userForm');
  const trigger = document.querySelector('[data-trigger-user-form]');

  if (!form) return;

  if (trigger) {
    trigger.addEventListener('click', () => {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = form.querySelector('input[name="nome"]');
      if (firstInput) firstInput.focus();
    });
  }

  const refreshUsers = () => {
    loadCollection('usuarios')
      .then((items) => renderUsuarios(items))
      .catch((error) => {
        console.error('Erro ao carregar usuários:', error);
        renderUsuarios([]);
      });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(new FormData(form).entries());

    saveDocument('usuarios', payload)
      .then(() => {
        form.reset();
        refreshUsers();
      })
      .catch((error) => {
        console.error('Erro ao salvar usuário:', error);
        form.reset();
        refreshUsers();
      });
  });

  refreshUsers();
}
