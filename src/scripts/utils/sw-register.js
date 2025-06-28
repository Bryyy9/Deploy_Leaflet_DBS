// src/scripts/utils/sw-register.js - FIXED
import { pushManager } from './push-manager.js';

export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker not supported');
    return false;
  }

  try {
    console.log('🔧 Registering Service Worker...');
    
    // Try multiple paths
    const swPaths = [
      '/service-worker.js',
      './service-worker.js'
    ];
    
    // Add base path if available
    if (window.APP_CONFIG && window.APP_CONFIG.BASE_PATH) {
      swPaths.unshift(`${window.APP_CONFIG.BASE_PATH}/service-worker.js`);
    }
    
    let registration = null;
    
    for (const swPath of swPaths) {
      try {
        console.log(`🔄 Trying SW path: ${swPath}`);
        registration = await navigator.serviceWorker.register(swPath, {
          scope: window.APP_CONFIG?.BASE_PATH || '/'
        });
        console.log('✅ Service Worker registered:', registration);
        break;
      } catch (error) {
        console.warn(`⚠️ Failed to register SW at ${swPath}:`, error.message);
      }
    }
    
    if (!registration) {
      throw new Error('Could not register service worker at any path');
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🆕 New Service Worker found');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('🔄 New content available');
            showUpdateAvailable(registration);
          } else {
            console.log('📦 Content cached for offline use');
            showOfflineReady();
          }
        }
      });
    });

    // ✅ FIXED: Initialize push notifications safely
    await initializePushNotifications();
    
    return registration;
    
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return false;
  }
}

async function initializePushNotifications() {
  try {
    console.log('🔔 Initializing push notifications...');
    
    const initialized = await pushManager.init();
    
    if (initialized) {
      console.log('✅ Push notifications initialized');
      
      // ✅ FIXED: Safe auto-subscribe
      await pushManager.autoSubscribe();
      
      // ✅ FIXED: Safe notification permission import
      try {
        const { notificationPermission } = await import('../components/notification-permission.js');
        notificationPermission.autoShow();
      } catch (importError) {
        console.warn('⚠️ Could not load notification permission component:', importError);
      }
      
    } else {
      console.log('⚠️ Push notifications not available');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize push notifications:', error);
  }
}

function showUpdateAvailable(registration) {
  if (window.Swal) {
    window.Swal.fire({
      title: 'Update Available',
      text: 'A new version of StoryMaps is available. Would you like to update now?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Update Now',
      cancelButtonText: 'Later',
      confirmButtonColor: '#00d4ff'
    }).then((result) => {
      if (result.isConfirmed) {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
      }
    });
  } else {
    if (confirm('A new version is available. Update now?')) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }
  }
}

function showOfflineReady() {
  if (window.Swal) {
    window.Swal.fire({
      title: 'Ready for Offline Use',
      text: 'StoryMaps is now available offline!',
      icon: 'success',
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'bottom-end'
    });
  }
}

export function checkForSWUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

export function sendSWMessage(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

if (typeof window !== 'undefined') {
  setInterval(checkForSWUpdates, 60 * 60 * 1000);
}