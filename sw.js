const CACHE_VERSION = '2';
const CACHE_NAME = 'datamap-pro-v' + CACHE_VERSION;

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './import.html',
    './analytics.html',
    './export.html',
    './manifest.json',
    './assets/css/common.css',
    './assets/css/main.css',
    './assets/css/import.css',
    './assets/css/analytics.css',
    './assets/css/export.css',
    './assets/js/utils.js',
    './assets/js/db.js',
    './assets/js/cities.js',
    './assets/js/app.js',
    './assets/js/import.js',
    './assets/js/analytics.js',
    './assets/js/export.js',
    './assets/js/sw-register.js',
    './assets/js/xlsx.full.min.js',
    './assets/js/chart.umd.min.js',
    './assets/bootstrap/css/bootstrap.min.css',
    './assets/bootstrap/js/bootstrap.min.js',
    './assets/img/fav16.png',
    './assets/img/fav16D.png',
    './assets/img/fav32.png',
    './assets/img/fav32D.png',
    './assets/img/fav180.png',
    './assets/img/icon-192.png',
    './assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing version:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache install failed:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating version:', CACHE_VERSION);
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
            .then(() => {
                return self.clients.matchAll({ type: 'window' }).then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({
                            type: 'SW_UPDATED',
                            version: CACHE_VERSION
                        });
                    });
                });
            })
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({
            type: 'VERSION_INFO',
            version: CACHE_VERSION
        });
    }
});
