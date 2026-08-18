import { loadCollection, saveDocument, getFunctions } from '../firebase-init.js';
import { showToast } from '../utils/toast.js'; // Caminho padronizado

/**
 * Popula um elemento <select> com os usuários carregados.
 * @param {Array<Object>} users - A lista de usuários.
 * @param {string} selectElementId - O ID do elemento <select> a ser populado.
 */
export function populateUserSelect(users, selectElementId) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;

  // Limpa opções existentes, exceto a primeira ("Selecione")
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  users.forEach(user => {
    const option = new Option(user.name, user.uid); // Usa o nome como texto e UID como valor
    selectElement.appendChild(option);
  });
}

async function loadAndRenderUsers() {
  const userList = document.getElementById('userList');
  if (!userList) return;
  userList.innerHTML = '<li>Carregando usuários...</li>';

  try {
    const users = await loadCollection('users');
    renderUsersList(users);

    // Popula os selects de responsável nos outros módulos
    populateUserSelect(users, 'reformaFormResponsavelSelect');
    populateUserSelect(users, 'pendenciaFormResponsavelSelect');

  } catch (error) {
    console.error("Erro ao carregar usuários: ", error);
    userList.innerHTML = '<li class="error">Não foi possível carregar os usuários.</li>';
  }
}

function renderUsersList(users) {
  const userList = document.getElementById('userList');
  if (!userList) return;

  if (!users || users.length === 0) {
    userList.innerHTML = '<li>Nenhum usuário encontrado.</li>';
    return;
  }

  userList.innerHTML = users.map(user => `
    <li data-user-id="${user.id}">
      <div>
        <strong>${user.name || 'Nome não definido'}</strong>
        <small>${user.email || 'sem e-mail'}</small>
      </div>
      <small>${user.companyName || 'N/A'} - ${user.role || 'user'}</small>
    </li>
  `).join('');
}

export function initUsuariosModule() {
  const userForm = document.getElementById('userForm');
  if (!userForm) return;

  userForm.addEventListener('submit', handleSaveUser);

  loadAndRenderUsers();
}

async function handleSaveUser(e) {
  e.preventDefault();
  const userForm = e.target;
  const submitButton = userForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';

  const formData = new FormData(userForm);

  const payload = {
    name: formData.get('nome'),
    companyId: formData.get('empresa'),
    email: formData.get('email'),
    role: formData.get('perfil'),
  };

  try {
    // 1. Chama a Cloud Function para criar o usuário no Auth e definir suas permissões.
    const functions = getFunctions();
    const setUserClaims = functions.httpsCallable('setUserClaims');
    const result = await setUserClaims(payload);

    if (!result.data.success) {
      throw new Error(result.data.message || 'A função na nuvem retornou um erro.');
    }

    // 2. Salva os detalhes do usuário na coleção 'users' do Firestore.
    // O UID vem da resposta da Cloud Function.
    const userDocPayload = { ...payload, uid: result.data.uid };
    await saveDocument('users', userDocPayload);

    showToast(`Usuário ${payload.name} criado com sucesso!`, 'success');
    userForm.reset();
    loadAndRenderUsers();
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    const errorMessage = error.message.includes('permission-denied')
      ? 'Você não tem permissão para criar usuários.'
      : 'Erro ao criar usuário. Verifique o console para detalhes.';
    showToast(errorMessage, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar usuário';
  }
}