// src/public/service-worker.js - Enhanced with debugging
const getBasePath = () => {
  const pathname = self.location.pathname;
  console.log('🌐 SW pathname:', pathname);
  
  if (pathname.includes('/')) {
    const parts = pathname.split('/');
    if (parts.length > 1 && parts[1] && parts[1] !== 'service-worker.js') {
      const basePath = `/${parts[1]}`;
      console.log('🌐 SW detected base path:', basePath);
      return basePath;
    }
  }
  return '';
};

const BASE_PATH = getBasePath();
const CACHE_NAME = 'storymaps-v1.0.3';

console.log('🎯 Service Worker starting with config:', {
  basePath: BASE_PATH,
  cacheName: CACHE_NAME,
  location: self.location.href,
  pathname: self.location.pathname
});

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
        console.log('📦 URLs to cache:', urlsToCache);
        
        // Cache URLs one by one to identify failures
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`⚠️ Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`📦 Cache results: ${successful} successful, ${failed} failed`);
        
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
      console.log('🗂️ Existing caches:', cacheNames);
      
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
          console.log('📦 Cache hit:', event.request.url);
          return response;
        }

        console.log('🌐 Fetching:', event.request.url);
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
      .catch((error) => {
        console.error('❌ Fetch failed:', event.request.url, error);
        
        if (event.request.mode === 'navigate') {
          console.log('🔄 Serving fallback for navigation');
          return caches.match(`${BASE_PATH}/index.html`) || 
                 caches.match('/index.html') ||
                 caches.match('index.html');
        }
      })
  );
});

// ✨ ENHANCED PUSH NOTIFICATION HANDLER
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  console.log('📬 Push data:', event.data ? event.data.text() : 'No data');
  
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

  console.log('📋 Final notification data:', notificationData);

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

// ✨ ENHANCED NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  console.log('🔔 Action:', event.action);
  console.log('🔔 Notification data:', event.notification.data);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();
  
  if (action === 'dismiss') {
    console.log('👋 Notification dismissed');
    return;
  }
  
  let urlToOpen = data.url || `${BASE_PATH}/`;
  
  // Ensure URL is absolute
  if (!urlToOpen.startsWith('http')) {
    urlToOpen = self.location.origin + urlToOpen;
  }
  
  console.log('🔗 Opening URL:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('👥 Found clients:', clientList.length);
        
        for (const client of clientList) {
          console.log('👤 Client URL:', client.url);
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('📱 Focusing existing window');
            if ('navigate' in client) {
              client.navigate(urlToOpen);
            }
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

// ✨ ENHANCED MESSAGE HANDLER
self.addEventListener('message', (event) => {
  console.log('💬 Message received from main app:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('⏭️ Skipping waiting');
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      console.log('📋 Sending version info');
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'TRIGGER_NOTIFICATION':
      console.log('🔔 Triggering notification:', data);
      
      const notificationOptions = {
        body: data.body || 'This is a test notification from StoryMaps!',
        icon: data.icon || `${BASE_PATH}/icon-192.png`,
        badge: data.badge || `${BASE_PATH}/icon-192.png`,
        tag: data.tag || 'test-notification',
        data: data.data || { url: `${BASE_PATH}/` },
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      };
      
      console.log('🔔 Notification options:', notificationOptions);
      
      self.registration.showNotification(
        data.title || 'Test Notification',
        notificationOptions
      ).then(() => {
        console.log('✅ Manual notification shown successfully');
      }).catch((error) => {
        console.error('❌ Manual notification failed:', error);
      });
      break;
      
    case 'DEBUG_INFO':
      console.log('🐛 Debug info requested');
      event.ports[0].postMessage({
        basePath: BASE_PATH,
        cacheName: CACHE_NAME,
        location: self.location.href,
        registration: !!self.registration
      });
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', type);
  }
});

console.log('🎯 Service Worker script loaded with base path:', BASE_PATH);