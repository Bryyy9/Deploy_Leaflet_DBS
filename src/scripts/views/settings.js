// src/scripts/views/settings.js - FIXED VERSION
export class SettingsView {
  constructor() {
    this.requiresAuth = true;
    this.eventListeners = new Map(); // Track event listeners
  }

  async render() {
    return `
      <div class="settings-view">
        <div class="settings-header">
          <h1 class="page-title">
            <i class="fas fa-cog"></i>
            Settings
          </h1>
          <p class="page-subtitle">
            Manage your app preferences and notifications
          </p>
        </div>

        <!-- Notification Settings -->
        <div class="notification-settings">
          <h3>
            <i class="fas fa-bell"></i>
            Push Notifications
          </h3>
          
          <div id="notificationStatus" class="notification-status">
            <div class="status-info">
              <div class="status-icon">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <div class="status-text">
                <h6>Checking status...</h6>
                <p>Please wait while we check your notification settings</p>
              </div>
            </div>
            <div class="status-actions">
              <div id="notificationToggleContainer">
                <button id="notificationToggle" class="btn btn-secondary btn-sm" disabled>
                  <i class="fas fa-spinner fa-spin"></i>
                  Loading...
                </button>
              </div>
            </div>
          </div>

          <div class="notification-info">
            <h6><i class="fas fa-info-circle"></i> About Notifications</h6>
            <ul>
              <li>Get notified when your stories are successfully shared</li>
              <li>Receive updates about new features and improvements</li>
              <li>You can disable notifications at any time</li>
              <li>Notifications work even when the app is closed</li>
            </ul>
          </div>

          <div class="notification-actions">
            <button id="testNotification" class="btn btn-secondary" disabled>
              <i class="fas fa-test-tube"></i>
              Send Test Notification
            </button>
          </div>
        </div>

        <!-- App Information -->
        <div class="app-info-section">
          <h3>
            <i class="fas fa-info-circle"></i>
            App Information
          </h3>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Version</div>
              <div class="info-value">1.0.0</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Service Worker</div>
              <div class="info-value" id="swStatus">Checking...</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Offline Support</div>
              <div class="info-value">
                <span class="status-badge enabled">
                  <i class="fas fa-check"></i> Available
                </span>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Push Notifications</div>
              <div class="info-value" id="pushSupport">Checking...</div>
            </div>
          </div>
        </div>

        <!-- Storage Information -->
        <div class="storage-section">
          <h3>
            <i class="fas fa-database"></i>
            Storage & Data
          </h3>
          
          <div class="storage-info">
            <div class="storage-item">
              <div class="storage-label">Cached Stories</div>
              <div class="storage-value" id="cachedStories">Loading...</div>
            </div>
            
            <div class="storage-item">
              <div class="storage-label">Favorite Stories</div>
              <div class="storage-value" id="favoriteStories">Loading...</div>
            </div>
          </div>
          
          <div class="storage-actions">
            <button id="clearCache" class="btn btn-warning">
              <i class="fas fa-trash-alt"></i>
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      await this.loadNotificationStatus();
      await this.loadAppInfo();
      await this.loadStorageInfo();
      this.initEventListeners();
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  // ✅ FIXED: Simplified event listeners
  initEventListeners() {
    console.log('🎮 Initializing event listeners...');
    
    // Clear existing listeners
    this.clearEventListeners();
    
    // Test notification button
    const testBtn = document.getElementById('testNotification');
    if (testBtn) {
      const testHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleTestNotification();
      };
      testBtn.addEventListener('click', testHandler);
      this.eventListeners.set('testNotification', { element: testBtn, handler: testHandler });
    }
    
    // Clear cache button
    const clearBtn = document.getElementById('clearCache');
    if (clearBtn) {
      const clearHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleClearCache();
      };
      clearBtn.addEventListener('click', clearHandler);
      this.eventListeners.set('clearCache', { element: clearBtn, handler: clearHandler });
    }
    
    console.log('✅ Event listeners initialized');
  }

  // ✅ FIXED: Attach notification toggle listener after button is created
  attachNotificationToggleListener() {
    const toggleBtn = document.getElementById('notificationToggle');
    
    if (toggleBtn && !this.eventListeners.has('notificationToggle')) {
      console.log('🔔 Attaching notification toggle listener...');
      
      const toggleHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔔 Notification toggle clicked!');
        await this.handleNotificationToggle();
      };
      
      toggleBtn.addEventListener('click', toggleHandler);
      this.eventListeners.set('notificationToggle', { 
        element: toggleBtn, 
        handler: toggleHandler 
      });
      
      console.log('✅ Notification toggle listener attached');
    }
  }

  clearEventListeners() {
    this.eventListeners.forEach((listener, key) => {
      if (listener.element && listener.handler) {
        listener.element.removeEventListener('click', listener.handler);
      }
    });
    this.eventListeners.clear();
  }

  async loadNotificationStatus() {
    console.log('🔔 Loading notification status...');
    
    const statusEl = document.getElementById('notificationStatus');

    try {
      const { pushManager } = await import('../utils/push-manager.js');
      const status = pushManager.getSubscriptionStatus();
      
      console.log('📊 Notification status:', status);
      
      let statusClass = 'disabled';
      let statusIcon = 'fa-bell-slash';
      let statusTitle = 'Notifications Disabled';
      let statusText = 'Push notifications are not enabled';
      let buttonText = 'Enable Notifications';
      let buttonClass = 'btn-primary';
      let buttonDisabled = false;
      
      if (!status.isSupported) {
        statusTitle = 'Not Supported';
        statusText = 'Push notifications are not supported in this browser';
        buttonText = 'Not Available';
        buttonDisabled = true;
        buttonClass = 'btn-secondary';
      } else if (status.permission === 'denied') {
        statusTitle = 'Permission Denied';
        statusText = 'Notifications blocked. Please enable in browser settings.';
        buttonText = 'Blocked';
        buttonDisabled = true;
        buttonClass = 'btn-secondary';
      } else if (status.isSubscribed) {
        statusClass = 'enabled';
        statusIcon = 'fa-bell';
        statusTitle = 'Notifications Enabled';
        statusText = 'You will receive push notifications';
        buttonText = 'Disable Notifications';
        buttonClass = 'btn-danger';
        
        const testBtn = document.getElementById('testNotification');
        if (testBtn) testBtn.disabled = false;
      }
      
      // ✅ FIXED: Update status container with proper structure
      statusEl.className = `notification-status ${statusClass}`;
      statusEl.innerHTML = `
        <div class="status-info">
          <div class="status-icon ${statusClass}">
            <i class="fas ${statusIcon}"></i>
          </div>
          <div class="status-text">
            <h6>${statusTitle}</h6>
            <p>${statusText}</p>
          </div>
        </div>
        <div class="status-actions">
          <div id="notificationToggleContainer">
            <button id="notificationToggle" 
                    class="btn ${buttonClass} btn-sm notification-toggle-btn"
                    ${buttonDisabled ? 'disabled' : ''}>
              <i class="fas ${statusIcon}"></i>
              <span class="btn-text">${buttonText}</span>
            </button>
          </div>
        </div>
      `;
      
      // ✅ FIXED: Attach listener after button is created
      setTimeout(() => {
        this.attachNotificationToggleListener();
      }, 100);
      
      console.log('✅ Notification status updated');
      
    } catch (error) {
      console.error('❌ Error loading notification status:', error);
      statusEl.innerHTML = `
        <div class="status-info">
          <div class="status-icon disabled">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="status-text">
            <h6>Error</h6>
            <p>Failed to load notification status</p>
          </div>
        </div>
        <div class="status-actions">
          <div id="notificationToggleContainer">
            <button id="notificationToggle" class="btn btn-secondary btn-sm" disabled>
              <i class="fas fa-exclamation-triangle"></i>
              <span class="btn-text">Error</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  async handleNotificationToggle() {
    console.log('🔔 handleNotificationToggle called');
    
    const toggleBtn = document.getElementById('notificationToggle');
    
    if (!toggleBtn) {
      console.error('❌ Toggle button not found');
      return;
    }
    
    if (toggleBtn.disabled) {
      console.log('⚠️ Button is disabled, ignoring click');
      return;
    }
    
    const originalHTML = toggleBtn.innerHTML;
    
    try {
      console.log('🔄 Starting notification toggle...');
      
      // Show loading state
      toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Please wait...</span>';
      toggleBtn.disabled = true;
      
      const { pushManager } = await import('../utils/push-manager.js');
      const { Alert } = await import('../utils/alert.js');
      
      await pushManager.init();
      const status = pushManager.getSubscriptionStatus();
      
      console.log('📊 Current status before toggle:', status);
      
      if (status.isSubscribed) {
        // Unsubscribe
        console.log('🗑️ Unsubscribing...');
        await pushManager.unsubscribe();
        Alert.success('Notifications disabled successfully');
      } else {
        // Subscribe
        console.log('📝 Subscribing...');
        await pushManager.subscribe();
        Alert.success('Notifications enabled successfully');
      }
      
      // Reload status
      console.log('🔄 Reloading notification status...');
      await this.loadNotificationStatus();
      
    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
      
      const { Alert } = await import('../utils/alert.js');
      
      let errorMessage = 'Failed to update notification settings';
      if (error.message.includes('denied')) {
        errorMessage = 'Permission denied. Please enable notifications in browser settings.';
      } else if (error.message.includes('not supported')) {
        errorMessage = 'Push notifications are not supported in this browser.';
      }
      
      Alert.error(errorMessage);
      
      // Restore button
      if (toggleBtn) {
        toggleBtn.innerHTML = originalHTML;
        toggleBtn.disabled = false;
      }
    }
  }

  async handleTestNotification() {
    console.log('🧪 handleTestNotification called');
    
    const testBtn = document.getElementById('testNotification');
    const originalText = testBtn ? testBtn.innerHTML : '';
    
    try {
      if (testBtn) {
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        testBtn.disabled = true;
      }
      
      const { pushManager } = await import('../utils/push-manager.js');
      const { Alert } = await import('../utils/alert.js');
      
      await pushManager.sendTestNotification();
      Alert.success('Test notification sent! Check your notifications.');
      
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      
      const { Alert } = await import('../utils/alert.js');
      Alert.error('Failed to send test notification: ' + error.message);
    } finally {
      if (testBtn) {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
      }
    }
  }

  async handleClearCache() {
    try {
      const { Alert } = await import('../utils/alert.js');
      
      const result = await Alert.confirm(
        'This will clear all cached data. You may need to reload the app. Continue?',
        'Clear Cache'
      );
      
      if (!result.isConfirmed) return;
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      Alert.success('Cache cleared successfully');
      await this.loadStorageInfo();
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      
      const { Alert } = await import('../utils/alert.js');
      Alert.error('Failed to clear cache: ' + error.message);
    }
  }

  async loadAppInfo() {
    // Service Worker Status
    const swStatusEl = document.getElementById('swStatus');
    const pushSupportEl = document.getElementById('pushSupport');
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        swStatusEl.innerHTML = `
          <span class="status-badge enabled">
            <i class="fas fa-check"></i> Active
          </span>
        `;
      } else {
        swStatusEl.innerHTML = `
          <span class="status-badge disabled">
            <i class="fas fa-times"></i> Not Available
          </span>
        `;
      }
    } catch (error) {
      swStatusEl.innerHTML = `
        <span class="status-badge disabled">
          <i class="fas fa-times"></i> Error
        </span>
      `;
    }
    
