// src/scripts/app.js - Complete Enhanced Version
import '../styles/main.css';
import { Router } from './router.js';
import { registerSW } from './utils/sw-register.js';

class App {
constructor() {
  this.router = new Router();
  this.setupGlobalErrorHandlers(); // ✨ Add this
  this.init();
}

  async init() {
    try {
      console.log('🚀 Initializing StoryMaps with MVP pattern...');
      
      this.checkViewTransitionSupport();
      this.initUI();
      
      await this.initServiceWorker();
      
      this.router.init();
      this.initNetworkStatus();
      this.initDebugTools();
      
      console.log('✅ StoryMaps initialized successfully');
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.showInitError(error);
    }
  }

  async initServiceWorker() {
    try {
      console.log('🔧 Initializing Service Worker...');
      
      const registration = await registerSW();
      
      if (registration) {
        console.log('✅ Service Worker initialized successfully');
      } else {
        console.log('⚠️ Service Worker not available');
      }
      
    } catch (error) {
      console.error('❌ Service Worker initialization failed:', error);
    }
  }

  checkViewTransitionSupport() {
    if (document.startViewTransition) {
      console.log('✅ View Transition API supported');
      document.body.classList.add('view-transitions-supported');
    } else {
      console.log('⚠️ View Transition API not supported, using fallback');
      document.body.classList.add('view-transitions-fallback');
    }
  }
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      
      // Prevent default browser error handling
      event.preventDefault();
      
      // Check if it's a presenter destroyed error
      if (event.reason && event.reason.message && event.reason.message.includes('destroyed')) {
        console.warn('⚠️ Ignoring presenter destroyed error in unhandled rejection');
        return;
      }
      
