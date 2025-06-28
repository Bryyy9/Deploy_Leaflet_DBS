// src/scripts/components/notification-permission.js - Enhanced Error Handling
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
      const enableBtn = this.container.querySelector('#enableNotifications');
      const dismissBtn = this.container.querySelector('#dismissNotifications');

      if (enableBtn) {
        console.log('✅ Enable button found, adding event listener');
        enableBtn.onclick = (e) => {
          console.log('🔘 Enable button clicked!', e);
          e.preventDefault();
          e.stopPropagation();
          this.handleEnable();
        };
        
        enableBtn.addEventListener('click', (e) => {
          console.log('🔘 Enable button clicked via addEventListener!', e);
          e.preventDefault();
          e.stopPropagation();
          this.handleEnable();
        });
      } else {
        console.error('❌ Enable button not found!');
      }

      if (dismissBtn) {
        console.log('✅ Dismiss button found, adding event listener');
        dismissBtn.onclick = (e) => {
          console.log('🔘 Dismiss button clicked!', e);
          e.preventDefault();
          e.stopPropagation();
          this.handleDismiss();
        };
        
        dismissBtn.addEventListener('click', (e) => {
          console.log('🔘 Dismiss button clicked via addEventListener!', e);
          e.preventDefault();
          e.stopPropagation();
          this.handleDismiss();
        });
      } else {
        console.error('❌ Dismiss button not found!');
      }
    }, 100);

    setTimeout(() => {
      this.container.classList.add('visible');
      console.log('✅ Banner animated in');
    }, 200);
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
      
      // ✨ ENHANCED: Try subscription with better error handling
      let subscription = null;
      let subscriptionError = null;
      
      try {
        subscription = await pushManager.subscribe();
        console.log('✅ Successfully subscribed:', subscription);
      } catch (error) {
        console.warn('⚠️ Subscription failed, but we can still send direct notifications:', error);
        subscriptionError = error;
        
        // Check if we at least have permission for direct notifications
        if (Notification.permission !== 'granted') {
          throw error; // Re-throw if we don't even have basic permission
        }
      }
      
      // Show success message
      if (subscription) {
        Alert.success(
          'Notifications enabled with full push support! You\'ll receive updates about new stories.',
          'Notifications Enabled'
        );
      } else if (Notification.permission === 'granted') {
        Alert.success(
          'Basic notifications enabled! You\'ll receive updates when using the app.',
          'Notifications Enabled'
        );
      }

      // Send test notification
      setTimeout(async () => {
        try {
          console.log('🧪 Sending test notification...');
          await pushManager.sendTestNotification();
          console.log('✅ Test notification sent');
        } catch (testError) {
          console.warn('⚠️ Test notification failed:', testError);
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
        errorMessage += 'There was a configuration issue, but basic notifications may still work.';
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
    }, 3000);
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