import { loadCollection, getSupabase, updateDocument } from '../supabase-init.js';
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
  const usersListContainer = document.getElementById('users-list-container');
  if (!usersListContainer) return;
  usersListContainer.innerHTML = '<p>Carregando usuários...</p>';

  try { 
    // No Supabase, os dados de perfil estão na tabela 'profiles'.
    const users = await loadCollection('profiles');
    renderUsersList(users);

    // TODO: Se necessário, popule selects em outros módulos. Ex:
    // populateUserSelect(users, 'reformaFormResponsavelSelect');
    // populateUserSelect(users, 'pendenciaFormResponsavelSelect');

  } catch (error) {
    console.error("Erro ao carregar usuários: ", error);
    userList.innerHTML = '<li class="error">Não foi possível carregar os usuários.</li>';
  }
}

function renderUsersList(users) {
  const usersListContainer = document.getElementById('users-list-container');
  if (!usersListContainer) return;

  if (!users || users.length === 0) {
    usersListContainer.innerHTML = '<p>Nenhum usuário encontrado.</p>';
    return;
  }

  usersListContainer.innerHTML = users.map(user => `
    <div class="list-item-card" data-user-id="${user.id}">
      <div class="card-content">
        <h4>${user.full_name || 'Nome não definido'}</h4>
        <p>${user.email}</p>
        <p>Empresa: ${user.company_id || 'N/A'} | Papel: ${user.role || 'user'}</p>
      </div>
      <div class="card-actions">
        <button class="edit-user-btn">Editar</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.edit-user-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const userId = e.target.closest('.list-item-card').dataset.userId;
      openUserModalForEdit(userId);
    });
  });
}

export function initUsuariosModule() {
  const userEditModal = document.getElementById('user-edit-modal');
  const userEditForm = document.getElementById('user-edit-form');
  const addNewUserButton = document.getElementById('add-new-user-button');

  if (!userEditModal || !userEditForm || !addNewUserButton) return;

  addNewUserButton.addEventListener('click', openUserModalForCreate);
  userEditModal.querySelector('.close-modal-button').addEventListener('click', () => userEditModal.style.display = 'none');
  userEditForm.addEventListener('submit', handleSaveUser);

  loadAndRenderUsers();
}

function openUserModalForCreate() {
  const userEditModal = document.getElementById('user-edit-modal');
  const userModalTitle = document.getElementById('user-modal-title');
  const userEditForm = document.getElementById('user-edit-form');
  
  userModalTitle.textContent = 'Novo Usuário';
  userEditForm.reset();
  document.getElementById('user-id-input').value = '';
  document.getElementById('user-email-input').readOnly = false;
  userEditModal.style.display = 'block';
}

async function openUserModalForEdit(userId) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!userData) {
      showToast('Usuário não encontrado.', 'error');
      return;
    }

    const userEditModal = document.getElementById('user-edit-modal');
    const userModalTitle = document.getElementById('user-modal-title');

    userModalTitle.textContent = 'Editar Usuário';
    document.getElementById('user-id-input').value = userId;
    document.getElementById('user-email-input').value = userData.email;
    document.getElementById('user-email-input').readOnly = true;
    document.getElementById('user-name-input').value = userData.full_name || '';
    document.getElementById('user-company-input').value = userData.company_id || '';
    document.getElementById('user-role-select').value = userData.role || 'user';
    userEditModal.style.display = 'block';

  } catch (error) {
    console.error('Erro ao buscar usuário para edição:', error);
    showToast('Não foi possível carregar os dados do usuário.', 'error');
  }
}

async function handleSaveUser(e) {
  e.preventDefault();
  const userEditForm = e.target;
  const submitButton = userEditForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';

  const formData = new FormData(userEditForm);
  const userId = formData.get('user-id');

  const payload = {
    email: formData.get('user-email'),
    company_id: formData.get('user-company'),
    role: formData.get('user-role'),
    full_name: formData.get('user-name'),
  };

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client não está disponível.");

    if (userId) {
      // --- MODO DE ATUALIZAÇÃO ---
      const updatePayload = {
        full_name: payload.full_name,
        company_id: payload.company_id,
        role: payload.role,
      };
      await updateDocument('profiles', userId, updatePayload);
      showToast('Usuário atualizado com sucesso!', 'success');
    } else {
      // --- MODO DE CRIAÇÃO (CONVITE) ---
      const { error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: payload.email,
          options: {
            data: {
              full_name: payload.full_name,
              company_id: payload.company_id,
              role: payload.role,
            }
          }
        },
      });

      if (error) throw error;
      showToast(`Convite enviado para ${payload.email}!`, 'success');
    }

    document.getElementById('user-edit-modal').style.display = 'none';
    userEditForm.reset();
    loadAndRenderUsers();
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    const errorMessage = error.message.includes('permission')
      ? 'Você não tem permissão para convidar usuários.'
      : 'Erro ao salvar usuário. Verifique o console para detalhes.';
    showToast(errorMessage, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar';
  }
}