import { loadCollection, initFirebase } from './firebase-init.js';
import { setupSyncStatus } from './modules/syncStatus.js';
import { setupAuth } from './auth.js';

const allNavButtons = document.querySelectorAll('.nav-item, .nav-bottom-item');
const views = document.querySelectorAll('.view');
const wizardOverlay = document.getElementById('wizardOverlay');
const closeWizardButton = document.getElementById('closeWizard');
const nextStepButton = document.getElementById('nextStep');
const prevStepButton = document.getElementById('prevStep');
const wizardForm = document.getElementById('wizardForm');
const stepPanels = Array.from(document.querySelectorAll('.wizard-step-panel'));
const stepIndicators = Array.from(document.querySelectorAll('.step'));
const summaryBox = document.getElementById('wizardSummary');
const profileToggle = document.getElementById('profileToggle');
const profileModal = document.getElementById('profileModal');
const modulesModal = document.getElementById('modulesModal');
const bottomNavItems = document.querySelectorAll('.nav-bottom-item');
const closeProfileBtn = profileModal?.querySelector('.close-profile');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const userAvatarText = document.getElementById('userAvatarText');
const closeModulesBtn = modulesModal?.querySelector('.close-modal');

let modulesInitialized = false;

// Dados do usuário logado
let currentUser = {
  name: '',
  company: '',
  role: 'Operacional'
};

let currentStep = 0;

function activateView(viewId) {
  views.forEach((view) => {
    const isActive = view.id === `${viewId}View`;
    view.classList.toggle('active', isActive);
  });

  // Atualizar estado ativo dos botões de navegação (sidebar e inferior)
  allNavButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });

  // Atualizar título da página
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    const viewName = {
      dashboard: 'Dashboard',
      reformas: 'Reformas',
      vistorias: 'Vistorias',
      projetos: 'Projetos',
      pendencias: 'Pendências',
      relatorios: 'Relatórios',
      usuarios: 'Usuários',
      orcamentos: 'Orçamentos',
      cadastro: 'Cadastro',
      search: 'Pesquisa',
      calendario: 'Calendário', // Adicionar aqui para o título
      cronograma: 'Cronograma',
      modules: 'Módulos',
      managerDashboard: 'Dashboard Gerencial',
      settings: 'Configurações'
    };
    pageTitle.querySelector('h1').textContent = viewName[viewId] || 'Painel';
  }

  // Fechar modais ao mudar de view
  if (profileModal) profileModal.classList.add('hidden');
  if (modulesModal) modulesModal.classList.add('hidden');
}

export async function updateUserInfo(user) {
  const userName = user.displayName || user.email;
  
  // Pega os custom claims (role, companyId) do token do usuário
  const token = await user.getIdTokenResult();
  const claims = token.claims || {};

  let companyName = 'Empresa Padrão';
  // Se o usuário tem um companyId, busca o nome da empresa.
  if (claims.companyId) {
    try {
      const companies = await loadCollection('companies', { ignoreCompanyFilter: true });
      const userCompany = companies.find(c => c.id === claims.companyId);
      if (userCompany) companyName = userCompany.name;
    } catch (e) { console.error("Erro ao buscar nome da empresa:", e); }
  }

  const initials = (user.displayName || user.email)
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  
  // Atualiza o objeto global do usuário com dados seguros do token
  currentUser.name = userName;
  currentUser.companyId = claims.companyId;
  currentUser.role = claims.role || 'operacional';

  if (userAvatarText) userAvatarText.textContent = initials || 'U';
  
  if (document.getElementById('profileName')) {
    document.getElementById('profileName').textContent = userName;
    document.getElementById('profileCompany').textContent = companyName;
    document.getElementById('profileRole').textContent = claims.role || 'Operacional';
    document.getElementById('profileAvatarLarge').textContent = initials || 'U';
  }
}


// NAVBAR INFERIOR
bottomNavItems.forEach((button) => {
  button.addEventListener('click', () => {
    const viewId = button.dataset.view;
    
    if (viewId === 'modules') {
      modulesModal.classList.remove('hidden');
    } else if (viewId === 'settings') {
      // Abre modal de configurações (pode ser perfil ou settings específicas)
      profileModal.classList.remove('hidden');
    } else {
      activateView(viewId);
    }
  });
});

/**
 * Lida com a busca em tempo real nos módulos do aplicativo.
 * @param {Event} event - O evento de input do campo de busca.
 */