      // Handle other errors
      this.handleGlobalError(event.reason);
    });
    
    // Handle general errors
    window.addEventListener('error', (event) => {
      console.error('🚨 Global error:', event.error);
      
      // Check if it's a presenter destroyed error
      if (event.error && event.error.message && event.error.message.includes('destroyed')) {
        console.warn('⚠️ Ignoring presenter destroyed error in global error');
        return;
      }
      
      this.handleGlobalError(event.error);
    });
  }

  handleGlobalError(error) {
    // Don't show error for presenter lifecycle issues
    if (error && error.message && error.message.includes('destroyed')) {
      return;
    }
    
    // Show user-friendly error message
    if (window.Swal) {
      window.Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
        text: 'An unexpected error occurred. Please try refreshing the page.',
        confirmButtonText: 'Reload Page',
        confirmButtonColor: '#00d4ff'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    }
  }
  initUI() {
    try {
      const navToggle = document.getElementById('navToggle');
      const navMenu = document.getElementById('navMenu');
      
      if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
          navMenu.classList.toggle('active');
        });

        navMenu.addEventListener('click', (e) => {
          if (e.target.classList.contains('nav-link')) {
            navMenu.classList.remove('active');
            
            document.querySelectorAll('.nav-link').forEach(link => {
              link.classList.remove('active');
            });
            e.target.classList.add('active');
          }
        });
      }

      this.updateAuthLink();
      
      document.addEventListener('authChange', () => {
        this.updateAuthLink();
      });
      
    } catch (error) {
      console.error('UI initialization error:', error);
    }
  }

  updateAuthLink() {
    try {
      const authLink = document.getElementById('authLink');
      
      if (!authLink) return;

      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          const userName = user?.name || 'User';
          authLink.textContent = `Logout (${userName})`;
          authLink.href = '#/logout';
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          authLink.textContent = 'Login';
          authLink.href = '#/login';
        }
      } else {
        authLink.textContent = 'Login';
        authLink.href = '#/login';
      }
    } catch (error) {
      console.error('Error updating auth link:', error);
    }
  }

  initNetworkStatus() {
    try {
      const statusEl = document.getElementById('networkStatus');
      
      if (!statusEl) return;
      
      const updateStatus = () => {
        if (navigator.onLine) {
          statusEl.innerHTML = '<i class="fas fa-wifi"></i> <span>Online</span>';
          statusEl.classList.remove('offline');
          statusEl.classList.remove('hidden');
          setTimeout(() => statusEl.classList.add('hidden'), 2000);
        } else {
          statusEl.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Offline</span>';
          statusEl.classList.add('offline');
          statusEl.classList.remove('hidden');
        }
      };

      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
      
    } catch (error) {
      console.error('Network status initialization error:', error);
    }
  }

  initDebugTools() {
    if (typeof window !== 'undefined') {
      window.debugNotifications = {
        checkSupport: () => {
          console.log('=== NOTIFICATION SUPPORT CHECK ===');
          console.log('ServiceWorker:', 'serviceWorker' in navigator);
          console.log('PushManager:', 'PushManager' in window);
          console.log('Notification:', 'Notification' in window);
          console.log('Permission:', Notification.permission);
          console.log('User Agent:', navigator.userAgent);
        },
        
        showBanner: async () => {
          const { notificationPermission } = await import('./components/notification-permission.js');
          notificationPermission.forceShow();
        },
        
        // ✨ ENHANCED: Test notification with fallbacks
        testNotification: async () => {
          try {
            console.log('🧪 Testing notifications...');
            
            // Method 1: Direct notification
            if (Notification.permission === 'granted') {
              new Notification('Direct Test 🎯', {
                body: 'This is a direct notification test!',
                icon: '/icon-192.png'
              });
              console.log('✅ Direct notification sent');
              return;
            }
            
            // Method 2: Request permission first
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              new Notification('Permission Test ✅', {
                body: 'Permission granted! Notification working.',
                icon: '/icon-192.png'
              });
              console.log('✅ Permission granted and notification sent');
              return;
            }
            
            console.log('❌ Permission not granted:', permission);
            
          } catch (error) {
            console.error('❌ Test notification failed:', error);
          }
        },
        
        // ✨ NEW: Test push subscription
        testPushSubscription: async () => {
          try {
            const { pushManager } = await import('./utils/push-manager.js');
            await pushManager.init();
            const subscription = await pushManager.subscribe();
            console.log('✅ Push subscription successful:', subscription);
            await pushManager.sendTestNotification();
          } catch (error) {
            console.error('❌ Push subscription failed:', error);
            
            // Fallback to direct notification
            if (Notification.permission === 'granted') {
              new Notification('Fallback Test 🔄', {
                body: 'Push subscription failed, but direct notifications work!',
                icon: '/icon-192.png'
              });
            }
          }
        },
        
        checkPermission: async () => {
          const permission = await Notification.requestPermission();
          console.log('Permission result:', permission);
          return permission;
        },
        
        reset: () => {
          localStorage.removeItem('notificationPermissionDismissed');
          localStorage.removeItem('pushSubscription');
          console.log('Reset complete');
        },
        
        // ✨ NEW: Test all methods
        testAll: async () => {
          console.log('🧪 Testing all notification methods...');
          
          try {
            // 1. Check support
            window.debugNotifications.checkSupport();
            
            // 2. Request permission
            const permission = await window.debugNotifications.checkPermission();
            
            if (permission === 'granted') {
              // 3. Test direct notification
              await window.debugNotifications.testNotification();
              
              // 4. Test push subscription
              await window.debugNotifications.testPushSubscription();
              
              console.log('✅ All tests completed');
            } else {
              console.log('❌ Permission not granted, skipping notification tests');
            }
            
          } catch (error) {
            console.error('❌ Test all failed:', error);
          }
        }
      };

      window.debugNotifications.checkSupport();
    }
  }

  showInitError(error) {
    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="card text-center" style="max-width: 500px; margin: 2rem auto; padding: 2rem; view-transition-name: error-content;">
          <div style="color: #dc3545; font-size: 3rem; margin-bottom: 1rem;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2 style="color: #dc3545;">Initialization Error</h2>
          <p style="color: #666; margin: 1rem 0;">${error.message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary">
            <i class="fas fa-redo"></i> Reload App
          </button>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
  } catch (error) {
    console.error('Fatal app error:', error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 2rem; font-family: Arial, sans-serif;">
        <h1 style="color: #dc3545;">Application Error</h1>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload
        </button>
      </div>
    `;
  }
});