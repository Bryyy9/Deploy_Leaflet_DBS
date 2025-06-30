// src/scripts/utils/push-manager.js - NO VAPID VERSION
export class PushManager {
  constructor() {
    this.swRegistration = null;
    this.pushSubscription = null;
    this.isSupported = this.checkSupport();
    this.permissionStatus = 'default';
    
    console.log('🏗️ PushManager constructed (No VAPID):', {
      isSupported: this.isSupported
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
      const { swPaths, scope } = this.getServiceWorkerConfig();
      
      let registered = false;
      for (const swPath of swPaths) {
        try {
          this.swRegistration = await navigator.serviceWorker.register(swPath, {
            scope: scope,
            updateViaCache: 'none'
          });
          
          console.log('✅ Service Worker registered:', this.swRegistration.scope);
          registered = true;
          break;
          
        } catch (error) {
          console.warn(`⚠️ Failed to register SW at ${swPath}:`, error.message);
        }
      }
      
      if (!registered) {
        throw new Error('Could not register service worker');
      }

      await navigator.serviceWorker.ready;
      this.permissionStatus = Notification.permission;
      this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
      
      console.log('✅ PushManager initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  getServiceWorkerConfig() {
    const basePath = window.APP_CONFIG?.BASE_PATH || '';
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    const swPaths = [];
    
    if (isGitHubPages && basePath) {
      swPaths.push(`${basePath}/service-worker.js`);
    }
    
    swPaths.push('/service-worker.js');
    swPaths.push('./service-worker.js');
    
    const scope = basePath ? `${basePath}/` : '/';
    return { swPaths, scope };
  }

  async requestPermission() {
    console.log('🔐 requestPermission() called');
    
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    if (this.permissionStatus === 'granted') {
      console.log('✅ Permission already granted');
      return true;
    }

    if (this.permissionStatus === 'denied') {
      throw new Error('Notification permission was denied. Please enable in browser settings.');
    }
    
    const permission = await Notification.requestPermission();
    this.permissionStatus = permission;
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      throw new Error('Notification permission not granted');
    }
  }

  async subscribe() {
    console.log('📝 subscribe() called (No VAPID)');
    
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    if (!this.swRegistration) {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize service worker');
      }
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Permission not granted');
    }
    
    if (this.pushSubscription) {
      console.log('✅ Already subscribed');
      return this.pushSubscription;
    }
    
    try {
      console.log('🔄 Subscribing without VAPID key...');
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true
      });
      
      this.pushSubscription = subscription;
      this.saveSubscription(subscription);
      
      console.log('✅ Push subscription successful:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...'
      });
      
      return subscription;
      
    } catch (error) {
      console.error('❌ Failed to subscribe:', error);
      
      if (error.name === 'NotSupportedError') {
        throw new Error('Push notifications not supported in this browser');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Permission to show notifications was denied');
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

  async sendTestNotification() {
    console.log('🧪 sendTestNotification() called');
    
    try {
      if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
      
      const notification = new Notification('StoryMaps Test 🎉', {
        body: 'Push notifications are working! This test was successful.',
        icon: this.getIconUrl(),
        tag: 'test-notification',
        timestamp: Date.now()
      });
      
      notification.onclick = () => {
        console.log('📱 Test notification clicked!');
        window.focus();
        notification.close();
      };
      
      console.log('✅ Test notification sent');
      
      // Also try via Service Worker
      if (this.swRegistration && this.swRegistration.active) {
        setTimeout(() => {
          this.swRegistration.active.postMessage({
            type: 'TRIGGER_NOTIFICATION',
            data: {
              title: 'StoryMaps SW Test 🚀',
              body: 'Service Worker notifications working!',
              icon: this.getIconUrl(),
              tag: 'sw-test-notification'
            }
          });
        }, 2000);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      throw error;
    }
  }

  async sendStoryNotification(story) {
    console.log('📚 sendStoryNotification() called');
    
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification('New Story Added! 📖', {
          body: `"${story.name}" has been shared successfully!`,
          icon: this.getIconUrl(),
          tag: 'story-added',
          timestamp: Date.now()
        });
        
        notification.onclick = () => {
          window.location.hash = `#/detail/${story.id}`;
          window.focus();
          notification.close();
        };
        
        console.log('✅ Story notification sent');
      }
      
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'TRIGGER_NOTIFICATION',
          data: {
            title: 'New Story Added! 📖',
            body: `"${story.name}" has been shared successfully!`,
            icon: this.getIconUrl(),
            tag: 'story-added'
          }
        });
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
      canSendNotifications: Notification.permission === 'granted',
      hasServiceWorker: !!this.swRegistration
    };
    
    console.log('📊 Current subscription status:', status);
    return status;
  }

  getIconUrl() {
    const basePath = window.APP_CONFIG?.BASE_PATH || '';
    return `${basePath}/icon-192.png`;
  }

  saveSubscription(subscription) {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
      console.log('💾 Subscription saved');
      
    } catch (error) {
      console.error('❌ Failed to save subscription:', error);
    }
  }

  removeSubscription() {
    try {
      localStorage.removeItem('pushSubscription');
      console.log('🗑️ Subscription removed');
    } catch (error) {
      console.error('❌ Failed to remove subscription:', error);
    }
  }

  async autoSubscribe() {
    try {
      if (this.permissionStatus === 'granted' && !this.pushSubscription) {
        await this.subscribe();
      }
    } catch (error) {
      console.warn('⚠️ Auto-subscribe failed:', error.message);
    }
  }
}

export const pushManager = new PushManager();
export default pushManager;