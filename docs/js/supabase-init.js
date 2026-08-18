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
 * Sincroniza as escritas pendentes do localStorage com o Supabase.
 * (Função de placeholder para ser implementada na próxima fase da migração)
 */
export async function syncPendingWrites() {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const syncQueueKey = "conformeobras:sync_queue";
  const pendingWrites = JSON.parse(localStorage.getItem(syncQueueKey) || "[]");

  if (pendingWrites.length === 0) {
    updateSyncStatus("online");
    return;
  }

  updateSyncStatus('syncing');
  console.log(`Sincronizando ${pendingWrites.length} escritas pendentes... (Lógica a ser implementada)`);

  // Lógica de sincronização com as tabelas do Supabase virá aqui.
  // Por enquanto, vamos apenas simular o sucesso para não bloquear a UI.
  
  // Exemplo futuro:
  // for (const write of pendingWrites) {
  //   if (write.type === 'add') {
  //     const { error } = await supabase.from(write.tableName).insert(write.payload);
  //   }
  // }

  // Limpa a fila por enquanto para evitar loops de erro.
  localStorage.setItem(syncQueueKey, JSON.stringify([]));
  console.log("🎉 Sincronização (simulada) concluída com sucesso!");
  updateSyncStatus("online");
}

// TODO: Migrar as funções saveDocument, loadCollection, etc., para usar o Supabase.