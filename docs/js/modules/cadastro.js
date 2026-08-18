import { loadCollection, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';

/**
 * Renderiza a lista de empresas na view de Cadastros.
 * @param {Array<Object>} companies - A lista de empresas do Firestore.
 */
function renderCompanyList(companies) {
  const listElement = document.getElementById('companyList');
  if (!listElement) return;

  if (!companies || companies.length === 0) {
    listElement.innerHTML = '<li class="empty-state">Nenhuma empresa cadastrada.</li>';
    return;
  }

  listElement.innerHTML = companies
    .map(company => `<li><span>${company.name}</span></li>`)
    .join('');
}

/**
 * Popula um elemento <select> com as empresas carregadas do Firestore.
 * @param {Array<Object>} companies - A lista de empresas.
 * @param {string} selectElementId - O ID do elemento <select> a ser populado.
 */
export function populateCompanySelect(companies, selectElementId) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;

  // Limpa opções existentes, exceto a primeira ("Selecione")
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  companies.forEach(company => {
    const option = document.createElement('option');
    option.value = company.id; // Usar o ID do documento como valor
    option.textContent = company.name;
    selectElement.appendChild(option);
  });
}

/**
 * Inicializa o módulo de Cadastros, incluindo a gestão de empresas.
 */
export function initCadastroModule() {
  const companyForm = document.getElementById('companyForm');

  // Função para carregar empresas e popular UI
  const loadAndRenderCompanies = async () => {
    try {
      const companies = await loadCollection('companies', { ignoreCompanyFilter: true });
      renderCompanyList(companies);
      // Popula os selects em diferentes módulos
      populateCompanySelect(companies, 'userFormCompanySelect');
      populateCompanySelect(companies, 'pendenciaFormObraSelect');
      // Para o filtro, mantemos a opção "Todas" que já existe no HTML
      const filterSelect = document.getElementById('pendenciaFilterObra');
      if(filterSelect) populateCompanySelect(companies, 'pendenciaFilterObra');
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      showToast("Não foi possível carregar as empresas.", "error");
    }
  };

  // Adiciona o listener para o formulário de novas empresas
  if (companyForm) {
    companyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const companyName = companyForm.querySelector('input[name="companyName"]').value.trim();
      if (!companyName) return;

      try {
        await saveDocument('companies', { name: companyName });
        showToast('Empresa adicionada com sucesso!', 'success');
        companyForm.reset();
        loadAndRenderCompanies(); // Recarrega a lista
      } catch (error) {
        showToast('Erro ao adicionar empresa.', 'error');
      }
    });
  }

  // Carrega os dados iniciais ao inicializar o módulo
  loadAndRenderCompanies();
}