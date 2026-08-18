import { loadCollection, getSupabase } from '../supabase-init.js';
import { showToast } from '../utils/toast.js';

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
    // No Supabase, os dados de perfil estão na tabela 'profiles'.
    const users = await loadCollection('profiles');
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
        <strong>${user.full_name || 'Nome não definido'}</strong>
        <small>${user.email || 'sem e-mail'}</small>
      </div>
      <small>${user.role || 'user'}</small>
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
    email: formData.get('email'),
    companyId: formData.get('empresa'),
    role: formData.get('perfil'),
    full_name: formData.get('nome'),
  };

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client não está disponível.");

    // Correção de Segurança: Chama a Edge Function para convidar o usuário.
    // A chave de admin nunca é exposta no cliente.
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: {
        email: payload.email,
        options: {
          data: {
            full_name: payload.full_name,
            company_id: payload.companyId,
            role: payload.role,
          }
        }
      },
    });

    if (error) throw error;

    showToast(`Convite enviado para ${payload.email}!`, 'success');
    userForm.reset();
    loadAndRenderUsers();
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    const errorMessage = error.message.includes('permission')
      ? 'Você não tem permissão para convidar usuários.'
      : 'Erro ao criar usuário. Verifique o console para detalhes.';
    showToast(errorMessage, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar usuário';
  }
}