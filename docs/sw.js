const CACHE_NAME = 'conformeobra-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'css/global.css',
  'css/wizard.css',
  'js/app.js',
  'js/auth.js',
  'js/whatsapp-share.js',
  'js/supabase-init.js', // Assumindo que este arquivo existe
  '/js/modules/cadastro.js',
  '/js/modules/dashboards.js',
  '/js/modules/empreendimentos.js',
  '/js/modules/orcamentos.js',
  '/js/modules/pendencias.js',
  '/js/modules/projetos.js',
  '/js/modules/reformas.js',
  '/js/modules/relatorios.js',
  '/js/modules/usuarios.js',
  '/js/modules/vistorias.js',
  '/assets/logo/logo.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
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

self.addEventListener('activate', event => {
  console.log('Service worker ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não for o atual, ele é deletado.
          // Para forçar a atualização, basta mudar a versão em CACHE_NAME.
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Deixa as requisições que não são GET (POST, PUT, DELETE, etc.) passarem direto para a rede.
  // Isso é crucial para que as operações de escrita com Supabase funcionem online.
  if (event.request.method !== 'GET') {
    return; // Deixa o navegador lidar com a requisição normalmente.
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache
        if (response) {
          return response;
        }
 
        // Se não encontrar no cache, busca na rede.
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse; // Retorna a resposta da rede sem cachear.
          }
 
          // Clona a resposta. Uma resposta só pode ser consumida uma vez.
          // Precisamos de uma cópia para o cache e outra para o navegador.
          const responseToCache = networkResponse.clone();
 
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
 
          return networkResponse;
        });
      })
  );
});