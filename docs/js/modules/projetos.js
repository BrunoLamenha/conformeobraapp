import { loadCollection, saveDocument, getFunctions } from '../firebase-init.js';
import { showToast } from '../utils/toast.js';

// Variáveis globais para o módulo
let currentProjectOcrResult = null;

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
      ${projeto.ocrResult ? `
        <div class="projeto-quantitativos">
          <strong>Quantitativos (OCR):</strong>
          <ul>
            ${projeto.ocrResult.map(item => `<li>${item.item}: ${item.quantidade}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
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
  const projetoFile = document.getElementById('projetoFile');
  const projetoAnaliseDiv = document.getElementById('projetoAnalise');

  if (!form) return;

  const refreshProjetos = () => {
    loadCollection('projetos').then(renderProjetos).catch(() => renderProjetos([]));
  };

  // Listener para o upload do arquivo PDF
  if (projetoFile) {
    projetoFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        showToast('Por favor, selecione um arquivo PDF ou imagem.', 'error');
        e.target.value = ''; // Limpa o input
        return;
      }

      projetoAnaliseDiv.innerHTML = '<p class="loading">Analisando documento com OCR...</p>';
      currentProjectOcrResult = null; // Limpa resultados anteriores

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64File = reader.result.split(',')[1]; // Pega apenas a parte Base64
          const functions = getFunctions();
          if (!functions) {
            showToast('Cloud Functions não disponíveis. OCR não pode ser executado.', 'error');
            projetoAnaliseDiv.innerHTML = '<p class="error">OCR indisponível (Firebase Functions).</p>';
            return;
          }

          const callOcrFunction = functions.httpsCallable('analyzeDocumentWithOcr');
          const result = await callOcrFunction({ file: base64File, fileName: file.name, fileType: file.type });

          if (result.data && result.data.quantities) {
            currentProjectOcrResult = result.data.quantities;
            projetoAnaliseDiv.innerHTML = `
              <div class="analise-resultado">
                <strong>Análise de Quantitativos (OCR):</strong>
                <ul>
                  ${currentProjectOcrResult.map(item => `<li>${item.item}: ${item.quantidade}</li>`).join('')}
                </ul>
              </div>
            `;
            showToast('Documento analisado com sucesso!', 'success');
          } else {
            projetoAnaliseDiv.innerHTML = '<p class="empty-state">Nenhum quantitativo detectado ou erro na análise.</p>';
            showToast('Nenhum quantitativo detectado.', 'warning');
          }
        };
        reader.onerror = (error) => {
          console.error('Erro ao ler arquivo:', error);
          projetoAnaliseDiv.innerHTML = '<p class="error">Erro ao ler o arquivo.</p>';
          showToast('Erro ao ler o arquivo.', 'error');
        };
      } catch (error) {
        console.error('Erro ao chamar Cloud Function para OCR:', error);
        projetoAnaliseDiv.innerHTML = '<p class="error">Erro na análise do documento.</p>';
        showToast('Erro na análise do documento.', 'error');
      }
    });
  }

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
      ocrResult: currentProjectOcrResult,
      // pdfUrl: 'URL do PDF salvo no Cloud Storage' // Isso viria da Cloud Function
    };

    try {
      await saveDocument('projetos', payload);
      showToast('Projeto salvo com sucesso!', 'success');
      form.reset();
      projetoAnaliseDiv.innerHTML = ''; // Limpa a área de análise
      currentProjectOcrResult = null;
      refreshProjetos();
    } catch (error) {
      showToast('Erro ao salvar projeto.', 'error');
      console.error(error);
    }
  });

  refreshProjetos();
}