async function handleSearch(event) {
  const searchTerm = event.target.value.trim().toLowerCase();

  if (!searchResults) return;

  if (searchTerm.length < 3) {
    searchResults.innerHTML = '<p class="empty-state">Digite pelo menos 3 caracteres para buscar.</p>';
    return;
  }

  searchResults.innerHTML = '<p class="loading">Buscando...</p>';

  try {
    // Carrega dados de todos os módulos relevantes em paralelo
    const [reformas, vistorias, projetos, pendencias] = await Promise.all([
      loadCollection('reformas'),
      loadCollection('vistorias'),
      loadCollection('projetos'),
      loadCollection('pendencias'),
    ]);

    const allResults = [];

    // Filtra e normaliza os resultados de cada coleção
    reformas
      .filter(item => item.titulo?.toLowerCase().includes(searchTerm) || item.obra?.toLowerCase().includes(searchTerm))
      .forEach(item => allResults.push({ type: 'Reforma', text: item.titulo, details: `Obra: ${item.obra}`, view: 'reformas' }));

    vistorias
      .filter(item => item.titulo?.toLowerCase().includes(searchTerm) || item.obra?.toLowerCase().includes(searchTerm) || item.area?.toLowerCase().includes(searchTerm))
      .forEach(item => allResults.push({ type: 'Vistoria', text: item.titulo, details: `Obra: ${item.obra} - Área: ${item.area}`, view: 'vistorias' }));

    projetos
      .filter(item => item.nome?.toLowerCase().includes(searchTerm) || item.obra?.toLowerCase().includes(searchTerm))
      .forEach(item => allResults.push({ type: 'Projeto', text: item.nome, details: `Obra: ${item.obra}`, view: 'projetos' }));

    pendencias
      .filter(item => item.descricao?.toLowerCase().includes(searchTerm) || item.obra?.toLowerCase().includes(searchTerm))
      .forEach(item => allResults.push({ type: 'Pendência', text: item.descricao, details: `Obra: ${item.obra} - Prioridade: ${item.prioridade}`, view: 'pendencias' }));

    if (allResults.length === 0) {
      searchResults.innerHTML = '<p class="empty-state">Nenhum resultado encontrado.</p>';
    } else {
      searchResults.innerHTML = allResults.map(result => `
        <div class="search-result-item" data-view="${result.view}">
          <span class="result-type">${result.type}</span>
          <strong class="result-text">${result.text}</strong>
          <small class="result-details">${result.details}</small>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Erro ao realizar a busca:', error);
    searchResults.innerHTML = '<p class="error">Ocorreu um erro ao buscar. Tente novamente.</p>';
  }
}

// EDITAR PERFIL
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
const profileContent = profileModal?.querySelector('.profile-content');
const profileEditForm = profileModal?.querySelector('#profileEditForm');

if (editProfileBtn) {
  editProfileBtn.addEventListener('click', () => {
    // Preenche o formulário com os dados atuais
    document.getElementById('editProfileName').value = currentUser.name;
    document.getElementById('editProfileCompany').value = currentUser.company;

    // Alterna a visibilidade
    profileContent.classList.add('hidden');
    profileEditForm.classList.remove('hidden');
  });
}

if (cancelEditProfileBtn) {
  cancelEditProfileBtn.addEventListener('click', () => {
    // Apenas volta para a visualização
    profileContent.classList.remove('hidden');
    profileEditForm.classList.add('hidden');
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', () => {
    const newName = document.getElementById('editProfileName').value.trim();
    if (!newName) {
      alert('O nome não pode ficar em branco.');
      return;
    }

    // Atualiza o objeto currentUser
    currentUser.name = newName;

    // Recalcula e atualiza a UI
    const initials = newName.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    if (userAvatarText) userAvatarText.textContent = initials || 'U';
    document.getElementById('profileName').textContent = newName;
    document.getElementById('profileAvatarLarge').textContent = initials || 'U';

    // Volta para a visualização
    profileContent.classList.remove('hidden');
    profileEditForm.classList.add('hidden');
  });
}

// PERFIL
if (profileToggle) {
  profileToggle.addEventListener('click', (e) => {
    e.preventDefault();
    profileModal.classList.remove('hidden');
  });
}

if (closeProfileBtn) {
  closeProfileBtn.addEventListener('click', () => {
    profileModal.classList.add('hidden');
  });
}

// MODAL DE MÓDULOS
if (closeModulesBtn) {
  closeModulesBtn.addEventListener('click', () => {
    modulesModal.classList.add('hidden');
  });
}

// Clicar nos tiles de módulos
const moduleTiles = modulesModal?.querySelectorAll('.module-tile') || [];
moduleTiles.forEach((tile) => {
  tile.addEventListener('click', () => {
    const viewId = tile.dataset.view;
    activateView(viewId);
  });
});

// Fechar modais ao clicar no overlay
if (profileModal) {
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.add('hidden');
    }
  });
}

if (modulesModal) {
  modulesModal.addEventListener('click', (e) => {
    if (e.target === modulesModal) {
      modulesModal.classList.add('hidden');
    }
  });
}

function updateWizardUI() {
  stepPanels.forEach((panel, index) => {
    panel.classList.toggle('active', index === currentStep);
  });

  stepIndicators.forEach((step, index) => {
    step.classList.toggle('active', index === currentStep);
  });

  prevStepButton.disabled = currentStep === 0;
  prevStepButton.style.opacity = currentStep === 0 ? '0.5' : '1';

  const isLastStep = currentStep === stepPanels.length - 1;
  nextStepButton.textContent = isLastStep ? 'Salvar' : 'Próximo';

  if (isLastStep) {
    const formData = new FormData(wizardForm);
    const empresa = formData.get('empresa') || 'Não informado';
    const obra = formData.get('obra') || 'Não informado';
    const tipoVistoria = formData.get('tipoVistoria') || 'Não informado';
    const status = formData.get('status') || 'Não informado';

    summaryBox.innerHTML = `
      <strong>Empresa:</strong> ${empresa}<br>
      <strong>Obra:</strong> ${obra}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Vistoria:</strong> ${tipoVistoria}
    `;
  }
}

function openWizard() {
  wizardOverlay.classList.remove('hidden');
  wizardOverlay.setAttribute('aria-hidden', 'false');
}

function closeWizard() {
  wizardOverlay.classList.add('hidden');
  wizardOverlay.setAttribute('aria-hidden', 'true');
  currentStep = 0;
  updateWizardUI();
}

document.querySelector('[data-open-wizard]').addEventListener('click', openWizard);
closeWizardButton.addEventListener('click', closeWizard);

wizardOverlay.addEventListener('click', (event) => {
  if (event.target === wizardOverlay) {
    closeWizard();
  }
});

prevStepButton.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep -= 1;
    updateWizardUI();
  }
});

nextStepButton.addEventListener('click', () => {
  if (currentStep < stepPanels.length - 1) {
    currentStep += 1;
    updateWizardUI();
    return;
  }

  const formData = new FormData(wizardForm);
  const payload = Object.fromEntries(formData.entries());

  saveDocument('cadastros', payload)
    .then(() => {
      console.log('Dados do wizard salvos:', payload);
      alert('Cadastro enviado com sucesso!');
      closeWizard();
    })
    .catch((error) => {
      console.error('Erro ao salvar cadastro:', error);
      alert('Cadastro em modo local. Firebase ainda não foi configurado.');
      closeWizard();
    });
});


// Inicializar dados para compartilhamento
window.loadedData = {
  relatorios: [],
  vistorias: [],
  projetos: [],
  pendencias: [],
  reformas: [],
  orcamentos: []
};

// Função para atualizar dados carregados
function updateLoadedData() {
  try {
    window.loadedData.relatorios = JSON.parse(localStorage.getItem('relatorios') || '[]');
    window.loadedData.vistorias = JSON.parse(localStorage.getItem('vistorias') || '[]');
    window.loadedData.projetos = JSON.parse(localStorage.getItem('projetos') || '[]');
    window.loadedData.pendencias = JSON.parse(localStorage.getItem('pendencias') || '[]');
    window.loadedData.reformas = JSON.parse(localStorage.getItem('reformas') || '[]');
    window.loadedData.orcamentos = JSON.parse(localStorage.getItem('orcamentos') || '[]');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

export async function loadInitialData(user) {
  console.log("Carregando dados iniciais para o usuário:", user.uid);
  if (modulesInitialized) return;

  // Importa e inicializa os módulos dinamicamente APENAS UMA VEZ.
  const { initCadastroModule } = await import('./modules/cadastro.js');
  const { initVistoriasModule } = await import('./modules/vistorias.js');
  const { initRelatoriosModule } = await import('./modules/relatorios.js');
  const { initOrcamentosModule } = await import('./modules/orcamentos.js');
  const { initReformasModule } = await import('./modules/reformas.js');
  const { initProjetosModule } = await import('./modules/projetos.js');
  const { initPessoasModule } = await import('./modules/pessoas.js');
  const { initDashboardsModule } = await import('./modules/dashboards.js');
  const { initCronogramaModule, initCalendarioModule } = await import('./modules/cronograma.js');
  const { initChecklistModule } = await import('./modules/checklist.js');
  const { initUsuariosModule } = await import('./modules/usuarios.js');
  const { initPendenciasModule } = await import('./modules/pendencias.js');
  const { initEmpreendimentosModule } = await import('./modules/empreendimentos.js');
  const { initManagerDashboardModule } = await import('./modules/managerDashboard.js');

  initCadastroModule();
  initVistoriasModule();
  initRelatoriosModule();
  initOrcamentosModule();
  initReformasModule();
  initProjetosModule();
  initPessoasModule();
  initDashboardsModule();
  initCronogramaModule();
  initCalendarioModule();
  initChecklistModule();
  initUsuariosModule();
  initPendenciasModule();
  initEmpreendimentosModule();
  initManagerDashboardModule();

  modulesInitialized = true;
  console.log("Todos os módulos foram inicializados.");
}

function main() {
  initFirebase();
  setupAuth();
  setupSyncStatus();
  activateView('dashboard');
  updateWizardUI();

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker failed:', error);
      });
    });
  }
}

main();
