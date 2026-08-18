import { loadCollection, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';
import { populateCompanySelect } from './cadastro.js';

let allEmpreendimentos = []; // Armazena os empreendimentos carregados
let currentStep = 1;
let empreendimentoData = {};

const ambientesPadrao = [
  "Sala de Estar/Jantar", "Varanda", "Cozinha", "Área de Serviço", 
  "Banheiro Social", "Suíte", "Banheiro Suíte", "Quarto", "Lavabo", "Escritório"
];

function renderStep() {
  document.getElementById('step1').classList.toggle('hidden', currentStep !== 1);
  document.getElementById('step2').classList.toggle('hidden', currentStep !== 2);
  document.getElementById('step3').classList.toggle('hidden', currentStep !== 3);

  const nextBtn = document.getElementById('empreendimentoFormNextBtn');
  nextBtn.textContent = currentStep === 3 ? 'Salvar Empreendimento' : 'Próximo';
}

function renderStep2() {
  const container = document.getElementById('step2');
  container.innerHTML = `
    <h4>Etapa 2: Estrutura de Pavimentos</h4>
    <div id="pavimentosList"></div>
    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
      <select id="newPavimentoTipo">
        <option value="Garagem">Garagem</option>
        <option value="Térreo">Térreo</option>
        <option value="Pavimento Tipo">Pavimento Tipo</option>
        <option value="Cobertura">Cobertura</option>
      </select>
      <input type="number" id="newPavimentoQtd" value="1" min="1" style="width: 80px;" />
      <button type="button" id="addPavimentoBtn" class="secondary-btn">Adicionar</button>
    </div>
  `;

  document.getElementById('addPavimentoBtn').addEventListener('click', () => {
    const tipo = document.getElementById('newPavimentoTipo').value;
    const quantidade = parseInt(document.getElementById('newPavimentoQtd').value, 10);
    empreendimentoData.pavimentos = empreendimentoData.pavimentos || [];
    for(let i = 0; i < quantidade; i++) {
        empreendimentoData.pavimentos.push({ tipo, unidades: 0 });
    }
    updatePavimentosList();
  });
}

function updatePavimentosList() {
    const list = document.getElementById('pavimentosList');
    list.innerHTML = (empreendimentoData.pavimentos || []).map((p, i) => `
        <div class="list-item-form">
            <span>${p.tipo}</span>
            <label>Unidades: <input type="number" value="${p.unidades}" min="0" data-pavimento-index="${i}" /></label>
        </div>
    `).join('');

    list.querySelectorAll('input[data-pavimento-index]').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.pavimentoIndex;
            empreendimentoData.pavimentos[index].unidades = parseInt(e.target.value, 10);
        });
    });
}

function renderStep3() {
    const container = document.getElementById('step3');
    const pavimentosTipo = empreendimentoData.pavimentos.filter(p => p.tipo === 'Pavimento Tipo');
    if (pavimentosTipo.length === 0 || pavimentosTipo[0].unidades === 0) {
        container.innerHTML = `<h4>Etapa 3: Tipologia de Unidades</h4><p class="empty-state">Nenhum 'Pavimento Tipo' com unidades foi adicionado. Você pode salvar o empreendimento agora ou voltar para adicionar.</p>`;
        return;
    }

    container.innerHTML = `
        <h4>Etapa 3: Tipologia de Unidades (para Pavimento Tipo)</h4>
        <div id="unidadesTipoList">
            <div class="list-item-form">
                <input type="text" placeholder="Ex: 2 Quartos com Suíte" class="newUnidadeTipoNome" />
                <button type="button" class="addUnidadeTipoBtn secondary-btn">Adicionar Tipo</button>
            </div>
        </div>
    `;

    document.querySelector('.addUnidadeTipoBtn').addEventListener('click', (e) => {
        const input = e.target.previousElementSibling;
        const nome = input.value.trim();
        if (!nome) return;
        
        empreendimentoData.tipologias = empreendimentoData.tipologias || [];
        empreendimentoData.tipologias.push({ nome, ambientes: [] });
        input.value = '';
        updateUnidadesTipoList();
    });
    updateUnidadesTipoList();
}

function updateUnidadesTipoList() {
    const list = document.getElementById('unidadesTipoList');
    const existingItems = list.querySelectorAll('.unidade-tipo-item');
    existingItems.forEach(item => item.remove());

    (empreendimentoData.tipologias || []).forEach((tipologia, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'unidade-tipo-item module-panel';
        itemDiv.innerHTML = `
            <h5>${tipologia.nome}</h5>
            <p>Selecione os ambientes:</p>
            <div class="checkbox-grid">
                ${ambientesPadrao.map(ambiente => `
                    <label class="checkbox-label">
                        <input type="checkbox" value="${ambiente}" data-tipologia-index="${index}" ${tipologia.ambientes.includes(ambiente) ? 'checked' : ''}>
                        <span>${ambiente}</span>
                    </label>
                `).join('')}
            </div>
        `;
        list.appendChild(itemDiv);
    });

    list.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = e.target.dataset.tipologiaIndex;
            const ambiente = e.target.value;
            const tipologia = empreendimentoData.tipologias[index];
            if (e.target.checked) {
                if (!tipologia.ambientes.includes(ambiente)) {
                    tipologia.ambientes.push(ambiente);
                }
            } else {
                tipologia.ambientes = tipologia.ambientes.filter(a => a !== ambiente);
            }
        });
    });
}

