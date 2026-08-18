import { loadCollection } from '../firebase-init.js';
import { populateEmpreendimentoSelect } from './empreendimentos.js';

// --- CONFIGURAÇÃO DA API OPENWEATHERMAP ---
const OPENWEATHER_API_KEY = 'SUA_CHAVE_AQUI'; // <-- SUBSTITUA PELA SUA CHAVE DE API
const DEFAULT_CITY_COUNTRY = 'São Paulo, BR'; // Cidade padrão para a previsão

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

let allData = {
  reformas: [],
  pendencias: [],
  usuarios: [],
  empreendimentos: [],
  weather: null, // Novo campo para dados do tempo
};

const disciplineLabels = {
  fundacao: 'Fundação/Estrutura',
  hidraulica: 'Hidráulica',
  eletrica: 'Elétrica',
  revestimento: 'Revestimento',
  pintura: 'Pintura',
  acabamento: 'Acabamento',
  outro: 'Outro'
};

/**
 * Carrega todos os dados necessários de uma vez.
 */
async function loadDashboardData() {
  const [reformas, pendencias, usuarios, empreendimentos, orcamentos, weatherData] = await Promise.all([
    loadCollection('reformas'),
    loadCollection('pendencias'),
    loadCollection('users'), // Supondo que a coleção de usuários se chame 'users'
    loadCollection('empreendimentos'),
    loadCollection('orcamentos'),
    fetchWeatherData(document.getElementById('weatherCityInput')?.value || DEFAULT_CITY_COUNTRY), // Busca dados do tempo
  ]);

  allData = { reformas, pendencias, usuarios, empreendimentos, orcamentos, weather: weatherData };
  return allData;
}

/**
 * Busca dados de previsão do tempo da OpenWeatherMap API.
 * @param {string} cityCountry - Cidade e país (ex: "São Paulo, BR").
 * @returns {object|null} Dados do tempo ou null em caso de erro.
 */
