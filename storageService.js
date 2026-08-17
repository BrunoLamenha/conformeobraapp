// public/js/services/storageService.js

/**
 * Serviço para gerenciar o armazenamento de imagens no IndexedDB.
 * Utiliza a biblioteca 'idb' para simplificar as operações.
 */

const DB_NAME = 'ConformeObraDB';
const STORE_IMAGES = 'images_store';
const DB_VERSION = 1;

let dbPromise;

/**
 * Inicializa e retorna a promessa do banco de dados IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
async function getDb() {
  if (!dbPromise) {
    dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Salva um Blob de imagem no IndexedDB.
 * @param {Blob} imageBlob - O Blob da imagem a ser salva.
 * @returns {Promise<number>} O ID gerado para a imagem salva.
 */
export async function saveImage(imageBlob) {
  const db = await getDb();
  const id = await db.add(STORE_IMAGES, imageBlob);
  return id;
}

/**
 * Recupera um Blob de imagem do IndexedDB pelo seu ID.
 * @param {number} id - O ID da imagem a ser recuperada.
 * @returns {Promise<Blob | undefined>} O Blob da imagem ou undefined se não encontrado.
 */
export async function getImage(id) {
  const db = await getDb();
  return db.get(STORE_IMAGES, id);
}

/**
 * Deleta uma imagem do IndexedDB pelo seu ID.
 * @param {number} id - O ID da imagem a ser deletada.
 * @returns {Promise<void>}
 */
export async function deleteImage(id) {
  const db = await getDb();
  return db.delete(STORE_IMAGES, id);
}