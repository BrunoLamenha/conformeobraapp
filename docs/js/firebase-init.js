// ============================================================================
// CONFIGURAÇÃO FIREBASE
// ============================================================================
// Para usar Firebase Firestore:
// 1. Crie um projeto em https://console.firebase.google.com
// 2. Habilite Firestore Database
// 3. Crie arquivo firebase-config.local.js com suas credenciais
// 4. Adicione um script CDN Firebase na tag <head> do HTML:
//    <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
//    <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"></script>
// Enquanto isso, a app usa localStorage como fallback (funciona offline).
// ============================================================================

let firebaseConfig = {};

// Tentar carregar config do arquivo local (se existir)
try {
  const configModule = await import('./firebase-config.local.js');
  firebaseConfig = configModule.firebaseConfig;
} catch (error) {
  console.warn(
    'Arquivo de configuração local (firebase-config.local.js) não encontrado ou inválido. ' +
    'O app funcionará em modo offline. Veja o arquivo DEPLOYMENT.md para configurar o Firebase.'
  );
}

// Detecta se Firebase está disponível
const hasFirebase = typeof window !== 'undefined' && window.firebase !== undefined;

// Listeners de sincronização
const syncListeners = new Map();

export function getFirebaseConfig() {
  return firebaseConfig;
}

export function isFirebaseConfigured() {
  return (
    hasFirebase &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'seu-projeto'
  );
}

let firebaseDb = null;

export function initFirebase() {
  if (!hasFirebase) {
    console.info('Firebase não está carregado. Usando localStorage como fallback.');
    return null;
  }

  if (!isFirebaseConfigured()) {
    console.warn('Firebase não está configurado com credenciais válidas. Usando localStorage.');
    return null;
  }

  if (!window.firebase.apps.length) {
    try {
      window.firebase.initializeApp(firebaseConfig);
      console.info('Firebase inicializado com sucesso');
    } catch (e) {
      console.warn('Erro ao inicializar Firebase:', e);
      return null;
    }
  }

  if (!firebaseDb) {
    firebaseDb = window.firebase.firestore();
    
    // Habilitar persistência offline
    try {
      firebaseDb.enablePersistence().catch((err) => {
        if (err.code !== 'failed-precondition') {
          console.warn('Não foi possível habilitar persistência:', err);
        }
      });
    } catch (e) {
      console.info('Persistência offline pode não estar disponível');
    }

    // Monitorar conectividade
    firebaseDb.enableNetwork();

    // Tenta sincronizar dados pendentes na inicialização
    syncPendingWrites();
  }

  return firebaseDb;
}

// Adicionar listener de sincronização em tempo real
export function watchCollection(collectionName, callback) {
  const db = initFirebase();

  if (!db) {
    console.warn(`Firestore não disponível. Sync em tempo real não funcionará para ${collectionName}`);
    return () => {};
  }

  try {
    const unsubscribe = db.collection(collectionName).onSnapshot(
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // Atualizar localStorage também
        const key = `conformeobras:${collectionName}`;
        localStorage.setItem(key, JSON.stringify(items));

        // Chamar callback
        if (callback) callback(items);
      },
      (error) => {
        console.warn(`Erro ao observar ${collectionName}:`, error);
      }
    );

    // Armazenar para cleanup depois
    syncListeners.set(collectionName, unsubscribe);

    return unsubscribe;
  } catch (error) {
    console.error(`Erro ao criar listener para ${collectionName}:`, error);
    return () => {};
  }
}

// Remover listener
export function unwatchCollection(collectionName) {
  const unsubscribe = syncListeners.get(collectionName);
  if (unsubscribe) {
    unsubscribe();
    syncListeners.delete(collectionName);
  }
}

/**
 * Sincroniza as escritas pendentes do localStorage com o Firestore.
 * É acionado quando o app volta a ficar online.
 */
export async function syncPendingWrites() {
  const db = initFirebase();
  if (!db) return; // Se não há firebase, não há o que sincronizar

  const syncQueueKey = 'conformeobras:sync_queue';
  const pendingWrites = JSON.parse(localStorage.getItem(syncQueueKey) || '[]');

  if (pendingWrites.length === 0) {
    console.log('Nenhuma escrita pendente para sincronizar.');
    return;
  }

  console.log(`Sincronizando ${pendingWrites.length} escritas pendentes...`);

  // Limpa a fila local primeiro para evitar reprocessamento em caso de falha parcial
  localStorage.setItem(syncQueueKey, JSON.stringify([]));

  const failedWrites = [];

  for (const write of pendingWrites) {
    try {
      if (write.type === 'update' && write.docId) {
        await db.collection(write.collectionName).doc(write.docId).update(write.payload);
      } else {
        // Assume 'add' como padrão para compatibilidade com a versão anterior
        await db.collection(write.collectionName).add(write.payload);
      }
      console.log(`✅ Item da coleção '${write.collectionName}' sincronizado com sucesso.`);
    } catch (error) {
      console.error(`❌ Falha ao sincronizar item para '${write.collectionName}'. Adicionando de volta à fila.`, error);
      failedWrites.push(write);
    }
  }

  // Se houver falhas, adiciona os itens de volta à fila para a próxima tentativa
  if (failedWrites.length > 0) {
    const remainingWrites = JSON.parse(localStorage.getItem(syncQueueKey) || '[]');
    localStorage.setItem(syncQueueKey, JSON.stringify([...remainingWrites, ...failedWrites]));
    console.warn(`${failedWrites.length} itens não puderam ser sincronizados e foram mantidos na fila.`);
  } else {
    console.log('🎉 Sincronização concluída com sucesso!');
  }
}

