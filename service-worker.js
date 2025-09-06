/**
 * ====================================
 * SFM - Service Worker
 * Progressive Web App functionality
 * ====================================
 */

const CACHE_NAME = 'sfm-v1.0.0';
const STATIC_CACHE = 'sfm-static-v1.0.0';
const DYNAMIC_CACHE = 'sfm-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/caisse.js',
    '/js/travel.js',
    '/js/booking.js',
    '/js/tontine.js',
    '/js/widgets.js',
    '/js/dashboard.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.0/firebase-app-compat.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.0/firebase-auth-compat.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.0/firebase-firestore-compat.min.js'
];

// API endpoints that should be cached dynamically
const DYNAMIC_URLS = [
    'https://api.open-meteo.com/',
    'https://api.exchangerate-api.com/',
    'https://api.qrserver.com/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('SFM Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('SFM Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('SFM Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('SFM Service Worker: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('SFM Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('SFM Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('SFM Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Handle different types of requests
    if (STATIC_FILES.some(file => request.url.includes(file))) {
        // Static files - cache first strategy
        event.respondWith(cacheFirst(request));
    } else if (DYNAMIC_URLS.some(apiUrl => request.url.includes(apiUrl))) {
        // API calls - network first strategy
        event.respondWith(networkFirst(request));
    } else if (request.url.includes('/api/') || url.hostname.includes('firebaseapp.com')) {
        // Firebase/API calls - network only
        event.respondWith(networkOnly(request));
    } else {
        // Other resources - stale while revalidate
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Cache strategies

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('SFM Service Worker: Cache first strategy failed:', error);
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('SFM Service Worker: Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return await caches.match('/index.html');
        }
        
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Network Only Strategy
 * Always try network, no caching
 */
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        return new Response('Network Error', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, return cached version if available
        return cachedResponse;
    });

    // Return cached version immediately if available
    return cachedResponse || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('SFM Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'sfm-sync-transactions') {
        event.waitUntil(syncTransactions());
    } else if (event.tag === 'sfm-sync-bookings') {
        event.waitUntil(syncBookings());
    }
});

// Sync pending transactions when back online
async function syncTransactions() {
    try {
        console.log('SFM Service Worker: Syncing transactions...');
        
        // Get pending transactions from IndexedDB
        const pendingTransactions = await getPendingTransactions();
        
        for (const transaction of pendingTransactions) {
            try {
                // Send to server
                await fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(transaction)
                });
                
                // Remove from pending list
                await removePendingTransaction(transaction.id);
                console.log('SFM Service Worker: Transaction synced:', transaction.id);
            } catch (error) {
                console.error('SFM Service Worker: Failed to sync transaction:', transaction.id, error);
            }