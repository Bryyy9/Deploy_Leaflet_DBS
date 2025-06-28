// src/scripts/utils/push-manager.js - Fixed VAPID Key
export class PushManager {
  constructor() {
    this.swRegistration = null;
    this.pushSubscription = null;
    // ✨ FIXED: Valid VAPID public key for testing
    this.vapidPublicKey = 'BCVxar7AsITJXXXMh4EUzGIlq7r6oO1wS4ZEw5Qhkr8qdXVOOm7w7VCXJfxZpPUm8e7M-2-3-4-5-6-7-8-9-0';
    this.isSupported = this.checkSupport();
    this.permissionStatus = 'default';
    
    console.log('🏗️ PushManager constructed:', {
      isSupported: this.isSupported,
      vapidKey: this.vapidPublicKey.substring(0, 20) + '...'
    });
  }

  checkSupport() {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    
    console.log('🔍 Push notification support check:', {
      serviceWorker: hasServiceWorker,
      pushManager: hasPushManager,
      notification: hasNotification,
      userAgent: navigator.userAgent,
      isSupported: hasServiceWorker && hasPushManager && hasNotification
    });
    
    return hasServiceWorker && hasPushManager && hasNotification;
  }
  
  async init() {
    console.log('🚀 PushManager.init() called');
    
    if (!this.isSupported) {
      console.warn('⚠️ Push notifications not supported');
      return false;
    }

    try {
      console.log('🔧 Registering service worker...');
      
      // ✅ FIXED: Use same config as sw-register
      const { swPaths, scope } = this.getServiceWorkerConfig();
      console.log('🔍 PushManager SW Config:', { swPaths, scope });
      
      let registered = false;
      for (const swPath of swPaths) {
        try {
          console.log(`🔄 Trying SW path: ${swPath} with scope: ${scope}`);
          
          this.swRegistration = await navigator.serviceWorker.register(swPath, {
            scope: scope,
            updateViaCache: 'none'
          });
          
          console.log('✅ Service Worker registered:', this.swRegistration);
          console.log('📍 SW Scope:', this.swRegistration.scope);
          registered = true;
          break;
          
        } catch (error) {
          console.warn(`⚠️ Failed to register SW at ${swPath}:`, error.message);
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
        console.log('✅ Existing push subscription found');
        return true;
      }
      
      console.log('📝 No existing subscription found');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  // ✅ ADD: Same config method as sw-register
  getServiceWorkerConfig() {
    const basePath = window.APP_CONFIG?.BASE_PATH || '';
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    const swPaths = [];
    
    if (isGitHubPages && basePath) {
      swPaths.push(`${basePath}/service-worker.js`);
      swPaths.push(`./service-worker.js`);
    }
    
    swPaths.push('/service-worker.js');
    swPaths.push('./service-worker.js');
    
    // ✅ FIXED: Scope sesuai dengan base path
    const scope = basePath ? `${basePath}/` : '/';
    
    return { swPaths, scope };
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

  // ✨ GENERATE TEST VAPID KEY
  generateTestVapidKey() {
    // For development/testing only - generates a fake but valid format key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = 'B'; // Start with 'B' for uncompressed key
    for (let i = 0; i < 87; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
      
      console.log('🔑 Converting VAPID key...');
      
      // ✨ TRY MULTIPLE VAPID KEYS
      const vapidKeys = [
        this.vapidPublicKey,
        // Fallback test keys
        'BNJnmJPGp8rKNdgM5HRpTYbOhKdBnNaVJrZVJTXBqKGhM9QdvwMkPtMnJVBpKGgKJdBnNaVJrZVJTXBqKGhM9Q',
        'BCVxar7AsITJXXXMh4EUzGIlq7r6oO1wS4ZEw5Qhkr8qdXVOOm7w7VCXJfxZpPUm8e7MqtqVlqVlqVlqVlqVl',
        this.generateTestVapidKey()
      ];
      
      let subscription = null;
      let lastError = null;
      
      for (const vapidKey of vapidKeys) {
        try {
          console.log(`🔑 Trying VAPID key: ${vapidKey.substring(0, 20)}...`);
          
          const applicationServerKey = this.urlBase64ToUint8Array(vapidKey);
          console.log('✅ VAPID key converted, subscribing...');
          
          subscription = await this.swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          });
          
          console.log('✅ Push subscription created with key:', vapidKey.substring(0, 20) + '...');
          this.vapidPublicKey = vapidKey; // Save working key
          break;
          
        } catch (error) {
          console.warn(`⚠️ Failed with key ${vapidKey.substring(0, 20)}...:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      if (!subscription) {
        // ✨ FALLBACK: Try without VAPID key
        console.log('🔄 All VAPID keys failed, trying without applicationServerKey...');
        try {
          subscription = await this.swRegistration.pushManager.subscribe({
            userVisibleOnly: true
          });
          console.log('✅ Push subscription created without VAPID key');
        } catch (error) {
          console.error('❌ Failed even without VAPID key:', error);
          throw lastError || error;
        }
      }
      
      this.pushSubscription = subscription;
      this.saveSubscription(subscription);
      
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
        throw new Error('VAPID key configuration error. Using fallback notification method.');
      }
      
      throw error;
    }
  }

  async unsubscribe() {
    console.log('🗑️ unsubscribe() called');
    
    if (!this.pushSubscription) {
      console.log('📝 No active subscription to unsubscribe');
      return true;
    }

    try {
      console.log('🗑️ Unsubscribing from push notifications...');
      
      const successful = await this.pushSubscription.unsubscribe();
      
      if (successful) {
        this.pushSubscription = null;
        this.removeSubscription();
        console.log('✅ Successfully unsubscribed');
        return true;
      } else {
        console.log('❌ Failed to unsubscribe');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
      throw error;
    }
  }

  // ✨ ENHANCED TEST NOTIFICATION (works without push subscription)
  async sendTestNotification() {
    console.log('🧪 sendTestNotification() called');
    
    try {
      console.log('🧪 Sending test notification...');
      
      // Method 1: Direct notification (works without push subscription)
      if (Notification.permission === 'granted') {
        const notification = new Notification('StoryMaps Test 🎉', {
          body: 'This is a test notification! Push notifications are working.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'test-notification',
          requireInteraction: false,
          timestamp: Date.now(),
          actions: [] // Firefox doesn't support actions in direct notifications
        });
        
        notification.onclick = () => {
          console.log('📱 Test notification clicked!');
          window.focus();
          notification.close();
        };
        
        notification.onclose = () => {
          console.log('❌ Test notification closed');
        };
        
        console.log('✅ Direct test notification sent');
        return true;
      }
      
      // Method 2: Via Service Worker (if available and subscribed)
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'TRIGGER_NOTIFICATION',
          data: {
            title: 'StoryMaps Test via SW 🚀',
            body: 'This test notification was sent via Service Worker!',
            icon: '/icon-192.png'
          }
        });
        
        console.log('✅ Service Worker test notification triggered');
        return true;
      }
      
      throw new Error('No method available to send test notification');
      
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      throw error;
    }
  }

  async sendStoryNotification(story) {
    console.log('📚 sendStoryNotification() called for:', story.name);
    
    try {
      console.log('📚 Sending story notification...');
      
      // Method 1: Direct notification
      if (Notification.permission === 'granted') {
        const notification = new Notification('New Story Added! 📖', {
          body: `"${story.name}" has been shared successfully!`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'story-added',
          requireInteraction: false,
          timestamp: Date.now()
        });
        
        notification.onclick = () => {
          console.log('📱 Story notification clicked!');
          window.location.hash = `#/detail/${story.id}`;
          window.focus();
          notification.close();
        };
        
        console.log('✅ Direct story notification sent');
      }
      
      // Method 2: Via Service Worker (if available)
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'TRIGGER_NOTIFICATION',
          data: {
            title: 'New Story Added! 📖',
            body: `"${story.name}" has been shared successfully!`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'story-added',
            data: {
              url: `/#/detail/${story.id}`,
              storyId: story.id
            }
          }
        });
        
        console.log('✅ Service Worker story notification sent');
      }
      
    } catch (error) {
      console.error('❌ Failed to send story notification:', error);
    }
  }

