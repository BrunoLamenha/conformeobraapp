import { getAuth, isFirebaseConfigured } from './firebase-init.js';
import { updateUserInfo, loadInitialData } from './app.js';
import { showToast } from './utils/toast.js'; // Caminho padronizado

// Elementos da UI
const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showSignUpLink = document.getElementById('showSignUp');
const loginButton = document.querySelector('.login-button');
const signupLinkContainer = document.querySelector('.signup-link');

let isSignUpMode = false;

/**
 * Lida com o login usando e-mail e senha.
 */
async function handleEmailLogin(event) {
  event.preventDefault();
  if (!isFirebaseConfigured()) {
    showToast('Firebase não configurado. Login indisponível.', 'error');
    return;
  }

  const email = document.getElementById('userEmail').value;
  const password = document.getElementById('userPassword').value;
  const auth = getAuth();

  try {
    if (isSignUpMode) {
      // Modo de Cadastro
      await auth.createUserWithEmailAndPassword(email, password);
      showToast('Usuário cadastrado com sucesso! Faça o login.', 'success');
      // Volta para o modo de login
      toggleSignUpMode(false);
    } else {
      // Modo de Login
      await auth.signInWithEmailAndPassword(email, password);
      // O onAuthStateChanged vai cuidar de mostrar o app.
    }
  } catch (error) {
    console.error('Erro de autenticação:', error);
    showToast(`Erro: ${error.message}`, 'error');
  }
}

/**
 * Lida com o login usando a conta do Google.
 */
async function handleGoogleLogin() {
  if (!isFirebaseConfigured()) {
    showToast('Firebase não configurado. Login indisponível.', 'error');
    return;
  }
  const auth = getAuth();
  const provider = new window.firebase.auth.GoogleAuthProvider();

  try {
    await auth.signInWithPopup(provider);
    // O onAuthStateChanged vai cuidar de mostrar o app.
  } catch (error) {
    console.error('Erro no login com Google:', error);
    showToast(`Erro no login com Google: ${error.message}`, 'error');
  }
}

/**
 * Lida com o logout do usuário.
 */
async function handleLogout() {
  if (!isFirebaseConfigured()) return;
  const auth = getAuth();
  try {
    await auth.signOut();
    // O onAuthStateChanged vai cuidar de mostrar a tela de login.
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}

/**
 * Alterna entre a interface de login e cadastro.
 * @param {boolean} isSigningUp - True para modo de cadastro, false para login.
 */
function toggleSignUpMode(isSigningUp) {
  isSignUpMode = isSigningUp;
  if (isSignUpMode) {
    loginButton.textContent = 'Cadastrar';
    signupLinkContainer.innerHTML = '<p>Já tem uma conta? <a href="#" id="showLogin">Faça o login</a></p>';
    document.querySelector('#showLogin').addEventListener('click', (e) => {
      e.preventDefault();
      toggleSignUpMode(false);
    });
  } else {
    loginButton.textContent = 'Entrar';
    signupLinkContainer.innerHTML = '<p>Não tem uma conta? <a href="#" id="showSignUp">Cadastre-se</a></p>';
    document.querySelector('#showSignUp').addEventListener('click', (e) => {
      e.preventDefault();
      toggleSignUpMode(true);
    });
  }
}

/**
 * Observa mudanças no estado de autenticação do usuário.
 */
function setupAuthObserver() {
  if (!isFirebaseConfigured()) {
    // Se o Firebase não estiver configurado, esconde a tela de login e mostra o app
    // para permitir o uso em modo offline.
    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    console.warn('App em modo offline. Funcionalidades de login e sincronização desabilitadas.');
    return;
  }

  const auth = getAuth();
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Usuário está logado
      await updateUserInfo(user);
      loadInitialData(user);
      loginScreen.classList.add('hidden');
      appShell.classList.remove('hidden');
    } else {
      // Usuário não está logado
      loginScreen.classList.remove('hidden');
      appShell.classList.add('hidden');
    }
  });
}

// Adiciona os event listeners aos elementos da UI
if (loginForm) {
  loginForm.addEventListener('submit', handleEmailLogin);
}
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', handleGoogleLogin);
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}
if (showSignUpLink) {
  showSignUpLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSignUpMode(true);
  });
}

// Inicia o observador de autenticação
setupAuthObserver();
