import { updateSyncStatus } from './modules/syncStatus.js';

// ============================================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================================
// 1. Crie um projeto em https://app.supabase.com/
// 2. Vá para "Project Settings" > "API".
// 3. Crie o arquivo `supabase-config.local.js` com sua URL e chave `anon`.
// ============================================================================

let supabaseConfig = {};
let supabaseClient = null;

// Tenta carregar a configuração do arquivo local.
try {
  const configModule = await import('./supabase-config.local.js');
  supabaseConfig = configModule.supabaseConfig;
} catch (error) {
  console.warn(
    'Arquivo de configuração local (supabase-config.local.js) não encontrado. ' +
    'O app funcionará em modo offline. Veja o README.md para configurar o Supabase.'
  );
}

/**
 * Verifica se as credenciais do Supabase foram configuradas.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return supabaseConfig.url && supabaseConfig.anonKey;
}

/**
 * Inicializa e retorna o cliente Supabase.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function initSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (isSupabaseConfigured()) {
    try {
      supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
      console.info('Cliente Supabase inicializado com sucesso.');
      
      // Monitorar conectividade para sincronização futura.
      window.addEventListener('online', syncPendingWrites);
      
      // Tenta sincronizar na inicialização.
      syncPendingWrites();

    } catch (e) {
      console.error('Erro ao inicializar Supabase:', e);
      return null;
    }
  } else {
    console.warn('Supabase não configurado. Usando localStorage como fallback.');
  }

  return supabaseClient;
}

/**
 * Retorna a instância do cliente Supabase.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Sincroniza as escritas pendentes do localStorage com o Supabase quando a conexão é restabelecida.
 */
export async function syncPendingWrites() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const syncQueueKey = "conformeobras:sync_queue";
  let pendingWrites = JSON.parse(localStorage.getItem(syncQueueKey) || "[]");

  if (pendingWrites.length === 0) {
    updateSyncStatus("online");
    return;
  }

  updateSyncStatus("syncing");
  console.log(`Sincronizando ${pendingWrites.length} escritas pendentes...`);

  while (pendingWrites.length > 0) {
    const write = pendingWrites[0]; // Pega o primeiro item da fila
    let error;

    try {
      if (write.type === 'add') {
        ({ error } = await supabase.from(write.tableName).insert(write.payload));
      } else if (write.type === 'update' && write.docId) {
        ({ error } = await supabase.from(write.tableName).update(write.payload).eq('id', write.docId));
      } else if (write.type === 'delete' && write.docId) {
        ({ error } = await supabase.from(write.tableName).delete().eq('id', write.docId));
      }
      if (error) throw error;

      console.log(`✅ Operação '${write.type}' para a tabela '${write.tableName}' sincronizada com sucesso.`);
      pendingWrites.shift(); // Remove da fila após sucesso
      localStorage.setItem(syncQueueKey, JSON.stringify(pendingWrites));
    } catch (e) {
      console.error(`❌ Falha ao sincronizar item para '${write.tableName}'. Tentando novamente mais tarde.`, e);
      updateSyncStatus("offline"); // Indica que a sincronização falhou e para
      return;
    }
  }

  console.log("🎉 Sincronização concluída com sucesso!");
  updateSyncStatus("online");
}

// ============================================================================
// FUNÇÕES DE DADOS (CRUD) - MIGRAÇÃO PARA SUPABASE
// ============================================================================

/**
 * Carrega uma coleção de uma tabela do Supabase, com fallback para localStorage.
 * @param {string} tableName - O nome da tabela.
 * @param {object} options - Opções de consulta.
 * @returns {Promise<Array<Object>>}
 */
