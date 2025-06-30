// src/scripts/components/notification-permission.js - Enhanced with better error handling
import { pushManager } from '../utils/push-manager.js';
import { Alert } from '../utils/alert.js';

export class NotificationPermission {
  constructor() {
    this.isVisible = false;
    this.container = null;
  }

  async show() {
    console.log('🔔 NotificationPermission.show() called');
    
    if (this.isVisible) {
      console.log('⚠️ Banner already visible');
      return;
    }

    if (!pushManager.isSupported) {
      console.log('⚠️ Push notifications not supported');
      return;
    }

    const status = pushManager.getSubscriptionStatus();
    console.log('📋 Current notification status:', status);
    
    if (status.permission === 'granted' || status.permission === 'denied') {
      console.log('⚠️ Permission already granted or denied, not showing banner');
      return;
    }

    this.createBanner();
    this.isVisible = true;
  }

  createBanner() {
    console.log('🎨 Creating permission banner...');
    
    this.container = document.createElement('div');
    this.container.className = 'notification-permission-banner';
    this.container.innerHTML = `
      <div class="permission-content">
        <div class="permission-icon">
          <i class="fas fa-bell"></i>
        </div>
        <div class="permission-text">
          <h6>Stay Updated!</h6>
          <p>Enable notifications to get updates when new stories are shared.</p>
        </div>
        <div class="permission-actions">
          <button class="btn btn-primary btn-sm" id="enableNotifications" type="button">
            <i class="fas fa-bell"></i>
            Enable
          </button>
          <button class="btn btn-secondary btn-sm" id="dismissNotifications" type="button">
            <i class="fas fa-times"></i>
            Not Now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    console.log('✅ Banner added to DOM');

    setTimeout(() => {
      this.attachEventListeners();
      this.container.classList.add('visible');
      console.log('✅ Banner animated in');
    }, 100);
  }

  attachEventListeners() {
    const enableBtn = this.container.querySelector('#enableNotifications');
    const dismissBtn = this.container.querySelector('#dismissNotifications');

    if (enableBtn) {
      console.log('✅ Enable button found, adding event listener');
      enableBtn.addEventListener('click', (e) => {
        console.log('🔘 Enable button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        this.handleEnable();
      });
    } else {
      console.error('❌ Enable button not found!');
    }

    if (dismissBtn) {
      console.log('✅ Dismiss button found, adding event listener');
      dismissBtn.addEventListener('click', (e) => {
        console.log('🔘 Dismiss button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        this.handleDismiss();
      });
    } else {
      console.error('❌ Dismiss button not found!');
    }
  }

  async handleEnable() {
    console.log('🔔 handleEnable() called');
    
    const enableBtn = this.container?.querySelector('#enableNotifications');
    
    if (!enableBtn) {
      console.error('❌ Enable button not found in handleEnable');
      return;
    }
    
    try {
      console.log('🔄 Starting notification enable process...');
      
      enableBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enabling...';
      enableBtn.disabled = true;

      console.log('📋 Checking push manager support...');
      if (!pushManager.isSupported) {
        throw new Error('Push notifications not supported in this browser');
      }

      console.log('🔐 Requesting permission and subscribing...');
      
      // ✅ ENHANCED: Better subscription handling
      let subscriptionResult = null;
      let hasBasicPermission = false;
      
      try {
        // First, just try to get permission
        await pushManager.requestPermission();
        hasBasicPermission = Notification.permission === 'granted';
        console.log('✅ Basic permission granted:', hasBasicPermission);
        
        // Then try to subscribe
        if (hasBasicPermission) {
          subscriptionResult = await pushManager.subscribe();
          console.log('✅ Subscription result:', !!subscriptionResult);
        }
        
      } catch (error) {
        console.warn('⚠️ Subscription failed, but checking basic permission:', error.message);
        hasBasicPermission = Notification.permission === 'granted';
        
        if (!hasBasicPermission) {
          throw error; // Re-throw if we don't even have basic permission
        }
      }
      
      // Show appropriate success message
      if (subscriptionResult) {
        Alert.success(
          'Notifications enabled with full push support! You\'ll receive updates about new stories.',
          'Notifications Enabled'
        );
      } else if (hasBasicPermission) {
        Alert.success(
          'Basic notifications enabled! You\'ll receive updates when using the app.',
          'Notifications Enabled'
        );
      } else {
        throw new Error('Failed to enable any type of notifications');
      }

      // Send test notification
      setTimeout(async () => {
        try {
          console.log('🧪 Sending test notification...');
          await pushManager.sendTestNotification();
          console.log('✅ Test notification sent');
        } catch (testError) {
          console.warn('⚠️ Test notification failed:', testError.message);
          // Don't show error for test notification failure
        }
      }, 2000);

      this.hide();

    } catch (error) {
      console.error('❌ Failed to enable notifications:', error);
      
      let errorMessage = 'Failed to enable notifications. ';
      
      if (error.message.includes('denied')) {
        errorMessage += 'Please enable notifications in your browser settings.';
      } else if (error.message.includes('not supported')) {
        errorMessage += 'Your browser doesn\'t support push notifications.';
      } else if (error.message.includes('VAPID') || error.message.includes('ECDSA')) {
        errorMessage += 'Configuration issue detected, but basic notifications may still work.';
      } else {
        errorMessage += 'Please try again later.';
      }
      
      Alert.error(errorMessage);
      
      if (enableBtn) {
        enableBtn.innerHTML = '<i class="fas fa-bell"></i> Enable';
        enableBtn.disabled = false;
      }
    }
  }

  handleDismiss() {
    console.log('❌ handleDismiss() called');
    this.hide();
    
    localStorage.setItem('notificationPermissionDismissed', Date.now().toString());
    console.log('💾 Dismiss timestamp saved');
  }

  hide() {
    console.log('🫥 Hiding notification banner...');
    
    if (!this.container || !this.isVisible) {
      console.log('⚠️ Banner not visible or container not found');
      return;
    }

    this.container.classList.remove('visible');
    
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        console.log('✅ Banner removed from DOM');
      }
      this.container = null;
      this.isVisible = false;
    }, 300);
  }

  shouldShow() {
    console.log('🤔 Checking if should show notification banner...');
    
    if (!pushManager.isSupported) {
      console.log('❌ Not supported');
      return false;
    }

    const status = pushManager.getSubscriptionStatus();
    console.log('📋 Current status for shouldShow check:', status);
    
    if (status.permission === 'granted' || status.isSubscribed) {
      console.log('❌ Already granted or subscribed');
      return false;
    }

    if (status.permission === 'denied') {
      console.log('❌ Permission denied');
      return false;
    }

    const dismissed = localStorage.getItem('notificationPermissionDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        console.log(`❌ Recently dismissed (${hoursSinceDismissed.toFixed(1)} hours ago)`);
        return false;
      }
    }

    console.log('✅ Should show banner');
    return true;
  }

  async autoShow() {
    console.log('🔄 Auto show triggered...');
    
    setTimeout(() => {
      console.log('⏰ Auto show timeout reached, checking if should show...');
      if (this.shouldShow()) {
        console.log('✅ Will show banner');
        this.show();
      } else {
        console.log('❌ Will not show banner');
      }
    }, 5000); // Increased delay to 5 seconds
  }

  forceShow() {
    console.log('🚀 Force showing notification banner...');
    this.createBanner();
    this.isVisible = true;
  }
}

export const notificationPermission = new NotificationPermission();

if (typeof window !== 'undefined') {
  window.notificationPermission = notificationPermission;
}

export default notificationPermission;