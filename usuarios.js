// public/js/modules/usuarios.js

// TODO: Substituir pela importação do cliente Supabase
// import { supabase } from '../supabase-init.js';

// Código antigo do Firebase (comentado para referência)
// import { db, functions } from '../firebase-init.js';
// import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
// import { httpsCallable } from 'firebase/functions';

let userEditModal;
let userModalTitle;
let userEditForm;
let usersListContainer;

export function initUsuariosModule() {
    userEditModal = document.getElementById('user-edit-modal');
    userModalTitle = document.getElementById('user-modal-title');
    userEditForm = document.getElementById('user-edit-form');
    usersListContainer = document.getElementById('users-list-container');

    document.getElementById('add-new-user-button').addEventListener('click', openUserModalForCreate);
    userEditModal.querySelector('.close-modal-button').addEventListener('click', () => userEditModal.style.display = 'none');
    userEditForm.addEventListener('submit', handleSaveUser);

    loadAndRenderUsers();
}

async function loadAndRenderUsers() {
    // TODO: Implementar com Supabase
    // if (!supabase) return;
    usersListContainer.innerHTML = '<p>Carregando usuários...</p>';

    try {
        // Exemplo com Supabase (assumindo uma tabela 'profiles')
        // const { data: users, error } = await supabase
        //     .from('profiles')
        //     .select('*');
        // if (error) throw error;

        // Linhas abaixo são mock/placeholder até a implementação
        console.warn("loadAndRenderUsers precisa ser implementado com Supabase.");
        const mockUsers = []; // Substituir pelo 'users' do Supabase
        renderUsersList(mockUsers);

    } catch (error) {
        console.error("Erro ao carregar usuários: ", error);
        usersListContainer.innerHTML = '<p class="error">Não foi possível carregar os usuários.</p>';
    }

    // Código antigo do Firebase
    // const usersCollection = collection(db, 'users');
    // const userSnapshot = await getDocs(usersCollection);
    // const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // renderUsersList(users);
}

function renderUsersList(users) {
    if (users.length === 0) {
        usersListContainer.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        return;
    }

    usersListContainer.innerHTML = users.map(user => `
        <div class="list-item-card" data-user-id="${user.id}">
            <div class="card-content">
                <h4>${user.name || 'Nome não definido'}</h4>
                <p>${user.email}</p>
                <p>Empresa: ${user.companyId || 'N/A'} | Papel: ${user.role || 'user'}</p>
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

function openUserModalForCreate() {
    userModalTitle.textContent = 'Novo Usuário';
    userEditForm.reset();
    document.getElementById('user-id-input').value = '';
    document.getElementById('user-email-input').readOnly = false;
    userEditModal.style.display = 'block';
}

async function openUserModalForEdit(userId) {
    // TODO: Implementar com Supabase
    // if (!supabase) return;

    try {
        // Exemplo com Supabase
        // const { data: userData, error } = await supabase
        //     .from('profiles')
        //     .select('*')
        //     .eq('id', userId)
        //     .single();
        // if (error) throw error;
        // if (!userData) return;

        // As linhas abaixo são mock/placeholder
        const userData = { id: userId, email: 'mock@example.com', name: 'Mock User', companyId: 'mock-company', role: 'user' };

        userModalTitle.textContent = 'Editar Usuário';
        document.getElementById('user-id-input').value = userId;
        document.getElementById('user-email-input').value = userData.email;
        document.getElementById('user-email-input').readOnly = true; // Não permite editar email
        document.getElementById('user-name-input').value = userData.name || '';
        document.getElementById('user-company-input').value = userData.companyId || '';
        document.getElementById('user-role-select').value = userData.role || 'user';
        userEditModal.style.display = 'block';

    } catch (error) {
        console.error('Erro ao buscar usuário para edição:', error);
        alert('Não foi possível carregar os dados do usuário.');
    }
}

async function handleSaveUser(e) {
    e.preventDefault();
    // TODO: Implementar com Supabase
    if (true) { // Substituir pela verificação do Supabase
        alert('Funcionalidade de salvar usuário precisa ser migrada para Supabase.');
        return;
    }

    const userId = document.getElementById('user-id-input').value;
    const email = document.getElementById('user-email-input').value;
    const name = document.getElementById('user-name-input').value;
    const companyId = document.getElementById('user-company-input').value;
    const role = document.getElementById('user-role-select').value;

    const userData = { email, name, companyId, role };

    // No Supabase, a criação de usuário (Auth) e a criação de perfil (tabela 'profiles')
    // são geralmente tratadas separadamente ou por meio de Triggers no banco de dados.
    // Uma Edge Function pode ser usada para replicar a lógica da antiga Cloud Function.

    try {
        // Exemplo de lógica com Supabase:
        // 1. Chamar uma Edge Function para criar o usuário e retornar o ID
        // const { data, error } = await supabase.functions.invoke('create-user', {
        //     body: { email, password: 'SENHA_PROVISORIA' },
        // });
        // if (error) throw error;
        // const newUserId = data.user.id;

        // 2. Salvar/Atualizar o perfil na tabela 'profiles'
        // const { error: profileError } = await supabase
        //     .from('profiles')
        //     .upsert({ id: userId || newUserId, ...userData }); // upsert = update or insert
        // if (profileError) throw profileError;

        alert('Usuário salvo com sucesso!');
        userEditModal.style.display = 'none';
        loadAndRenderUsers();
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert(`Erro ao salvar usuário: ${error.message}`);
    }
}