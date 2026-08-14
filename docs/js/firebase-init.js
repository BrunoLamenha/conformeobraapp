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

let firebaseConfig = {
  apiKey: 'SUA_API_KEY_AQUI',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456'
};

// Tentar carregar config do arquivo local (se existir)
try {
  // @ts-ignore
  if (typeof firebaseConfigLocal !== 'undefined') {
    firebaseConfig = firebaseConfigLocal;
  }
} catch (e) {
  // Arquivo local não encontrado, usa config padrão
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
    firebaseConfig.projectId !== 'seu-projeto' &&
    firebaseConfig.apiKey !== 'SUA_API_KEY_AQUI'
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

function generateId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function saveDocument(collectionName, payload) {
  const db = initFirebase();

  // Tenta usar Firestore se disponível
  if (db) {
    try {
      return db
        .collection(collectionName)
        .add({
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .then((docRef) => {
          console.log(`Documento salvo em Firestore: ${collectionName}/${docRef.id}`);
          return { id: docRef.id, ...payload };
        })
        .catch((error) => {
          console.warn(`Firestore indisponível (${error.message}). Usando localStorage.`);
          return saveToLocalStorage(collectionName, payload);
        });
    } catch (error) {
      console.warn(`Erro ao salvar no Firestore: ${error.message}. Usando localStorage.`);
      return saveToLocalStorage(collectionName, payload);
    }
  }

  // Fallback: localStorage
  return saveToLocalStorage(collectionName, payload);
}

export function loadCollection(collectionName) {
  const db = initFirebase();

  // Tenta usar Firestore se disponível
  if (db) {
    return db
      .collection(collectionName)
      .get()
      .then((snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Também salvar no localStorage como backup
        const key = `conformeobras:${collectionName}`;
        localStorage.setItem(key, JSON.stringify(items));
        return items;
      })
      .catch((error) => {
        console.warn(`Firestore indisponível (${error.message}). Usando localStorage.`);
        return loadFromLocalStorage(collectionName);
      });
  }

  // Fallback: localStorage
  return Promise.resolve(loadFromLocalStorage(collectionName));
}

// Funções auxiliares de localStorage
function saveToLocalStorage(collectionName, payload) {
  const key = `conformeobras:${collectionName}`;
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  const item = {
    id: generateId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  current.push(item);
  localStorage.setItem(key, JSON.stringify(current));
  return Promise.resolve(item);
}

function loadFromLocalStorage(collectionName) {
  const key = `conformeobras:${collectionName}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}
