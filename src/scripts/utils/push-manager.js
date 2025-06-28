// src/scripts/utils/push-manager.js - Enhanced debugging
export class PushManager {
  constructor() {
    this.swRegistration = null;
    this.pushSubscription = null;
    this.vapidPublicKey = 'BCVxar7AsITJXXXMh4EUzGIlq7r6oO1wS4ZEw5Qhkr8qdXVOOm7w7VCXJfxZpPUm8e7MqtqVlqVlqVlqVlqVl';
    this.isSupported = this.checkSupport();
    this.permissionStatus = 'default';
    
    console.log('🏗️ PushManager constructed:', {
      isSupported: this.isSupported,
      vapidKey: this.vapidPublicKey.substring(0, 20) + '...',
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isGitHubPages: window.location.hostname.includes('github.io'),
      isLocalhost: window.location.hostname === 'localhost'
    });
  }

  checkSupport() {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';
    
    console.log('🔍 Push notification support check:', {
      serviceWorker: hasServiceWorker,
      pushManager: hasPushManager,
      notification: hasNotification,
      isSecure: isSecure,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      isSupported: hasServiceWorker && hasPushManager && hasNotification && isSecure
    });
    
    if (!isSecure) {
      console.error('❌ HTTPS is required for push notifications in production!');
    }
    
    return hasServiceWorker && hasPushManager && hasNotification && isSecure;
  }