function generateId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function saveDocument(collectionName, payload) {
  const db = initFirebase();

  if (!db) {
    // Fallback direto para localStorage se o Firebase não estiver inicializado
    return saveToLocalStorage(collectionName, payload);
  }

  try {
    const docRef = await db.collection(collectionName).add({
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`Documento salvo em Firestore: ${collectionName}/${docRef.id}`);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.warn(`Firestore indisponível (${error.message}). Usando localStorage como fallback.`);
    return saveToLocalStorage(collectionName, payload);
  }
}

export async function updateDocument(collectionName, docId, payload) {
  const db = initFirebase();
  const updatePayload = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  if (!db) {
    // Fallback para localStorage se o Firebase não estiver disponível
    return updateInLocalStorage(collectionName, docId, updatePayload);
  }

  try {
    await db.collection(collectionName).doc(docId).update(updatePayload);
    console.log(`Documento atualizado no Firestore: ${collectionName}/${docId}`);
    // Atualiza também o cache local para consistência imediata
    const items = await loadCollection(collectionName);
    const index = items.findIndex(item => item.id === docId);
    if (index > -1) {
      items[index] = { ...items[index], ...updatePayload };
      const key = `conformeobras:${collectionName}`;
      localStorage.setItem(key, JSON.stringify(items));
    }
    return { id: docId, ...payload };
  } catch (error) {
    console.warn(`Firestore indisponível para atualização (${error.message}). Usando localStorage como fallback.`);
    return updateInLocalStorage(collectionName, docId, updatePayload);
  }
}

export async function loadCollection(collectionName) {
  const db = initFirebase();

  if (!db) {
    // Fallback direto para localStorage se o Firebase não estiver inicializado
    return loadFromLocalStorage(collectionName);
  }

  try {
    const snapshot = await db.collection(collectionName).get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Também salvar no localStorage como backup para uso offline futuro
    const key = `conformeobras:${collectionName}`;
    localStorage.setItem(key, JSON.stringify(items));
    return items;
  } catch (error) {
    console.warn(`Firestore indisponível (${error.message}). Usando localStorage como fallback.`);
    return loadFromLocalStorage(collectionName);
  }
}

// Funções auxiliares de localStorage
function saveToLocalStorage(collectionName, payload) {
  const collectionKey = `conformeobras:${collectionName}`;
  const syncQueueKey = 'conformeobras:sync_queue';

  // 1. Adiciona à coleção local para atualização imediata da UI
  const currentCollection = JSON.parse(localStorage.getItem(collectionKey) || '[]');
  const item = {
    id: generateId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  currentCollection.push(item);
  localStorage.setItem(collectionKey, JSON.stringify(currentCollection));

  // 2. Adiciona à fila de sincronização para envio posterior
  const currentQueue = JSON.parse(localStorage.getItem(syncQueueKey) || '[]');
  currentQueue.push({ type: 'add', collectionName, payload: item });
  localStorage.setItem(syncQueueKey, JSON.stringify(currentQueue));

  console.log(`Documento salvo localmente e adicionado à fila de sincronização: ${collectionName}`);
  return Promise.resolve(item);
}

window.addEventListener('online', syncPendingWrites);

function updateInLocalStorage(collectionName, docId, payload) {
  const collectionKey = `conformeobras:${collectionName}`;
  const syncQueueKey = 'conformeobras:sync_queue';

  // 1. Atualiza a coleção local
  const currentCollection = JSON.parse(localStorage.getItem(collectionKey) || '[]');
  const itemIndex = currentCollection.findIndex(item => item.id === docId);

  if (itemIndex > -1) {
    currentCollection[itemIndex] = { ...currentCollection[itemIndex], ...payload };
    localStorage.setItem(collectionKey, JSON.stringify(currentCollection));
  }

  // 2. Adiciona a operação de 'update' à fila de sincronização
  const currentQueue = JSON.parse(localStorage.getItem(syncQueueKey) || '[]');
  currentQueue.push({ type: 'update', collectionName, docId, payload });
  localStorage.setItem(syncQueueKey, JSON.stringify(currentQueue));

  console.log(`Documento atualizado localmente e adicionado à fila de sincronização: ${collectionName}/${docId}`);
  return Promise.resolve({ id: docId, ...payload });
}

function loadFromLocalStorage(collectionName) {
  const key = `conformeobras:${collectionName}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}