export async function loadCollection(tableName, options = {}) {
  const supabase = getSupabase();
  const { filters = [] } = options; // Ex: [{ column: 'status', op: 'eq', value: 'active' }]

  if (!supabase) {
    return loadFromLocalStorage(tableName);
  }

  try {
    let query = supabase.from(tableName).select('*');
    filters.forEach(f => {
      query = query[f.op](f.column, f.value);
    });

    const { data, error } = await query;
    if (error) throw error;

    // Salva no cache local para uso offline
    saveToLocalStorage(tableName, data);
    return data;
  } catch (error) {
    console.warn(`Supabase indisponível (${error.message}). Usando localStorage como fallback para a tabela '${tableName}'.`);
    return loadFromLocalStorage(tableName);
  }
}

/**
 * Salva um novo documento em uma tabela do Supabase, com fallback para localStorage.
 * @param {string} tableName - O nome da tabela.
 * @param {Object} payload - O objeto a ser salvo.
 * @returns {Promise<Object>}
 */
export async function saveDocument(tableName, payload) {
  const supabase = getSupabase();
  if (!supabase) {
    return saveToQueue(tableName, 'add', payload);
  }

  try {
    const { data, error } = await supabase.from(tableName).insert(payload).select();
    if (error) throw error;
    console.log(`Documento salvo no Supabase: ${tableName}`);
    return data[0];
  } catch (error) {
    console.warn(`Supabase indisponível para salvar (${error.message}). Adicionando à fila de sincronização.`);
    return saveToQueue(tableName, 'add', payload);
  }
}

/**
 * Atualiza um documento existente em uma tabela do Supabase.
 * @param {string} tableName - O nome da tabela.
 * @param {string} docId - O ID do documento a ser atualizado.
 * @param {Object} payload - Os campos a serem atualizados.
 * @returns {Promise<Object>}
 */
export async function updateDocument(tableName, docId, payload) {
  const supabase = getSupabase();
  if (!supabase) {
    return saveToQueue(tableName, 'update', payload, docId);
  }

  try {
    const { data, error } = await supabase.from(tableName).update(payload).eq('id', docId).select();
    if (error) throw error;
    console.log(`Documento atualizado no Supabase: ${tableName}/${docId}`);
    return data[0];
  } catch (error) {
    console.warn(`Supabase indisponível para atualizar (${error.message}). Adicionando à fila de sincronização.`);
    return saveToQueue(tableName, 'update', payload, docId);
  }
}

/**
 * Exclui um documento de uma tabela do Supabase.
 * @param {string} tableName - O nome da tabela.
 * @param {string} docId - O ID do documento a ser excluído.
 * @returns {Promise<void>}
 */
export async function deleteDocument(tableName, docId) {
  const supabase = getSupabase();
  if (!supabase) {
    return saveToQueue(tableName, 'delete', {}, docId);
  }

  try {
    const { error } = await supabase.from(tableName).delete().eq('id', docId);
    if (error) throw error;
    console.log(`Documento excluído do Supabase: ${tableName}/${docId}`);
  } catch (error) {
    console.warn(`Supabase indisponível para excluir (${error.message}). Adicionando à fila de sincronização.`);
    return saveToQueue(tableName, 'delete', {}, docId);
  }
}

// --- Funções Auxiliares de Armazenamento Local ---

function loadFromLocalStorage(tableName) {
  const key = `conformeobras:${tableName}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveToLocalStorage(tableName, data) {
  const key = `conformeobras:${tableName}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function saveToQueue(tableName, type, payload, docId = null) {
  const syncQueueKey = 'conformeobras:sync_queue';
  const currentQueue = JSON.parse(localStorage.getItem(syncQueueKey) || '[]');
  
  const operation = { type, tableName, payload };
  if (docId) operation.docId = docId;

  currentQueue.push(operation);
  localStorage.setItem(syncQueueKey, JSON.stringify(currentQueue));
  
  console.log(`Operação '${type}' para a tabela '${tableName}' adicionada à fila de sincronização.`);
  updateSyncStatus('offline');
  return Promise.resolve(payload); // Retorna o payload para consistência da UI
}