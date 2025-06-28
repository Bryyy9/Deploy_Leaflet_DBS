// src/scripts/app.js - Entry point
import '../styles/main.css';
import { Router } from './router.js';
import { registerSW } from './utils/sw-register.js';

console.log('🚀 StoryMaps Enhanced starting...');

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