    // Push Support
    try {
      const { pushManager } = await import('../utils/push-manager.js');
      const pushSupported = pushManager.isSupported;
      pushSupportEl.innerHTML = pushSupported ? `
        <span class="status-badge enabled">
          <i class="fas fa-check"></i> Supported
        </span>
      ` : `
        <span class="status-badge disabled">
          <i class="fas fa-times"></i> Not Supported
        </span>
      `;
    } catch (error) {
      pushSupportEl.innerHTML = `
        <span class="status-badge disabled">
          <i class="fas fa-times"></i> Error
        </span>
      `;
    }
  }

  async loadStorageInfo() {
    const cachedStoriesEl = document.getElementById('cachedStories');
    const favoriteStoriesEl = document.getElementById('favoriteStories');
    
    try {
      // Load cached stories count
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        cachedStoriesEl.textContent = `${cacheNames.length} cache(s)`;
      } else {
        cachedStoriesEl.textContent = 'Not available';
      }
      
      // Load favorites count
      try {
        const { storage } = await import('../data/storage.js');
        await storage.init();
        const favorites = await storage.getFavorites();
        favoriteStoriesEl.textContent = `${favorites.length} stories`;
      } catch (error) {
        favoriteStoriesEl.textContent = 'Error loading';
      }
      
    } catch (error) {
      cachedStoriesEl.textContent = 'Error loading';
      favoriteStoriesEl.textContent = 'Error loading';
    }
  }

  // ✅ FIXED: Cleanup method
  cleanup() {
    console.log('🧹 Cleaning up SettingsView...');
    this.clearEventListeners();
  }
}

export default SettingsView;