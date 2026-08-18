const CACHE_NAME = 'conformeobra-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/global.css',
  '/css/wizard.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/firebase-init.js',
  '/js/whatsapp-share.js',
  '/assets/logo/logo.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
  // Adicione outros arquivos estáticos importantes aqui
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (como POST para o Firestore)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora requisições para o Firebase para evitar problemas de cache com dados dinâmicos
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache
        if (response) {
          return response;
        }

        // Se não, busca na rede, retorna e armazena no cache para uso futuro
        return fetch(event.request).then(
          networkResponse => {
            // Não é necessário clonar e colocar no cache aqui para uma estratégia simples
            return networkResponse;
          }
        );
      })
  );
});