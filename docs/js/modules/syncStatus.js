// docs/js/modules/syncStatus.js

let statusElement;
let statusTextElement;
let statusIconElement;

/**
 * Atualiza a aparência e o texto do componente de status.
 * @param {'online' | 'offline' | 'syncing'} status - O novo estado.
 */
export function updateSyncStatus(status) {
    if (!statusElement || !statusTextElement) return;

    statusElement.className = `sync-status ${status}`;

    switch (status) {
        case 'online':
            statusTextElement.textContent = 'Online';
            break;
        case 'offline':
            statusTextElement.textContent = 'Offline';
            break;
        case 'syncing':
            statusTextElement.textContent = 'Sincronizando...';
            break;
    }
}

/**
 * Inicializa o componente de status e adiciona listeners de eventos de rede.
 */
export function setupSyncStatus() {
    statusElement = document.getElementById('sync-status');
    if (!statusElement) return;

    statusTextElement = statusElement.querySelector('.text');

    // Define o estado inicial com base no status da rede
    updateSyncStatus(navigator.onLine ? 'online' : 'offline');

    // Adiciona listeners para mudanças no status da rede
    window.addEventListener('offline', () => updateSyncStatus('offline'));
}