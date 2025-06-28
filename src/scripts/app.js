// src/scripts/app.js - Updated with global variables
import '../styles/main.css';
import { Router } from './router.js';
import { registerSW } from './utils/sw-register.js';

// ✨ Setup global configuration dari webpack DefinePlugin
window.APP_CONFIG = {
  BASE_PATH: typeof __BASE_PATH__ !== 'undefined' ? __BASE_PATH__ : '',
  IS_PRODUCTION: typeof __IS_PRODUCTION__ !== 'undefined' ? __IS_PRODUCTION__ : false,
  IS_GITHUB_PAGES: typeof __IS_GITHUB_PAGES__ !== 'undefined' ? __IS_GITHUB_PAGES__ : false,
  PUBLIC_PATH: typeof __PUBLIC_PATH__ !== 'undefined' ? __PUBLIC_PATH__ : '/',
  BUILD_TIMESTAMP: typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : new Date().toISOString(),
  VERSION: typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.0.0'
};

// ✨ Backward compatibility
window.BASE_PATH = window.APP_CONFIG.BASE_PATH;
window.IS_PRODUCTION = window.APP_CONFIG.IS_PRODUCTION;

console.log('🚀 StoryMaps Enhanced starting...');
console.log('🔧 App Config:', window.APP_CONFIG);

// ✨ Setup base href dynamically jika diperlukan
if (window.APP_CONFIG.BASE_PATH && !document.querySelector('base')) {
  const base = document.createElement('base');
  base.href = window.APP_CONFIG.BASE_PATH + '/';
  document.head.insertBefore(base, document.head.firstChild);
  console.log('🌐 Base href set to:', base.href);
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('📱 DOM loaded, initializing app...');
    
    // Initialize router
    const router = new Router();
    router.init();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      await registerSW();
    }
    
    // ✨ Show build info in console
    console.log('📋 Build Info:', {
      version: window.APP_CONFIG.VERSION,
      timestamp: window.APP_CONFIG.BUILD_TIMESTAMP,
      production: window.APP_CONFIG.IS_PRODUCTION,
      githubPages: window.APP_CONFIG.IS_GITHUB_PAGES,
      basePath: window.APP_CONFIG.BASE_PATH
    });
    
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('🎯 App script loaded');