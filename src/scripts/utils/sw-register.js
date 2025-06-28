// src/scripts/utils/sw-register.js - FIXED SCOPE ISSUE
export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker not supported');
    return false;
  }

  try {
    console.log('🔧 Registering Service Worker...');
    
    // ✅ FIXED: Get correct paths and scopes
    const { swPaths, scope } = getServiceWorkerConfig();
    console.log('🔍 SW Config:', { swPaths, scope });
    
    let registration = null;
    let lastError = null;
    
    // Test each path
    for (const swPath of swPaths) {
      try {
        console.log(`🔄 Testing SW path: ${swPath} with scope: ${scope}`);
        
        // ✅ Check if file exists
        const fileExists = await checkFileExists(swPath);
        if (!fileExists) {
          console.warn(`⚠️ File not found: ${swPath}`);
          continue;
        }
        
        console.log(`✅ File exists: ${swPath}`);
        
        // ✅ FIXED: Use correct scope
        registration = await navigator.serviceWorker.register(swPath, {
          scope: scope,
          updateViaCache: 'none'
        });
        
        console.log('✅ Service Worker registered successfully:', registration);
        console.log('📍 Registration scope:', registration.scope);
        break;
        
      } catch (error) {
        console.warn(`⚠️ Failed to register SW at ${swPath}:`, error.message);
        lastError = error;
      }
    }
    
    if (!registration) {
      throw new Error(`Could not register service worker. Last error: ${lastError?.message}`);
    }

    // ✅ Wait for SW to be ready
    await navigator.serviceWorker.ready;
    console.log('🎯 Service Worker ready');

    // Setup event listeners
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

    // ✅ Initialize push notifications safely
    await initializePushNotifications();
    
    return registration;
    
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return false;
  }
}

// ✅ NEW: Get SW configuration with correct scope
function getServiceWorkerConfig() {
  const basePath = window.APP_CONFIG?.BASE_PATH || '';
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  console.log('🌐 SW Config detection:', {
    basePath,
    isGitHubPages,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    origin: window.location.origin
  });
  
  // ✅ FIXED: Service Worker paths
  const swPaths = [];
  
  if (isGitHubPages && basePath) {
    // GitHub Pages - SW harus relative ke base path
    swPaths.push(`${basePath}/service-worker.js`);
    swPaths.push(`./service-worker.js`); // Relative ke current path
  }
  
  // Fallback paths
  swPaths.push('/service-worker.js');
  swPaths.push('./service-worker.js');
  
  // ✅ FIXED: Scope harus sesuai dengan lokasi SW
  // Jika SW di /Deploy_Leaflet_DBS/service-worker.js, scope maksimal /Deploy_Leaflet_DBS/
  const scope = basePath ? `${basePath}/` : '/';
  
  console.log('📍 Final SW config:', { swPaths, scope });
  
  return { swPaths, scope };
}

// ✅ Keep existing helper functions
async function checkFileExists(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    console.log(`📡 File check ${url}: ${response.status}`);
    return response.ok;
    
  } catch (error) {
    console.warn(`📡 File check failed ${url}:`, error.message);
    return false;
  }
}

async function initializePushNotifications() {
  try {
    console.log('🔔 Initializing push notifications...');
    
    const { pushManager } = await import('./push-manager.js');
    
    const initialized = await pushManager.init();
    
    if (initialized) {
      console.log('✅ Push notifications initialized');
      
      await pushManager.autoSubscribe();
      
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