  async init() {
    console.log('🚀 PushManager.init() called');
    
    if (!this.isSupported) {
      console.warn('⚠️ Push notifications not supported');
      return false;
    }

    try {
      console.log('🔧 Registering service worker...');
      
      // Try multiple service worker paths
      const swPaths = [
        '/service-worker.js',
        './service-worker.js'
      ];
      
      // Add base path if available
      if (window.BASE_PATH) {
        swPaths.unshift(`${window.BASE_PATH}/service-worker.js`);
      }
      
      let registered = false;
      for (const swPath of swPaths) {
        try {
          console.log(`🔧 Trying SW path: ${swPath}`);
          this.swRegistration = await navigator.serviceWorker.register(swPath, {
            scope: window.BASE_PATH || '/'
          });
          console.log(`✅ Service Worker registered at: ${swPath}`);
          console.log('✅ SW Scope:', this.swRegistration.scope);
          registered = true;
          break;
        } catch (pathError) {
          console.warn(`⚠️ Failed to register SW at ${swPath}:`, pathError.message);
        }
      }
      
      if (!registered) {
        throw new Error('Could not register service worker at any path');
      }

      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');
      
      this.permissionStatus = Notification.permission;
      console.log('🔐 Current permission status:', this.permissionStatus);
      
      this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (this.pushSubscription) {
        console.log('✅ Existing push subscription found:', this.pushSubscription);
        return true;
      }
      
      console.log('📝 No existing subscription found');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission() {
    console.log('🔐 requestPermission() called');
    
    if (!this.isSupported) {
      const error = new Error('Push notifications not supported');
      console.error('❌', error.message);
      throw error;
    }

    if (this.permissionStatus === 'granted') {
      console.log('✅ Permission already granted');
      return true;
    }

    try {
      console.log('🔐 Requesting notification permission...');
      
      if (this.permissionStatus === 'denied') {
        throw new Error('Notification permission was previously denied. Please enable notifications in your browser settings.');
      }
      
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;
      
      console.log('📋 Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else if (permission === 'denied') {
        console.log('❌ Notification permission denied');
        throw new Error('Notification permission denied');
      } else {
        console.log('⏸️ Notification permission dismissed');
        throw new Error('Notification permission not granted');
      }
      
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      throw error;
    }
  }

  async subscribe() {
    console.log('📝 subscribe() called');
    
    if (!this.isSupported) {
      const error = new Error('Push notifications not supported');
      console.error('❌', error.message);
      throw error;
    }

    if (!this.swRegistration) {
      console.log('⚠️ No service worker registration, initializing...');
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize service worker');
      }
    }

    try {
      console.log('📝 Starting subscription process...');
      
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Permission not granted');
      }
      
      if (this.pushSubscription) {
        console.log('✅ Already subscribed');
        return this.pushSubscription;
      }
      
      console.log('🔑 Creating push subscription...');
      
      // Try multiple approaches
      const subscriptionMethods = [
        // Method 1: With VAPID key
        () => this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        }),
        // Method 2: Without VAPID key
        () => this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true
        }),
        // Method 3: With generated VAPID key
        () => this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.generateTestVapidKey())
        })
      ];
      
      let subscription = null;
      let lastError = null;
      
      for (let i = 0; i < subscriptionMethods.length; i++) {
        try {
          console.log(`🔑 Trying subscription method ${i + 1}...`);
          subscription = await subscriptionMethods[i]();
          console.log(`✅ Subscription successful with method ${i + 1}`);
          break;
        } catch (error) {
          console.warn(`⚠️ Method ${i + 1} failed:`, error.message);
          lastError = error;
        }
      }
      
      if (!subscription) {
        throw lastError || new Error('All subscription methods failed');
      }
      
      this.pushSubscription = subscription;
      this.saveSubscription(subscription);
      
      console.log('✅ Push subscription created successfully');
      console.log('📋 Subscription details:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!subscription.getKey
      });
      
      return subscription;
      
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      
      if (error.name === 'NotSupportedError') {
        throw new Error('Push notifications are not supported in this browser');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Permission to show notifications was denied');
      } else if (error.name === 'AbortError') {
        throw new Error('Subscription was aborted');
      } else if (error.message.includes('VAPID') || error.message.includes('ECDSA')) {
        console.warn('⚠️ VAPID key issue, but subscription might still work for basic notifications');
        // Don't throw error, let it continue
        return null;
      }
      
      throw error;
    }
  }

  async sendTestNotification() {
    console.log('🧪 sendTestNotification() called');
    
    try {
      console.log('🧪 Sending test notification...');
      
      // Method 1: Direct notification (works without push subscription)
      if (Notification.permission === 'granted') {
        const notification = new Notification('StoryMaps Test 🎉', {
          body: 'This is a test notification! Push notifications are working.',
          icon: window.BASE_PATH ? `${window.BASE_PATH}/icon-192.png` : '/icon-192.png',
          badge: window.BASE_PATH ? `${window.BASE_PATH}/icon-192.png` : '/icon-192.png',
          tag: 'test-notification',
          requireInteraction: false,
          timestamp: Date.now(),
          data: {
            url: window.BASE_PATH || '/',
            type: 'test'
          }
        });
        
        notification.onclick = () => {
          console.log('📱 Test notification clicked!');
          window.focus();
          notification.close();
        };
        
        notification.onclose = () => {
          console.log('❌ Test notification closed');
        };
        
        notification.onerror = (error) => {
          console.error('❌ Test notification error:', error);
        };
        
        console.log('✅ Direct test notification sent');
      }
      
      // Method 2: Via Service Worker (if available)
      if (this.swRegistration && this.swRegistration.active) {
        console.log('🔧 Sending test notification via Service Worker...');
        
        this.swRegistration.active.postMessage({
          type: 'TRIGGER_NOTIFICATION',
          data: {
            title: 'StoryMaps SW Test 🚀',
            body: 'This test notification was sent via Service Worker!',
            icon: window.BASE_PATH ? `${window.BASE_PATH}/icon-192.png` : '/icon-192.png',
            badge: window.BASE_PATH ? `${window.BASE_PATH}/icon-192.png` : '/icon-192.png',
            tag: 'sw-test-notification',
            data: {
              url: window.BASE_PATH || '/',
              type: 'sw-test'
            }
          }
        });
        
        console.log('✅ Service Worker test notification triggered');
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      throw error;
    }
  }

  // ... rest of the methods remain the same but add more logging

  generateTestVapidKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = 'B';
    for (let i = 0; i < 87; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('🔑 Generated test VAPID key:', result.substring(0, 20) + '...');
    return result;
  }

  urlBase64ToUint8Array(base64String) {
    try {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error('❌ Error converting VAPID key:', error);
      throw new Error('Invalid VAPID key format');
    }
  }

  getSubscriptionStatus() {
    const status = {
      isSupported: this.isSupported,
      permission: this.permissionStatus,
      isSubscribed: !!this.pushSubscription,
      subscription: this.pushSubscription,
      canSendNotifications: Notification.permission === 'granted',
      swRegistration: !!this.swRegistration,
      swActive: !!(this.swRegistration && this.swRegistration.active),
      environment: {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isGitHubPages: window.location.hostname.includes('github.io'),
        isLocalhost: window.location.hostname === 'localhost',
        basePath: window.BASE_PATH || 'Not set'
      }
    };
    
    console.log('📊 Current subscription status:', status);
    return status;
  }

  // ... rest of methods remain the same
}

export const pushManager = new PushManager();

if (typeof window !== 'undefined') {
  window.pushManager = pushManager;
}

export default pushManager;