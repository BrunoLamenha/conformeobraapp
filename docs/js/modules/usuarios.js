// docs/js/modules/usuarios.js

import { initFirebase, loadCollection, updateDocument, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';

let userEditModal;
let userModalTitle;
let userEditForm;
let usersListContainer;
let addNewUserButton;

export function initUsuariosModule() {
    userEditModal = document.getElementById('userFormModal'); // Corrigido para o ID do modal no HTML
    if (!userEditModal) return; // Se o modal não existe, o módulo não pode funcionar

    userModalTitle = userEditModal.querySelector('.modal-header h2');
    userEditForm = document.getElementById('userForm');
    usersListContainer = document.getElementById('userList');
    addNewUserButton = document.querySelector('[data-trigger-user-form]');

    if (addNewUserButton) {
        addNewUserButton.addEventListener('click', openUserModalForCreate);
    }
    userEditModal.querySelector('.close-modal').addEventListener('click', () => userEditModal.style.display = 'none');
    userEditForm.addEventListener('submit', handleSaveUser);

    loadAndRenderUsers();
}

async function loadAndRenderUsers() {
    if (!usersListContainer) return;
    usersListContainer.innerHTML = '<li>Carregando usuários...</li>';

    try {
        // A função loadCollection já tem fallback para localStorage
        const users = await loadCollection('usuarios');
        renderUsersList(users);
    } catch (error) {
        console.error("Erro ao carregar usuários: ", error);
        usersListContainer.innerHTML = '<li class="error">Não foi possível carregar os usuários.</li>';
    }
}

function renderUsersList(users) {
    if (!usersListContainer) return;

    if (!users || users.length === 0) {
        usersListContainer.innerHTML = '<li>Nenhum usuário encontrado.</li>';
        return;
    }

    usersListContainer.innerHTML = users.map(user => `
        <li data-user-id="${user.id}">
            <span>${user.nome || 'Nome não definido'} (${user.email || 'sem e-mail'})</span>
            <small>${user.empresa || 'N/A'} - ${user.perfil || 'user'}</small>
            <button class="tertiary-btn edit-user-btn">Editar</button>
        </li>
    `).join('');

    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.closest('li').dataset.userId;
            openUserModalForEdit(userId);
        });
    });
}

function openUserModalForCreate() {
    if (!userEditModal) return;
    userModalTitle.textContent = 'Cadastrar Novo Usuário';
    userEditForm.reset();
    userEditForm.dataset.userId = ''; // Limpa o ID do usuário
    userEditForm.querySelector('input[name="email"]').readOnly = false;
    userEditModal.style.display = 'block';
}

async function openUserModalForEdit(userId) {
    if (!userEditModal) return;
    const users = await loadCollection('usuarios');
    const userData = users.find(u => u.id === userId);

    if (userData) {
        userModalTitle.textContent = 'Editar Usuário';
        userEditForm.dataset.userId = userId;
        userEditForm.querySelector('input[name="nome"]').value = userData.nome || '';
        userEditForm.querySelector('select[name="empresa"]').value = userData.empresa || '';
        const emailInput = userEditForm.querySelector('input[name="email"]');
        emailInput.value = userData.email || '';
        emailInput.readOnly = true; // Não permite editar email
        userEditForm.querySelector('select[name="perfil"]').value = userData.perfil || 'operacional';
        userEditModal.style.display = 'block';
    }
}

async function handleSaveUser(e) {
    e.preventDefault();
    const submitButton = userEditForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    const userId = userEditForm.dataset.userId;
    const formData = new FormData(userEditForm);

    const payload = {
        nome: formData.get('nome'),
        empresa: formData.get('empresa'),
        email: formData.get('email'),
        perfil: formData.get('perfil'),
    };

    try {
        const action = userId ? 'atualizado' : 'salvo';
        if (userId) {
            // Editando um usuário existente
            await updateDocument('usuarios', userId, payload);
        } else {
            // Criando um novo usuário
            // Idealmente, uma Cloud Function criaria o usuário no Firebase Auth.
            // Por enquanto, apenas salvamos no Firestore/localStorage.
            await saveDocument('usuarios', payload);
        }

        showToast(`Usuário ${action} com sucesso!`, 'success');
        userEditModal.style.display = 'none';        
        loadAndRenderUsers();

    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showToast('Erro ao salvar usuário.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar usuário';
    }
}