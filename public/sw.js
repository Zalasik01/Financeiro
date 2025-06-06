// public/sw.js
const CACHE_NAME = "financeiro-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  // Adicione aqui outros ícones ou assets críticos que você quer que funcionem offline
  // Ex: '/icon-192x192.png', '/icon-512x512.png'
];

// Instala o Service Worker e armazena os assets em cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache aberto");
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error("Falha ao abrir cache ou adicionar URLs ao cache:", err);
      })
  );
  self.skipWaiting();
});

// Intercepta as requisições de rede
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se o recurso estiver no cache, serve do cache
      if (response) {
        return response;
      }
      // Caso contrário, busca na rede
      return fetch(event.request);
    })
  );
});

// Ativa o Service Worker e limpa caches antigos
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
