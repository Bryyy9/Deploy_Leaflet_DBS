// src/scripts/app.js - UPDATE dengan auth management
import '../styles/main.css';
import { Router } from './router.js';
import { registerSW } from './utils/sw-register.js';

// ✅ TAMBAH: Auth state management
class AuthManager {
  constructor() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.init();
  }

  init() {
    // Load auth state from localStorage
    this.loadAuthState();
    
    // Setup auth change listener
    document.addEventListener('authChange', (event) => {
      const { isLoggedIn, user } = event.detail;
      this.isLoggedIn = isLoggedIn;
      this.currentUser = user;
      this.updateNavigation();
    });
    
    // Update navigation on init
    this.updateNavigation();
  }

  loadAuthState() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
        this.isLoggedIn = true;
        console.log('✅ Auth state loaded:', this.currentUser);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        this.clearAuthState();
      }
    } else {
      this.isLoggedIn = false;
      this.currentUser = null;
    }
  }

  clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.currentUser = null;
  }

  updateNavigation() {
    console.log('🔄 Updating navigation, isLoggedIn:', this.isLoggedIn);
    
    const authLink = document.getElementById('authLink');
    const navMenu = document.getElementById('navMenu');
    
    if (!authLink || !navMenu) {
      console.warn('⚠️ Navigation elements not found');
      return;
    }

    if (this.isLoggedIn) {
      // Show logout and user menu
      authLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
      authLink.href = '#/logout';
      authLink.title = `Logout (${this.currentUser?.name || 'User'})`;
      
      // Show authenticated menu items
      this.showAuthenticatedMenu(navMenu);
    } else {
      // Show login
      authLink.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
      authLink.href = '#/login';
      authLink.title = 'Login to your account';
      
      // Hide authenticated menu items
      this.showGuestMenu(navMenu);
    }
  }

  showAuthenticatedMenu(navMenu) {
    // Make sure all menu items are visible for authenticated users
    const menuItems = navMenu.querySelectorAll('li');
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (link) {
        const href = link.getAttribute('href');
        // Show all menu items for authenticated users
        item.style.display = '';
      }
    });
  }

  showGuestMenu(navMenu) {
    // Hide certain menu items for guests
    const menuItems = navMenu.querySelectorAll('li');
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (link) {
        const href = link.getAttribute('href');
        // Hide authenticated-only menu items
        if (href === '#/add' || href === '#/favorites' || href === '#/settings') {
          item.style.display = 'none';
        } else {
          item.style.display = '';
        }
      }
    });
  }
}

// ✅ Setup global configuration
window.APP_CONFIG = {
  BASE_PATH: typeof __BASE_PATH__ !== 'undefined' ? __BASE_PATH__ : '',
  IS_PRODUCTION: typeof __IS_PRODUCTION__ !== 'undefined' ? __IS_PRODUCTION__ : false,
  IS_GITHUB_PAGES: typeof __IS_GITHUB_PAGES__ !== 'undefined' ? __IS_GITHUB_PAGES__ : false,
  PUBLIC_PATH: typeof __PUBLIC_PATH__ !== 'undefined' ? __PUBLIC_PATH__ : '/',
  BUILD_TIMESTAMP: typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : new Date().toISOString(),
  VERSION: typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.0.0'
};

window.BASE_PATH = window.APP_CONFIG.BASE_PATH;
window.IS_PRODUCTION = window.APP_CONFIG.IS_PRODUCTION;

console.log('🚀 StoryMaps Enhanced starting...');
console.log('🔧 App Config:', window.APP_CONFIG);

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('📱 DOM loaded, initializing app...');
    
    // ✅ Initialize auth manager first
    const authManager = new AuthManager();
    window.authManager = authManager; // Make it globally accessible
    
    // Initialize router
    const router = new Router();
    router.init();
    
    // ✅ Setup mobile navigation toggle
    setupMobileNavigation();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      await registerSW();
    }
    
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

// ✅ TAMBAH: Mobile navigation setup
function setupMobileNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      
      // Update toggle icon
      const icon = navToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    });
    
    // Close menu when clicking menu items
    navMenu.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        navMenu.classList.remove('active');
        const icon = navToggle.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-bars';
        }
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
        const icon = navToggle.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-bars';
        }
      }
    });
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('🎯 App script loaded');