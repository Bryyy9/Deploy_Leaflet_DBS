// src/public/service-worker.js - Update untuk GitHub Pages
const CACHE_NAME = 'storymaps-v1.0.1'; // Increment version
const BASE_PATH = self.location.pathname.includes('leaflet-bri-enhanced') 
  ? '/leaflet-bri-enhanced' 
  : '';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}/index.html`);
        }
      })
  );
});

// ✨ PUSH NOTIFICATION HANDLER (sama seperti sebelumnya)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  
  let notificationData = {
    title: 'StoryMaps',
    body: 'You have a new notification!',
    icon: `${BASE_PATH}/icon-192.png`,
    badge: `${BASE_PATH}/icon-192.png`,
    tag: 'storymaps-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: `${BASE_PATH}/icon-192.png`
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: `${BASE_PATH}/`,
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
      console.log('📋 Push data parsed:', pushData);
    } catch (error) {
      console.warn('⚠️ Failed to parse push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }).then(() => {
      console.log('✅ Push notification displayed successfully');
    }).catch((error) => {
      console.error('❌ Failed to show notification:', error);
    })
  );
});

// ✨ NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();
  
  if (action === 'dismiss') {
    console.log('👋 Notification dismissed');
    return;
  }
  
  const urlToOpen = data.url || `${BASE_PATH}/`;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('📱 Focusing existing window');
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          console.log('🆕 Opening new window');
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('❌ Error handling notification click:', error);
      })
  );
});

// ✨ NOTIFICATION CLOSE HANDLER
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event.notification.tag);
});

// ✨ MESSAGE HANDLER
self.addEventListener('message', (event) => {
  console.log('💬 Message received from main app:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'TRIGGER_NOTIFICATION':
      self.registration.showNotification(data.title || 'Test Notification', {
        body: data.body || 'This is a test notification from StoryMaps!',
        icon: data.icon || `${BASE_PATH}/icon-192.png`,
        tag: data.tag || 'test-notification',
        data: data.data || {},
        actions: data.actions || []
      });
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', type);
  }
});

console.log('🎯 Service Worker script loaded');