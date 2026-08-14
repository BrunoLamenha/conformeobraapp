export function makeEntityList(items, emptyMessage = 'Nenhum item encontrado.') {
  if (!items || items.length === 0) {
    return `<p class="empty-state">${emptyMessage}</p>`;
  }

  return `
    <ul class="task-list">
      ${items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `;
}
