import { loadCollection, saveDocument } from '../firebase-init.js';

function generateReformaReport(reformas = [], pendencias = [], vistorias = []) {
  const totalReformas = reformas.length;
  const concluidas = reformas.filter((r) => r.status === 'ok').length;
  const emAndamento = reformas.filter((r) => r.status === 'alerta').length;
  const pendentes = reformas.filter((r) => r.status === 'pendente').length;

  const pendAberta = pendencias.filter((p) => p.status === 'aberta').length;
  const pendEmAndamento = pendencias.filter((p) => p.status === 'em-andamento').length;
  const pendConcluida = pendencias.filter((p) => p.status === 'concluida').length;

  const percentualConclusao = totalReformas > 0 ? Math.round((concluidas / totalReformas) * 100) : 0;

  // Agrupa reformas por obra
  const reformasPorObra = {};
  reformas.forEach((r) => {
    if (!reformasPorObra[r.obra]) {
      reformasPorObra[r.obra] = [];
    }
    reformasPorObra[r.obra].push(r);
  });

  // Agrupa pendências por prioridade
  const pendenciasPorPrioridade = {};
  pendencias.forEach((p) => {
    if (!pendenciasPorPrioridade[p.prioridade || 'media']) {
      pendenciasPorPrioridade[p.prioridade || 'media'] = [];
    }
    pendenciasPorPrioridade[p.prioridade || 'media'].push(p);
  });

  return {
    dataGeracao: new Date().toLocaleString('pt-BR'),
    totalReformas,
    concluidas,
    emAndamento,
    pendentes,
    percentualConclusao,
    pendencias: {
      aberta: pendAberta,
      emAndamento: pendEmAndamento,
      concluida: pendConcluida
    },
    reformasPorObra,
    pendenciasPorPrioridade,
    vistorias: vistorias.length
  };
}

function renderRelatorioVisual(report) {
  const container = document.getElementById('relatorioConteudo');
  if (!container) return;

  const relPorObra = Object.entries(report.reformasPorObra || {})
    .map(
      ([obra, items]) => `
        <div class="relatorio-secao">
          <h4>Obra: ${obra}</h4>
          <ul>
            ${items
              .map((r) => `<li>${r.titulo} - Status: ${r.status} (${r.percentual || 0}% completo)</li>`)
              .join('')}
          </ul>
        </div>
      `
    )
    .join('');

  const relPorPrioridade = Object.entries(report.pendenciasPorPrioridade || {})
    .map(
      ([prioridade, items]) => `
        <div class="relatorio-secao">
          <h4>Prioridade: ${prioridade.toUpperCase()}</h4>
          <ul>
            ${items
              .map((p) => `<li>${p.descricao} (${p.status}) - Prazo: ${p.prazo}</li>`)
              .join('')}
          </ul>
        </div>
      `
    )
    .join('');

  container.innerHTML = `
    <div class="relatorio-header">
      <h2>Relatório Operacional de Conformidade de Obras</h2>
      <p>Gerado em ${report.dataGeracao}</p>
    </div>

    <div class="relatorio-resumo">
      <h3>Resumo Executivo</h3>
      <div class="relatorio-grid">
        <div class="relatorio-card">
          <strong>${report.totalReformas}</strong>
          <small>Reformas registradas</small>
        </div>
        <div class="relatorio-card">
          <strong>${report.concluidas}</strong>
          <small>Reformas concluídas</small>
        </div>
        <div class="relatorio-card">
          <strong>${report.emAndamento}</strong>
          <small>Reformas em andamento</small>
        </div>
        <div class="relatorio-card">
          <strong>${report.pendentes}</strong>
          <small>Reformas pendentes</small>
        </div>
        <div class="relatorio-card highlight">
          <strong>${report.percentualConclusao}%</strong>
          <small>Percentual de conclusão</small>
        </div>
        <div class="relatorio-card">
          <strong>${report.vistorias}</strong>
          <small>Vistorias realizadas</small>
        </div>
      </div>
      <div class="relatorio-progressbar">
        <div class="progress-bar" style="width: ${report.percentualConclusao}%"></div>
      </div>
    </div>

    <div class="relatorio-pendencias">
      <h3>Status de Pendências</h3>
      <div class="relatorio-grid">
        <div class="relatorio-card">
          <strong>${report.pendencias.aberta}</strong>
          <small>Abertas</small>
        </div>
        <div class="relatorio-card">
          <strong>${report.pendencias.emAndamento}</strong>
          <small>Em andamento</small>
        </div>
        <div class="relatorio-card">
          <strong>${report.pendencias.concluida}</strong>
          <small>Concluídas</small>
        </div>
      </div>
    </div>

    <div class="relatorio-detalhes">
      <h3>Detalhamento por Obra</h3>
      ${relPorObra || '<p class="empty-state">Nenhuma reforma registrada</p>'}
    </div>

    <div class="relatorio-detalhes">
      <h3>Detalhamento de Pendências por Prioridade</h3>
      ${relPorPrioridade || '<p class="empty-state">Nenhuma pendência registrada</p>'}
    </div>
  `;
}

