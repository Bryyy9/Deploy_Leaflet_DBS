// src/scripts/views/settings.js - FIXED EVENT LISTENER VERSION
export class SettingsView {
  constructor() {
    this.requiresAuth = true;
    this.eventListeners = new Map();
    this.isDestroyed = false;
    this.isProcessing = false; // ✅ Add processing flag
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
    if (this.isDestroyed) return;
    
    try {
      await this.loadNotificationStatus();
      await this.loadAppInfo();
      await this.loadStorageInfo();
      this.initEventListeners();
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  initEventListeners() {
    if (this.isDestroyed) return;
    
    console.log('🎮 Initializing event listeners...');
    
    // ✅ FIXED: Clear existing listeners completely
    this.clearEventListeners();
    
    // Add event listeners
    this.addEventListenerSafe('testNotification', 'click', this.handleTestNotification.bind(this));
    this.addEventListenerSafe('clearCache', 'click', this.handleClearCache.bind(this));
    
    console.log('✅ Event listeners initialized');
  }

  // ✅ FIXED: Better event listener management
  addEventListenerSafe(elementId, event, handler) {
    if (this.isDestroyed) return;
    
    const element = document.getElementById(elementId);
    if (element) {
      // ✅ Remove any existing listener first
      this.removeEventListenerSafe(elementId);
      
      // Add new listener
      element.addEventListener(event, handler);
      this.eventListeners.set(elementId, { element, event, handler });
      
      console.log(`🎧 Added event listener: ${elementId} -> ${event}`);
    } else {
      console.warn(`⚠️ Element not found: ${elementId}`);
    }
  }

  // ✅ FIXED: Remove specific event listener
  removeEventListenerSafe(elementId) {
    if (this.eventListeners.has(elementId)) {
      const listener = this.eventListeners.get(elementId);
      if (listener.element && listener.handler) {
        listener.element.removeEventListener(listener.event, listener.handler);
        console.log(`🗑️ Removed event listener: ${elementId}`);
      }
      this.eventListeners.delete(elementId);
    }
  }

  clearEventListeners() {
    this.eventListeners.forEach((listener, key) => {
      if (listener.element && listener.handler) {
        listener.element.removeEventListener(listener.event, listener.handler);
        console.log(`🗑️ Cleared event listener: ${key}`);
      }
    });
    this.eventListeners.clear();
  }

  async loadNotificationStatus() {
    if (this.isDestroyed) return;
    
    console.log('🔔 Loading notification status...');
    
    const statusEl = document.getElementById('notificationStatus');
    if (!statusEl) return;

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
      
      // ✅ FIXED: Update HTML
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
                    ${buttonDisabled ? 'disabled' : ''}
                    data-enabled="${status.isSubscribed}">
              <i class="fas ${statusIcon}"></i>
              <span class="btn-text">${buttonText}</span>
            </button>
          </div>
        </div>
      `;
      
      // ✅ FIXED: Add notification toggle listener
      if (!this.isDestroyed) {
        setTimeout(() => {
          this.addNotificationToggleListener();
        }, 100);
      }
      
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
      `;
    }
  }

  // ✅ FIXED: Notification toggle listener
  addNotificationToggleListener() {
    if (this.isDestroyed) return;
    
    console.log('🔔 Adding notification toggle listener...');
    
    // ✅ Remove existing listener first
    this.removeEventListenerSafe('notificationToggle');
    
    const toggleBtn = document.getElementById('notificationToggle');
    
    if (toggleBtn) {
      const handler = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // ✅ FIXED: Prevent multiple clicks during processing
        if (this.isProcessing || toggleBtn.disabled) {
          console.log('⚠️ Already processing or button disabled');
          return;
        }
        
        console.log('🔔 Notification toggle clicked!');
        await this.handleNotificationToggle();
      };
      
      toggleBtn.addEventListener('click', handler);
      this.eventListeners.set('notificationToggle', { 
        element: toggleBtn, 
        event: 'click',
        handler 
      });
      
      console.log('✅ Notification toggle listener added');
    }
  }