async function handleFormSubmit() {
    // Coleta final dos dados
    empreendimentoData.name = document.querySelector('[name="empreendimentoName"]').value;
    empreendimentoData.companyId = document.querySelector('[name="companyId"]').value;

    try {
        await saveDocument('empreendimentos', empreendimentoData);
        showToast('Empreendimento salvo com sucesso!', 'success');
        document.getElementById('empreendimentoForm').reset();
        document.getElementById('empreendimentoFormContainer').classList.add('hidden');
        loadAndRenderEmpreendimentos();
    } catch (error) {
        showToast('Erro ao salvar empreendimento.', 'error');
        console.error(error);
    }
}

/**
 * Popula um elemento <select> com os empreendimentos carregados.
 * @param {Array<Object>} empreendimentos - A lista de empreendimentos.
 * @param {string} selectElementId - O ID do elemento <select> a ser populado.
 */
export function populateEmpreendimentoSelect(empreendimentos, selectElementId) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;

  // Limpa opções existentes, exceto a primeira ("Selecione")
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  empreendimentos.forEach(empreendimento => {
    const option = document.createElement('option');
    option.value = empreendimento.id; // Usar o ID do documento como valor
    option.textContent = empreendimento.name;
    selectElement.appendChild(option);
  });
}

/**
 * Gera uma lista de nomes de unidades com base na estrutura de um empreendimento.
 * @param {object} empreendimento - O objeto do empreendimento.
 * @returns {string[]} Uma lista de nomes de unidades.
 */
function generateUnitList(empreendimento) {
  if (!empreendimento || !empreendimento.pavimentos) return [];

  const unidades = [];
  let pavimentoTipoCounter = 0;

  empreendimento.pavimentos.forEach((pavimento, index) => {
    if (pavimento.unidades > 0) {
      if (pavimento.tipo === 'Pavimento Tipo') {
        pavimentoTipoCounter++;
        for (let i = 1; i <= pavimento.unidades; i++) {
          // Formato: 101, 102... 201, 202...
          const unidadeNumero = String(i).padStart(2, '0');
          unidades.push(`Apto ${pavimentoTipoCounter}${unidadeNumero}`);
        }
      } else if (pavimento.tipo === 'Cobertura') {
         for (let i = 1; i <= pavimento.unidades; i++) {
          unidades.push(`Cobertura ${i}`);
        }
      } else {
        // Para outros tipos como Térreo, Garagem com unidades (lojas, etc.)
        for (let i = 1; i <= pavimento.unidades; i++) {
          unidades.push(`${pavimento.tipo} - Unidade ${i}`);
        }
      }
    }
  });
  return unidades;
}

async function loadAndRenderEmpreendimentos() {
    const listElement = document.getElementById('empreendimentosList');
    try {
        const empreendimentos = await loadCollection('empreendimentos');
        if (empreendimentos.length > 0) {
            listElement.innerHTML = empreendimentos.map(e => `<li><span>${e.name}</span><strong>Ativo</strong></li>`).join('');
        } else {
            listElement.innerHTML = '<li class="empty-state">Nenhum empreendimento cadastrado.</li>';
        }
        // Armazena os dados carregados para uso posterior
        allEmpreendimentos = empreendimentos;

        // Popula o select no formulário de Reformas
        populateEmpreendimentoSelect(empreendimentos, 'reformaFormEmpreendimentoSelect');
    } catch (error) {
        console.error("Erro ao carregar empreendimentos:", error);
    }
}

export function initEmpreendimentosModule() {
    const reformaForm = document.getElementById('reformaForm');
    const showBtn = document.getElementById('showEmpreendimentoFormBtn');
    const closeBtn = document.getElementById('closeEmpreendimentoFormBtn');
    const formContainer = document.getElementById('empreendimentoFormContainer');
    const nextBtn = document.getElementById('empreendimentoFormNextBtn');

    showBtn.addEventListener('click', () => {
        formContainer.classList.remove('hidden');
        currentStep = 1;
        empreendimentoData = {};
        renderStep();
    });

    closeBtn.addEventListener('click', () => formContainer.classList.add('hidden'));

    nextBtn.addEventListener('click', () => {
        if (currentStep < 3) {
            currentStep++;
            if (currentStep === 2) renderStep2();
            if (currentStep === 3) renderStep3();
            renderStep();
        } else {
            handleFormSubmit();
        }
    });

    // Lógica de cascata para o formulário de reformas
    if (reformaForm) {
        const empreendimentoSelect = document.getElementById('reformaFormEmpreendimentoSelect');
        const unidadeSelect = document.getElementById('reformaFormUnidadeSelect');

        empreendimentoSelect.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            // Limpa e desabilita o select de unidades
            unidadeSelect.innerHTML = '<option value="">Selecione a unidade</option>';
            unidadeSelect.disabled = true;

            if (!selectedId) return;

            const empreendimento = allEmpreendimentos.find(emp => emp.id === selectedId);
            if (empreendimento) {
                const unidades = generateUnitList(empreendimento);
                unidades.forEach(unidade => {
                    const option = new Option(unidade, unidade);
                    unidadeSelect.add(option);
                });
                unidadeSelect.disabled = false;
            }
        });
    }

    // Carrega empresas no select e a lista de empreendimentos
    loadCollection('companies').then(companies => populateCompanySelect(companies, 'empreendimentoCompanySelect'));
    loadAndRenderEmpreendimentos();
}