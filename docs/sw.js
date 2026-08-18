const CACHE_NAME = 'conformeobra-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/global.css',
  '/css/wizard.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/whatsapp-share.js',
  '/js/supabase-init.js',
  // Otimização: Adiciona os módulos ao cache para carregamentos futuros mais rápidos.
  '/js/modules/cadastro.js',
  '/js/modules/checklist.js',
  '/js/modules/cronograma.js',
  '/js/modules/dashboards.js',
  '/js/modules/empreendimentos.js',
  '/js/modules/managerDashboard.js',
  '/js/modules/orcamentos.js',
  '/js/modules/pendencias.js',
  '/js/modules/pessoas.js',
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

self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET e requisições para a API do Firebase.
  // Isso previne o erro "Request method 'POST' is unsupported" com as APIs do Supabase.
  if (event.request.method !== 'GET' || event.request.url.includes('.supabase.co')) {
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
          // Verifica se a resposta é válida e se a requisição é GET antes de cachear.
          // Isso evita o erro com requisições POST.
          if (
            !networkResponse || networkResponse.status !== 200 ||
            networkResponse.type !== 'basic' ||
            event.request.method !== 'GET'
          ) {
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