  async handleNotificationToggle() {
    if (this.isDestroyed || this.isProcessing) return;
    
    console.log('🔔 handleNotificationToggle called');
    
    // ✅ FIXED: Set processing flag
    this.isProcessing = true;
    
    const toggleBtn = document.getElementById('notificationToggle');
    
    if (!toggleBtn) {
      this.isProcessing = false;
      return;
    }
    
    const originalHTML = toggleBtn.innerHTML;
    const originalDisabled = toggleBtn.disabled;
    
    try {
      // ✅ Show loading state
      toggleBtn.disabled = true;
      toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Please wait...</span>';
      
      const { pushManager } = await import('../utils/push-manager.js');
      const { Alert } = await import('../utils/alert.js');
      
      await pushManager.init();
      const status = pushManager.getSubscriptionStatus();
      
      console.log('📊 Current status before toggle:', status);
      
      if (status.isSubscribed) {
        console.log('🗑️ Unsubscribing...');
        await pushManager.unsubscribe();
        Alert.success('Notifications disabled successfully');
      } else {
        console.log('📝 Subscribing...');
        await pushManager.subscribe();
        Alert.success('Notifications enabled successfully');
      }
      
      // ✅ FIXED: Reload status after successful toggle
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
      
      // ✅ Restore button state on error
      if (toggleBtn) {
        toggleBtn.innerHTML = originalHTML;
        toggleBtn.disabled = originalDisabled;
      }
    } finally {
      // ✅ FIXED: Always reset processing flag
      this.isProcessing = false;
    }
  }

  async handleTestNotification() {
    if (this.isDestroyed) return;
    
    const testBtn = document.getElementById('testNotification');
    if (!testBtn || testBtn.disabled) return;
    
    const originalText = testBtn.innerHTML;
    
    try {
      testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      testBtn.disabled = true;
      
      const { pushManager } = await import('../utils/push-manager.js');
      const { Alert } = await import('../utils/alert.js');
      
      await pushManager.sendTestNotification();
      Alert.success('Test notification sent! Check your notifications.');
      
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      
      const { Alert } = await import('../utils/alert.js');
      Alert.error('Failed to send test notification: ' + error.message);
    } finally {
      if (testBtn && !this.isDestroyed) {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
      }
    }
  }

  async handleClearCache() {
    if (this.isDestroyed) return;
    
    try {
      const { Alert } = await import('../utils/alert.js');
      
      const result = await Alert.confirm(
        'This will clear all cached data. Continue?',
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
    if (this.isDestroyed) return;
    
    const swStatusEl = document.getElementById('swStatus');
    const pushSupportEl = document.getElementById('pushSupport');
    
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        if (swStatusEl) {
          swStatusEl.innerHTML = `
            <span class="status-badge enabled">
              <i class="fas fa-check"></i> Active
            </span>
          `;
        }
      } else {
        if (swStatusEl) {
          swStatusEl.innerHTML = `
            <span class="status-badge disabled">
              <i class="fas fa-times"></i> Not Available
            </span>
          `;
        }
      }
    } catch (error) {
      if (swStatusEl) {
        swStatusEl.innerHTML = `
          <span class="status-badge disabled">
            <i class="fas fa-times"></i> Error
          </span>
        `;
      }
    }
    
    try {
      const { pushManager } = await import('../utils/push-manager.js');
      const pushSupported = pushManager.isSupported;
      if (pushSupportEl) {
        pushSupportEl.innerHTML = pushSupported ? `
          <span class="status-badge enabled">
            <i class="fas fa-check"></i> Supported
          </span>
        ` : `
          <span class="status-badge disabled">
            <i class="fas fa-times"></i> Not Supported
          </span>
        `;
      }
    } catch (error) {
      if (pushSupportEl) {
        pushSupportEl.innerHTML = `
          <span class="status-badge disabled">
            <i class="fas fa-times"></i> Error
          </span>
        `;
      }
    }
  }

  async loadStorageInfo() {
    if (this.isDestroyed) return;
    
    const cachedStoriesEl = document.getElementById('cachedStories');
    const favoriteStoriesEl = document.getElementById('favoriteStories');
    
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        if (cachedStoriesEl) {
          cachedStoriesEl.textContent = `${cacheNames.length} cache(s)`;
        }
      }
      
      try {
        const { storage } = await import('../data/storage.js');
        await storage.init();
        const favorites = await storage.getFavorites();
        if (favoriteStoriesEl) {
          favoriteStoriesEl.textContent = `${favorites.length} stories`;
        }
      } catch (error) {
        if (favoriteStoriesEl) {
          favoriteStoriesEl.textContent = 'Error loading';
        }
      }
      
    } catch (error) {
      if (cachedStoriesEl) cachedStoriesEl.textContent = 'Error loading';
      if (favoriteStoriesEl) favoriteStoriesEl.textContent = 'Error loading';
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up SettingsView...');
    this.isDestroyed = true;
    this.isProcessing = false;
    this.clearEventListeners();
  }
}

export default SettingsView;