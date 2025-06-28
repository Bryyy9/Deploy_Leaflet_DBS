// src/scripts/presenters/base-presenter.js - Enhanced Lifecycle Management
export class BasePresenter {
  constructor(view) {
    this.view = view;
    this.isDestroyed = false;
    this.eventListeners = new Map(); // Track event listeners
    this.timeouts = new Set(); // Track timeouts
    this.intervals = new Set(); // Track intervals
    
    console.log(`🏗️ ${this.constructor.name} constructed`);
  }

  async init() {
    console.log(`🚀 ${this.constructor.name}.init() called`);
    // Override in child classes
  }

  destroy() {
    if (this.isDestroyed) {
      console.warn(`⚠️ ${this.constructor.name} already destroyed`);
      return;
    }
    
    console.log(`🗑️ Destroying ${this.constructor.name}...`);
    
    // Clear all timeouts
    this.timeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
      console.log(`⏰ Cleared timeout: ${timeoutId}`);
    });
    this.timeouts.clear();
    
    // Clear all intervals
    this.intervals.forEach(intervalId => {
      clearInterval(intervalId);
      console.log(`⏰ Cleared interval: ${intervalId}`);
    });
    this.intervals.clear();
    
    // Remove all event listeners
    this.eventListeners.forEach((listener, element) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(listener.event, listener.handler);
        console.log(`🎧 Removed event listener: ${listener.event}`);
      }
    });
    this.eventListeners.clear();
    
    this.isDestroyed = true;
    this.view = null;
    
    console.log(`✅ ${this.constructor.name} destroyed successfully`);
  }

  checkDestroyed() {
    if (this.isDestroyed) {
      const error = new Error(`${this.constructor.name} has been destroyed`);
      console.error(`❌ ${error.message}`);
      throw error;
    }
  }

  safeViewCall(methodName, ...args) {
    try {
      this.checkDestroyed();
      
      if (this.view && typeof this.view[methodName] === 'function') {
        return this.view[methodName](...args);
      } else {
        console.warn(`⚠️ View method '${methodName}' not found or view is null`);
        return null;
      }
    } catch (error) {
      if (error.message.includes('destroyed')) {
        // Silently ignore calls to destroyed presenter
        console.warn(`⚠️ Ignoring call to destroyed presenter: ${methodName}`);
        return null;
      }
      throw error;
    }
  }

  // ✨ ENHANCED: Safe timeout management
  safeSetTimeout(callback, delay) {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring setTimeout on destroyed ${this.constructor.name}`);
      return null;
    }
    
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(timeoutId);
      if (!this.isDestroyed) {
        try {
          callback();
        } catch (error) {
          console.error(`❌ Error in timeout callback:`, error);
        }
      }
    }, delay);
    
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  // ✨ ENHANCED: Safe interval management
  safeSetInterval(callback, interval) {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring setInterval on destroyed ${this.constructor.name}`);
      return null;
    }
    
    const intervalId = setInterval(() => {
      if (!this.isDestroyed) {
        try {
          callback();
        } catch (error) {
          console.error(`❌ Error in interval callback:`, error);
        }
      } else {
        clearInterval(intervalId);
        this.intervals.delete(intervalId);
      }
    }, interval);
    
    this.intervals.add(intervalId);
    return intervalId;
  }

  // ✨ ENHANCED: Safe event listener management
  safeAddEventListener(element, event, handler, options = {}) {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring addEventListener on destroyed ${this.constructor.name}`);
      return;
    }
    
    if (!element || typeof element.addEventListener !== 'function') {
      console.warn(`⚠️ Invalid element for addEventListener`);
      return;
    }
    
    const wrappedHandler = (e) => {
      if (!this.isDestroyed) {
        try {
          handler(e);
        } catch (error) {
          console.error(`❌ Error in event handler:`, error);
        }
      }
    };
    
    element.addEventListener(event, wrappedHandler, options);
    this.eventListeners.set(element, { event, handler: wrappedHandler });
    
    console.log(`🎧 Added event listener: ${event} on`, element);
  }

  handleError(error, context = '') {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring error handling on destroyed ${this.constructor.name}:`, error);
      return;
    }
    
    console.error(`${this.constructor.name} ${context} Error:`, error);
    
    let errorMessage = error.message || 'An unexpected error occurred';
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message?.includes('401')) {
      errorMessage = 'Authentication required. Please login again.';
    } else if (error.message?.includes('403')) {
      errorMessage = 'Access denied.';
    } else if (error.message?.includes('404')) {
      errorMessage = 'Resource not found.';
    } else if (error.message?.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    this.safeViewCall('showError', errorMessage);
  }

  // ✨ ENHANCED: Check if presenter is still valid
  isValid() {
    return !this.isDestroyed && this.view !== null;
  }

  // ✨ ENHANCED: Safe async operation wrapper
  async safeAsyncOperation(operation, context = '') {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring async operation on destroyed ${this.constructor.name}: ${context}`);
      return null;
    }
    
    try {
      const result = await operation();
      
      // Check if presenter was destroyed during async operation
      if (this.isDestroyed) {
        console.warn(`⚠️ Presenter destroyed during async operation: ${context}`);
        return null;
      }
      
      return result;
    } catch (error) {
      if (!this.isDestroyed) {
        this.handleError(error, context);
      }
      throw error;
    }
  }
}