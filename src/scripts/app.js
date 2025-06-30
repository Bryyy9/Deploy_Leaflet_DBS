// src/scripts/app.js - FIXED AUTH MANAGER
import '../styles/main.css';
import { Router } from './router.js';
import { registerSW } from './utils/sw-register.js';

// ✅ FIX: Prevent multiple initializations
let isAppInitialized = false;

// ✅ FIXED: Enhanced Auth state management
class AuthManager {
  constructor() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      console.warn('⚠️ AuthManager already initialized, skipping...');
      return;
    }
    
    console.log('🔐 Initializing AuthManager...');
    
    this.loadAuthState();
    this.setupEventListeners();
    this.updateNavigation();
    
    this.isInitialized = true;
    console.log('✅ AuthManager initialized');
  }

  loadAuthState() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    console.log('🔍 Loading auth state:', { hasToken: !!token, hasUser: !!userJson });
    
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
      console.log('📝 No auth state found');
    }
  }

  setupEventListeners() {
    // ✅ Listen for auth changes
    document.addEventListener('authChange', (event) => {
      console.log('📡 Auth change event received:', event.detail);
      const { isLoggedIn, user } = event.detail;
      this.isLoggedIn = isLoggedIn;
      this.currentUser = user;
      this.updateNavigation();
    });

    // ✅ Listen for storage changes (multi-tab support)
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' || event.key === 'user') {
        console.log('🔄 Storage changed, reloading auth state');
        this.loadAuthState();
        this.updateNavigation();
      }
    });
  }

  clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.currentUser = null;
    console.log('🗑️ Auth state cleared');
  }

  updateNavigation() {
    console.log('🔄 Updating navigation, isLoggedIn:', this.isLoggedIn);
    
    const authLink = document.getElementById('authLink');
    const navMenu = document.getElementById('navMenu');
    
    if (!authLink) {
      console.warn('⚠️ Auth link element not found');
      return;
    }

    if (!navMenu) {
      console.warn('⚠️ Nav menu element not found');
      return;
    }

    if (this.isLoggedIn && this.currentUser) {
      // ✅ Show logout button
      authLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
      authLink.href = '#/logout';
      authLink.title = `Logout (${this.currentUser.name || 'User'})`;
      
      console.log('✅ Updated to logout button for:', this.currentUser.name);
      
      this.showAuthenticatedMenu(navMenu);
    } else {
      // ✅ Show login button
      authLink.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
      authLink.href = '#/login';
      authLink.title = 'Login to your account';
      
      console.log('✅ Updated to login button');
      
      this.showGuestMenu(navMenu);
    }
  }

  showAuthenticatedMenu(navMenu) {
    const menuItems = navMenu.querySelectorAll('li');
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (link) {
        // Show all menu items for authenticated users
        item.style.display = '';
      }
    });
    console.log('👤 Showing authenticated menu');
  }

  showGuestMenu(navMenu) {
    const menuItems = navMenu.querySelectorAll('li');
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (link) {
        const href = link.getAttribute('href');
        // Hide auth-required pages for guests
        if (href === '#/add' || href === '#/favorites' || href === '#/settings') {
          item.style.display = 'none';
        } else {
          item.style.display = '';
        }
      }
    });
    console.log('👥 Showing guest menu');
  }

  // ✅ Manual methods for testing
  forceLogin(user) {
    this.isLoggedIn = true;
    this.currentUser = user;
    this.updateNavigation();
    console.log('🔧 Force login applied:', user);
  }

  forceLogout() {
    this.clearAuthState();
    this.updateNavigation();
    console.log('🔧 Force logout applied');
  }
}

// ✅ Setup global configuration
window.APP_CONFIG = {
  BASE_PATH: typeof __BASE_PATH__ !== 'undefined' ? __BASE_PATH__ : '',
  IS_PRODUCTION: typeof __IS_PRODUCTION__ !== 'undefined' ? __IS_PRODUCTION__ : false,
  IS_DEVELOPMENT: typeof __IS_DEVELOPMENT__ !== 'undefined' ? __IS_DEVELOPMENT__ : true,
  IS_GITHUB_PAGES: typeof __IS_GITHUB_PAGES__ !== 'undefined' ? __IS_GITHUB_PAGES__ : false,
  PUBLIC_PATH: typeof __PUBLIC_PATH__ !== 'undefined' ? __PUBLIC_PATH__ : '/',
  BUILD_TIMESTAMP: typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : new Date().toISOString(),
  VERSION: typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.0.0'
};

window.BASE_PATH = window.APP_CONFIG.BASE_PATH;
window.IS_PRODUCTION = window.APP_CONFIG.IS_PRODUCTION;

console.log('🚀 StoryMaps Enhanced starting...');
console.log('🔧 App Config:', window.APP_CONFIG);

// ✅ FIX: Setup mobile navigation toggle
function setupMobileNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (navToggle && navMenu) {
    // Remove existing listeners to prevent duplicates
    const existingHandler = navToggle._clickHandler;
    if (existingHandler) {
      navToggle.removeEventListener('click', existingHandler);
    }
    
    const clickHandler = () => {
      navMenu.classList.toggle('active');
      
      const icon = navToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    };
    
    navToggle.addEventListener('click', clickHandler);
    navToggle._clickHandler = clickHandler;
    
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

// ✅ FIX: Initialize app function
async function initializeApp() {
  if (isAppInitialized) {
    console.warn('⚠️ App already initialized, skipping...');
    return;
  }
  
  try {
    console.log('📱 DOM loaded, initializing app...');
    
    // Mark as initialized early to prevent duplicate calls
    isAppInitialized = true;
    
    // ✅ Wait a bit for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize auth manager first
    const authManager = new AuthManager();
    authManager.init();
    
    // ✅ Make authManager globally accessible for debugging
    window.authManager = authManager;
    
    // Initialize router
    const router = new Router();
    router.init();
    
    // Setup mobile navigation
    setupMobileNavigation();
    
    // ✅ Test auth state update after a short delay
    setTimeout(() => {
      console.log('🔄 Testing auth state update...');
      authManager.updateNavigation();
    }, 500);
    
    // Register service worker (only in production or when explicitly needed)
    if (window.APP_CONFIG.IS_PRODUCTION || window.location.hostname.includes('github.io')) {
      if ('serviceWorker' in navigator) {
        await registerSW();
      }
    } else {
      console.log('🔧 Development mode: Skipping Service Worker registration');
    }
    
    console.log('📋 Build Info:', {
      version: window.APP_CONFIG.VERSION,
      timestamp: window.APP_CONFIG.BUILD_TIMESTAMP,
      production: window.APP_CONFIG.IS_PRODUCTION,
      development: window.APP_CONFIG.IS_DEVELOPMENT,
      githubPages: window.APP_CONFIG.IS_GITHUB_PAGES,
      basePath: window.APP_CONFIG.BASE_PATH
    });
    
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    isAppInitialized = false; // Reset on error
  }
}

// ✅ FIX: Prevent multiple DOM ready listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
  // DOM already loaded
  initializeApp();
}

// ✅ FIX: Webpack Hot Module Replacement
if (module.hot) {
  module.hot.accept();
  
  // Prevent full page reload on CSS changes
  module.hot.accept('../styles/main.css', () => {
    console.log('🎨 CSS updated');
  });
  
  // Handle JS module updates
  module.hot.accept('./router.js', () => {
    console.log('🔄 Router module updated');
  });
  
  module.hot.dispose(() => {
    console.log('🧹 Cleaning up before hot reload...');
    isAppInitialized = false;
  });
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('🎯 App script loaded');