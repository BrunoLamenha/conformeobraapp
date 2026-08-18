import { loadCollection, saveDocument } from '../firebase-init.js';
import { showToast } from '../utils/toast.js'; // Caminho padronizado

// Variáveis globais para o módulo
/**
 * Renderiza a lista de projetos.
 * @param {Array<Object>} projetos - Lista de projetos.
 */
function renderProjetos(projetos) {
  const listElement = document.getElementById('projetosList');
  if (!listElement) return;

  if (!projetos || projetos.length === 0) {
    listElement.innerHTML = '<li class="empty-state">Nenhum projeto cadastrado.</li>';
    return;
  }

  listElement.innerHTML = projetos.map(projeto => `
    <li class="projeto-card">
      <div class="projeto-header">
        <div>
          <strong>${projeto.nome}</strong>
          <small>${projeto.obra}</small>
        </div>
        <span class="status-badge ${projeto.status}">${projeto.status}</span>
      </div>
      <p>Responsável: ${projeto.responsavel}</p>
      <div class="projeto-actions">
        <button class="secondary-btn" data-view-pdf="${projeto.pdfUrl}">Ver PDF</button>
        <button class="secondary-btn" data-edit-projeto="${projeto.id}">Editar</button>
      </div>
    </li>
  `).join('');
}

/**
 * Inicializa o módulo de Projetos.
 */
export function initProjetosModule() {
  const form = document.getElementById('projetoForm');
  const projetoAnaliseDiv = document.getElementById('projetoAnalise');

  if (!form) return;

  const refreshProjetos = () => {
    loadCollection('projetos').then(renderProjetos).catch(() => renderProjetos([]));
  };

  // Listener para o formulário de projeto
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const payload = {
      nome: formData.get('nome'),
      obra: formData.get('obra'),
      responsavel: formData.get('responsavel'),
      status: formData.get('status'),
      // Adiciona o resultado do OCR ao payload se houver
      // ocrResult: currentProjectOcrResult, // Removido
      // pdfUrl: 'URL do PDF salvo no Cloud Storage' // Isso viria da Cloud Function
    };

    try {
      await saveDocument('projetos', payload);
      showToast('Projeto salvo com sucesso!', 'success');
      form.reset();
      // projetoAnaliseDiv.innerHTML = ''; // Limpa a área de análise
      // currentProjectOcrResult = null; // Removido
      refreshProjetos();
    } catch (error) {
      showToast('Erro ao salvar projeto.', 'error');
      console.error(error);
    }
  });

  refreshProjetos();
}