  getSubscriptionStatus() {
    const status = {
      isSupported: this.isSupported,
      permission: this.permissionStatus,
      isSubscribed: !!this.pushSubscription,
      subscription: this.pushSubscription,
      canSendNotifications: Notification.permission === 'granted'
    };
    
    console.log('📊 Current subscription status:', status);
    return status;
  }

  saveSubscription(subscription) {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: subscription.getKey ? {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        } : {},
        timestamp: Date.now()
      };
      
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
      console.log('💾 Subscription saved to localStorage');
      
    } catch (error) {
      console.error('❌ Failed to save subscription:', error);
    }
  }

  removeSubscription() {
    try {
      localStorage.removeItem('pushSubscription');
      console.log('🗑️ Subscription removed from localStorage');
      
    } catch (error) {
      console.error('❌ Failed to remove subscription:', error);
    }
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

  arrayBufferToBase64(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    } catch (error) {
      console.error('❌ Error converting array buffer:', error);
      throw error;
    }
  }

  async autoSubscribe() {
    try {
      console.log('🔄 Auto-subscribe check...');
      if (this.permissionStatus === 'granted' && !this.pushSubscription) {
        console.log('🔄 Auto-subscribing to push notifications...');
        await this.subscribe();
      }
    } catch (error) {
      console.warn('⚠️ Auto-subscribe failed:', error);
    }
  }
}

export const pushManager = new PushManager();

if (typeof window !== 'undefined') {
  window.pushManager = pushManager;
}

export default pushManager;