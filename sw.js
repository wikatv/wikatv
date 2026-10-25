// WIKA TV - Service Worker v8.1 - Updated 2025
const CACHE_NAME = 'wika-tv-v8-1-' + new Date().toISOString().slice(0,10);
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './logo.png',
  './manifest.json'
];

// تثبيت النسخة الجديدة
self.addEventListener('install', event => {
  console.log('WIKA TV SW: Installing new version');
  self.skipWaiting(); // فرض التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// تفعيل - مسح كل الكاش القديم
self.addEventListener('activate', event => {
  console.log('WIKA TV SW: Activating and cleaning old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.includes('wika')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// جلب الملفات - حاول الشبكة أولاً ثم الكاش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // إذا نجح جلب من الشبكة، حدث الكاش
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // إذا فشلت الشبكة، جرب الكاش
        return caches.match(event.request);
      })
  );
});
