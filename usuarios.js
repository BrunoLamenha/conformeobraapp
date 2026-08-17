// public/js/modules/usuarios.js

import { db, functions } from '../firebase-init.js';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
    if (!db) return;
    usersListContainer.innerHTML = '<p>Carregando usuários...</p>';

    try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        renderUsersList(users);
    } catch (error) {
        console.error("Erro ao carregar usuários: ", error);
        usersListContainer.innerHTML = '<p class="error">Não foi possível carregar os usuários.</p>';
    }
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
    if (!db) return;
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        userModalTitle.textContent = 'Editar Usuário';
        document.getElementById('user-id-input').value = userId;
        document.getElementById('user-email-input').value = userData.email;
        document.getElementById('user-email-input').readOnly = true; // Não permite editar email
        document.getElementById('user-name-input').value = userData.name || '';
        document.getElementById('user-company-input').value = userData.companyId || '';
        document.getElementById('user-role-select').value = userData.role || 'user';
        userEditModal.style.display = 'block';
    }
}

async function handleSaveUser(e) {
    e.preventDefault();
    if (!functions || !db) {
        alert('Serviços do Firebase não estão disponíveis.');
        return;
    }

    const userId = document.getElementById('user-id-input').value;
    const email = document.getElementById('user-email-input').value;
    const name = document.getElementById('user-name-input').value;
    const companyId = document.getElementById('user-company-input').value;
    const role = document.getElementById('user-role-select').value;

    const userData = { email, name, companyId, role };

    try {
        // 1. Chamar a Cloud Function para criar o usuário no Auth e/ou definir os claims
        const setUserClaims = httpsCallable(functions, 'setUserClaims');
        const result = await setUserClaims({ email, companyId, role });

        if (result.data.error) {
            throw new Error(result.data.error);
        }

        const finalUserId = userId || result.data.uid;

        // 2. Salvar/Atualizar as informações do usuário no documento do Firestore
        const userDocRef = doc(db, 'users', finalUserId);
        await setDoc(userDocRef, userData, { merge: true });

        alert('Usuário salvo com sucesso!');
        userEditModal.style.display = 'none';
        loadAndRenderUsers();

    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro ao salvar usuário: ' + error.message);
    }
}