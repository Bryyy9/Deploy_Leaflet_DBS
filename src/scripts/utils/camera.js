// src/scripts/utils/camera.js - Enhanced version
export class Camera {
  constructor() {
    this.stream = null;
    this.video = null;
    this.isActive = false;
    
    // ✨ Register global cleanup on page unload
    this.registerGlobalCleanup();
  }

  async start(videoElement) {
    this.video = videoElement;
    
    try {
      // ✨ Stop any existing stream first
      this.stop();
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      this.video.srcObject = this.stream;
      await this.video.play();
      
      this.isActive = true;
      console.log('📹 Camera started successfully');
      
      return true;
    } catch (error) {
      console.error('Camera error:', error);
      this.isActive = false;
      throw new Error('Could not access camera');
    }
  }

  capture() {
    if (!this.video || !this.isActive) {
      throw new Error('Camera not active');
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0);
    
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
  }

  stop() {
    if (this.stream) {
      console.log('🛑 Stopping camera stream...');
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
    }
    
    this.isActive = false;
    console.log('✅ Camera stopped completely');
  }

  // ✨ Check if camera is currently active
  isRunning() {
    return this.isActive && this.stream && this.stream.active;
  }

  // ✨ Register global cleanup handlers
  registerGlobalCleanup() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
    
    // Cleanup on page hide (mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning()) {
        console.log('📱 Page hidden, stopping camera...');
        this.stop();
      }
    });
    
    // Cleanup on hash change (SPA navigation)
    window.addEventListener('hashchange', () => {
      if (this.isRunning()) {
        console.log('🔗 Route changed, stopping camera...');
        this.stop();
      }
    });
  }

  // ✨ Static method to stop all camera instances
  static stopAllCameras() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(() => {
        // Ignore errors, just cleanup
      });
  }
}