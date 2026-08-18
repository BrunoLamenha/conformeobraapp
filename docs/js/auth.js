import { getSupabase, isSupabaseConfigured } from './supabase-init.js';
import { updateUserInfo, loadInitialData } from './app.js';
import { showToast } from './utils/toast.js'; // Caminho padronizado

// Elementos da UI
const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');
const loadingOverlay = document.getElementById('loadingOverlay'); // Pega o novo elemento
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
  if (!isSupabaseConfigured()) {
    showToast('Supabase não configurado. Login indisponível.', 'error');
    return;
  }

  const email = document.getElementById('userEmail').value;
  const password = document.getElementById('userPassword').value;
  const supabase = getSupabase();

  try {
    if (isSignUpMode) {
      // Modo de Cadastro
      // Adiciona o nome completo aos metadados para o gatilho do BD usar.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: 'Novo Usuário' } } // Nome padrão
      });
      if (error) throw error;
      showToast('Usuário cadastrado com sucesso! Faça o login.', 'success');
      // Volta para o modo de login
      toggleSignUpMode(false);
    } else {
      // Modo de Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
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
  if (!isSupabaseConfigured()) {
    showToast('Supabase não configurado. Login indisponível.', 'error');
    return;
  }
  const supabase = getSupabase();

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    // O usuário será redirecionado para a página do Google e depois voltará.
    // O onAuthStateChange cuidará do resto.
  } catch (error) {
    console.error('Erro no login com Google:', error);
    showToast(`Erro ao logar com Google: ${error.message}`, 'error');
  }
}

/**
 * Lida com o logout do usuário.
 */
async function handleLogout() {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
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
export function setupAuth() {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();
  supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user;
    if (event === 'SIGNED_IN' && user) {
      // Usuário está logado.
      // 1. Esconde a tela de login e mostra o overlay de carregamento.
      loginScreen.classList.add('hidden');
      loadingOverlay.classList.remove('hidden');
      appShell.classList.add('hidden'); // Garante que o app principal está escondido.
      // 2. Carrega as informações do usuário e os dados iniciais.
      await updateUserInfo(user);
      await loadInitialData(user);

      // 3. Após tudo carregado, esconde o overlay e mostra o app.
      loadingOverlay.classList.add('hidden');
      appShell.classList.remove('hidden');

    } else if (event === 'SIGNED_OUT') {
      // Usuário não está logado. Mostra a tela de login.
      loginScreen.classList.remove('hidden');
      appShell.classList.add('hidden');
      loadingOverlay.classList.add('hidden');
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