async function fetchWeatherData(cityCountry) {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'SUA_CHAVE_AQUI') {
    console.warn("Chave da API OpenWeatherMap não configurada. Previsão do tempo desativada.");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityCountry}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`
    );
    if (!response.ok) {
      throw new Error(`Erro ao buscar previsão: ${response.statusText}`);
    }
    const data = await response.json();

    // Para simplificar, vamos pegar apenas os dados atuais.
    // Para previsão de 5 dias, a API é diferente (forecast).
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      city: data.name,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do tempo:", error);
    showToast(`Não foi possível carregar a previsão do tempo para ${cityCountry}.`, 'error');
    return null;
  }
}

/**
 * Popula os filtros do dashboard com base nos dados carregados.
 */
function populateFilters() {
  const { usuarios } = allData;

  const serviceFilter = document.getElementById('managerDashboardServiceFilter');
  const personFilter = document.getElementById('managerDashboardPersonFilter');

  // Popula filtro de serviços/disciplinas
  Object.entries(disciplineLabels).forEach(([key, label]) => {
    serviceFilter.add(new Option(label, key));
  });

  // Popula filtro de pessoas
  (usuarios || []).forEach(user => {
    // Supondo que o documento do usuário tenha os campos 'uid' e 'name'
    personFilter.add(new Option(user.name, user.uid));
  });

  // O filtro de empreendimentos já é populado pelo módulo de empreendimentos
  populateEmpreendimentoSelect(allData.empreendimentos, 'managerDashboardEmpreendimentoFilter');
}

/**
 * Filtra os dados e renderiza o conteúdo do dashboard.
 */
function renderDashboard() {
  const { reformas, pendencias, orcamentos, usuarios } = allData;
  const content = document.getElementById('managerDashboardContent');

  // Obter valores dos filtros
  const empreendimentoId = document.getElementById('managerDashboardEmpreendimentoFilter').value;
  const service = document.getElementById('managerDashboardServiceFilter').value;
  const personId = document.getElementById('managerDashboardPersonFilter').value;

  // --- Lógica de Filtragem ---
  let filteredReformas = reformas;
  if (empreendimentoId !== 'all') {
    filteredReformas = filteredReformas.filter(r => r.empreendimentoId === empreendimentoId);
  }
  if (personId !== 'all') {
    // Filtra reformas pelo ID do responsável
    filteredReformas = filteredReformas.filter(r => r.responsavelId === personId);
  }
  if (service !== 'all') {
    // Filtra reformas que contenham pelo menos um item da disciplina selecionada.
    const serviceLabel = disciplineLabels[service];
    filteredReformas = filteredReformas.filter(r => 
      r.checklistGerado?.some(item => item.disciplina === serviceLabel)
    );
  }

  let filteredPendencias = pendencias;
  if (empreendimentoId !== 'all') {
    // Assumindo que pendencias tem um campo 'empreendimentoId'
    // Vamos adicionar uma verificação para o campo 'obra' também para compatibilidade
    const empreendimentoName = allData.empreendimentos.find(e => e.id === empreendimentoId)?.name;
    filteredPendencias = filteredPendencias.filter(p => p.empreendimentoId === empreendimentoId || p.obra === empreendimentoName);
  }
  if (personId !== 'all') {
    // Filtra pendências pelo ID do responsável
    filteredPendencias = filteredPendencias.filter(p => p.responsavelId === personId);
  }
  if (service !== 'all') {
    // Filtra pendências pela disciplina
    filteredPendencias = filteredPendencias.filter(p => p.disciplina === service);
  }

  // --- Cálculo de KPIs ---
  const totalReformas = filteredReformas.length;
  const reformasConcluidas = filteredReformas.filter(r => r.status === 'ok').length;
  const percentualConclusao = totalReformas > 0 ? Math.round((reformasConcluidas / totalReformas) * 100) : 0;

  const totalPendencias = filteredPendencias.length;
  const pendenciasAbertas = filteredPendencias.filter(p => p.status === 'aberta').length;

  // --- Cálculo de Custo Previsto por Disciplina ---
  const costByService = {};
  Object.keys(disciplineLabels).forEach(key => {
    costByService[key] = 0;
  });

  let filteredOrcamentos = orcamentos;
  if (empreendimentoId !== 'all') {
    filteredOrcamentos = filteredOrcamentos.filter(o => o.empreendimentoId === empreendimentoId && o.status === 'aprovado');
  } else {
    filteredOrcamentos = filteredOrcamentos.filter(o => o.status === 'aprovado');
  }

  filteredOrcamentos.forEach(orcamento => {
    (orcamento.itens || []).forEach(item => {
      if (item.disciplina && costByService.hasOwnProperty(item.disciplina)) {
        costByService[item.disciplina] += item.subtotal || 0;
      }
    });
  });

  // --- Cálculo de Progresso por Serviço ---
  const progressByService = {};
  Object.keys(disciplineLabels).forEach(key => {
    progressByService[key] = { total: 0, concluido: 0 };
  });

  filteredReformas.forEach(reforma => {
    if (reforma.checklistGerado && Array.isArray(reforma.checklistGerado)) {
      reforma.checklistGerado.forEach(item => {
        // Encontra a chave da disciplina (ex: 'hidraulica') pelo label (ex: 'Hidráulica')
        const disciplineKey = Object.keys(disciplineLabels).find(
          key => disciplineLabels[key] === item.disciplina
        );

        if (disciplineKey && progressByService[disciplineKey]) {
          progressByService[disciplineKey].total++;
          // Assumimos que o status 'conforme' ou 'ok' significa concluído
          if (item.status === 'conforme' || item.status === 'ok') {
            progressByService[disciplineKey].concluido++;
          }
        }
      });
    }
  });

  // --- Cálculo de Carga de Trabalho por Responsável ---
  const workloadByUser = {};
  (usuarios || []).forEach(user => {
    // Inicializa o contador para cada usuário usando o UID como chave
    workloadByUser[user.uid] = { name: user.name, count: 0 };
  });

  // Conta reformas ativas (não 'ok') para cada responsável
  filteredReformas.forEach(reforma => {
    if (reforma.responsavelId && workloadByUser[reforma.responsavelId] && reforma.status !== 'ok') {
      workloadByUser[reforma.responsavelId].count++;
    }
  });

  // Conta pendências ativas (não 'concluida') para cada responsável
  filteredPendencias.forEach(pendencia => {
    if (pendencia.responsavelId && workloadByUser[pendencia.responsavelId] && pendencia.status !== 'concluida') {
      workloadByUser[pendencia.responsavelId].count++;
    }
  });

  // Converte o objeto em um array, filtra usuários sem tarefas e ordena
  const workloadData = Object.values(workloadByUser)
    .filter(user => user.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxWorkload = Math.max(...workloadData.map(u => u.count), 0);

  const serviceChartHTML = Object.entries(progressByService).map(([key, data]) => {
    const percent = data.total > 0 ? Math.round((data.concluido / data.total) * 100) : 0;
    return `
      <div class="bar-chart-item">
        <span class="bar-label">${disciplineLabels[key]}</span>
        <div class="bar-wrapper">
          <div class="bar-fill" style="width: ${percent}%;"></div>
        </div>
        <span class="bar-value">${percent}%</span>
      </div>
    `;
  }).join('');

  const costChartHTML = Object.entries(costByService).map(([key, value]) => {
    // Para normalizar as barras, encontramos o maior valor
    const maxValue = Math.max(...Object.values(costByService));
    const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return `
      <div class="bar-chart-item">
        <span class="bar-label">${disciplineLabels[key]}</span>
        <div class="bar-wrapper"><div class="bar-fill" style="width: ${percent}%; background: var(--secondary);"></div></div>
        <span class="bar-value">${formatCurrency(value)}</span>
      </div>
    `;
  }).join('');

  const workloadChartHTML = workloadData.map(user => {
    const percent = maxWorkload > 0 ? (user.count / maxWorkload) * 100 : 0;
    return `
      <div class="bar-chart-item">
        <span class="bar-label">${user.name}</span>
        <div class="bar-wrapper">
          <div class="bar-fill" style="width: ${percent}%; background: var(--primary);"></div>
        </div>
        <span class="bar-value">${user.count} tarefas</span>
      </div>
    `;
  }).join('');
  // --- Renderização ---
  content.innerHTML = `
    <div class="stat-card accent">
      <span>Progresso Geral</span>
      <strong>${percentualConclusao}%</strong>
    </div>
    <div class="stat-card">
      <span>Pendências Abertas</span>
      <strong>${pendenciasAbertas}</strong>
    </div>
    <div class="stat-card">
      <span>Empreendimentos</span>
      <strong>${empreendimentoId === 'all' ? allData.empreendimentos.length : 1}</strong>
      <small>${empreendimentoId === 'all' ? 'sendo monitorados' : 'em foco'}</small>
    </div>
    
    <div class="module-panel full-width">
      <h3>Previsão do Tempo</h3>
      <div id="weatherDisplay" class="weather-display">
        ${allData.weather ? `
          <div class="weather-current">
            <img src="${allData.weather.icon}" alt="${allData.weather.description}" class="weather-icon" />
            <div>
              <span class="weather-temp">${allData.weather.temp}°C</span>
              <p class="weather-description">${allData.weather.description}</p>
              <small>${allData.weather.city}</small>
            </div>
          </div>
          <!-- Poderíamos adicionar um forecast de 5 dias aqui se usarmos a API de forecast -->
        ` : `
          <p class="empty-state">Previsão do tempo não disponível. Verifique sua chave de API ou a cidade.</p>
        `}
      </div>
    </div>

    <div class="module-panel full-width">
      <h3>Progresso por Serviço</h3>
      <div class="bar-chart-container">
        ${serviceChartHTML.length > 0 ? serviceChartHTML : '<p class="empty-state">Nenhum dado de serviço para exibir.</p>'}
      </div>
    </div>
    <div class="module-panel full-width">
      <h3>Custo Previsto por Disciplina (Orçamentos Aprovados)</h3>
      <div class="bar-chart-container">
        ${costChartHTML.length > 0 ? costChartHTML : '<p class="empty-state">Nenhum orçamento aprovado para exibir.</p>'}
      </div>
    </div>
    <div class="module-panel full-width">
      <h3>Carga de Trabalho por Responsável (Tarefas Ativas)</h3>
      <div class="bar-chart-container">
        ${workloadChartHTML.length > 0 ? workloadChartHTML : '<p class="empty-state">Nenhuma tarefa ativa para exibir.</p>'}
      </div>
    </div>
  `;
}

/**
 * Inicializa o módulo do Dashboard Gerencial.
 */
export function initManagerDashboardModule() {
  const view = document.getElementById('managerDashboardView');
  if (!view) return;

  const refreshButton = document.getElementById('refreshManagerDashboard');
  const filters = view.querySelectorAll('select');

  const initialize = async () => {
    // Adiciona listener para o input da cidade do tempo
    const weatherCityInput = document.getElementById('weatherCityInput');
    if (weatherCityInput) {
      weatherCityInput.removeEventListener('change', initialize); // Evita duplicidade
      weatherCityInput.addEventListener('change', initialize);
    }

    await loadDashboardData();
    populateFilters();
    renderDashboard();
  };

  // Adiciona listeners para os filtros
  // O filtro de cidade do tempo já é tratado acima
  filters.forEach(filter => filter.addEventListener('change', renderDashboard));
  refreshButton.addEventListener('click', initialize);

  // Observador para carregar dados apenas quando a view estiver ativa
  const observer = new MutationObserver((mutations) => {
    if (mutations[0].target.classList.contains('active')) {
      initialize();
    }
  });

  observer.observe(view, { attributes: true });
}