function exportRelatorioPDF(report) {
  // Gera um HTML imprimível que pode ser salvo como PDF via navegador
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Relatório de Obras</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h2 { color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; }
        h3 { color: #2c5aa0; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .resumo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
        .card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
        .card strong { font-size: 20px; display: block; }
        .card small { color: #666; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      <h2>Relatório Operacional de Conformidade de Obras</h2>
      <p>Gerado em ${report.dataGeracao}</p>

      <h3>Resumo Executivo</h3>
      <div class="resumo-grid">
        <div class="card">
          <strong>${report.totalReformas}</strong>
          <small>Reformas registradas</small>
        </div>
        <div class="card">
          <strong>${report.concluidas}</strong>
          <small>Reformas concluídas</small>
        </div>
        <div class="card">
          <strong>${report.percentualConclusao}%</strong>
          <small>Conclusão geral</small>
        </div>
      </div>

      <h3>Status de Pendências</h3>
      <table>
        <tr>
          <th>Status</th>
          <th>Quantidade</th>
        </tr>
        <tr>
          <td>Abertas</td>
          <td>${report.pendencias.aberta}</td>
        </tr>
        <tr>
          <td>Em andamento</td>
          <td>${report.pendencias.emAndamento}</td>
        </tr>
        <tr>
          <td>Concluídas</td>
          <td>${report.pendencias.concluida}</td>
        </tr>
      </table>

      <div class="page-break"></div>

      <h3>Detalhamento por Obra</h3>
      ${Object.entries(report.reformasPorObra || {})
        .map(
          ([obra, items]) => `
          <h4>${obra}</h4>
          <table>
            <tr>
              <th>Reforma</th>
              <th>Status</th>
              <th>Progresso</th>
            </tr>
            ${items.map((r) => `<tr><td>${r.titulo}</td><td>${r.status}</td><td>${r.percentual || 0}%</td></tr>`).join('')}
          </table>
        `
        )
        .join('')}
    </body>
    </html>
  `;

  const win = window.open('', '', 'height=600,width=800');
  win.document.write(htmlContent);
  win.document.close();
  win.print();
}

export function initRelatoriosModule() {
  const card = document.getElementById('relatoriosView');
  const button = document.querySelector('[data-relatorio-quick]');
  const generateBtn = document.getElementById('gerarRelatorio');
  const exportPdfBtn = document.getElementById('exportarPDF');

  if (!card) return;
  card.dataset.module = 'relatorios';

  const loadAndRender = async () => {
    try {
      const reformas = await loadCollection('reformas');
      const pendencias = await loadCollection('pendencias');
      const vistorias = await loadCollection('vistorias');

      const report = generateReformaReport(reformas, pendencias, vistorias);
      renderRelatorioVisual(report);

      // Armazena o relatório atual para exportação
      card.dataset.currentReport = JSON.stringify(report);
    } catch (error) {
      const reformas = JSON.parse(localStorage.getItem('conformeobras:reformas') || '[]');
      const pendencias = JSON.parse(localStorage.getItem('conformeobras:pendencias') || '[]');
      const vistorias = JSON.parse(localStorage.getItem('conformeobras:vistorias') || '[]');

      const report = generateReformaReport(reformas, pendencias, vistorias);
      renderRelatorioVisual(report);
      card.dataset.currentReport = JSON.stringify(report);
    }
  };

  if (button) {
    button.addEventListener('click', () => {
      const container = document.getElementById('relatorioConteudo');
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', loadAndRender);
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      const reportJson = card.dataset.currentReport;
      if (!reportJson) {
        alert('Gere um relatório primeiro.');
        return;
      }
      const report = JSON.parse(reportJson);
      exportRelatorioPDF(report);
    });
  }

  // Carrega relatório na inicialização
  loadAndRender();
}
