// src/scripts/presenters/add-story-presenter.js - Updated with Push Notifications
import { BasePresenter } from './base-presenter.js';
import { ApiService } from '../data/api.js';
import { pushManager } from '../utils/push-manager.js'; // ✨ TAMBAH INI

export class AddStoryPresenter extends BasePresenter {
  constructor(view) {
    super(view);
    this.selectedLocation = null;
    this.photoBlob = null;
    this.isSubmitting = false;
  }

  async init() {
    try {
      // Check authentication
      if (!this.isAuthenticated()) {
        this.redirectToLogin();
        return;
      }

      this.safeViewCall('initializeForm');
      await this.initializeLocation();
    } catch (error) {
      this.handleError(error, 'Add Story Initialization');
    }
  }

  async initializeLocation() {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            this.safeViewCall('setMapCenter', latitude, longitude);
          },
          (error) => {
            console.warn('Geolocation error:', error);
            // Use default location (Jakarta)
            this.safeViewCall('setMapCenter', -6.2, 106.816666);
          }
        );
      }
    } catch (error) {
      console.warn('Location initialization failed:', error);
    }
  }

  validatePhoto(file) {
    if (!file) {
      return { isValid: false, message: 'Photo is required' };
    }

    if (!(file instanceof File) && !(file instanceof Blob)) {
      return { isValid: false, message: 'Invalid file format' };
    }

    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return { isValid: false, message: 'Photo file size must be less than 1MB' };
    }

    // Check file type
    if (file instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return { isValid: false, message: 'Photo must be JPEG or PNG format' };
      }
    }

    return { isValid: true };
  }

  validateDescription(description) {
    if (!description || description.trim().length < 10) {
      return { 
        isValid: false, 
        message: 'Story description must be at least 10 characters long' 
      };
    }

    if (description.trim().length > 1000) {
      return { 
        isValid: false, 
        message: 'Story description must be less than 1000 characters' 
      };
    }

    return { isValid: true };
  }

  validateForm(description, photo) {
    const descValidation = this.validateDescription(description);
    const photoValidation = this.validatePhoto(photo);

    this.safeViewCall('updateDescriptionValidation', 
      descValidation.isValid, 
      descValidation.message
    );

    this.safeViewCall('updatePhotoValidation', 
      photoValidation.isValid, 
      photoValidation.message
    );

    return descValidation.isValid && photoValidation.isValid;
  }

  handlePhotoSelected(file) {
    const validation = this.validatePhoto(file);
    
    if (!validation.isValid) {
      this.safeViewCall('showError', validation.message);
      return;
    }

    this.photoBlob = file;
    this.safeViewCall('showPhotoPreview', file);
    this.safeViewCall('updatePhotoValidation', true, '');
  }

  async handleCameraCapture() {
    try {
      this.safeViewCall('showCameraLoading');
      const photoBlob = await this.safeViewCall('capturePhoto');
      
      if (photoBlob) {
        this.handlePhotoSelected(photoBlob);
      }
    } catch (error) {
      this.handleError(error, 'Camera Capture');
    } finally {
      this.safeViewCall('hideCameraLoading');
    }
  }

  handleLocationSelected(lat, lon) {
    this.selectedLocation = { lat, lon };
    this.safeViewCall('updateLocationInfo', lat, lon);
  }

  clearPhoto() {
    this.photoBlob = null;
    this.safeViewCall('clearPhotoPreview');
    this.safeViewCall('updatePhotoValidation', false, 'Photo is required');
  }

  clearLocation() {
    this.selectedLocation = null;
    this.safeViewCall('clearLocationInfo');
  }

  async handleSubmit(description) {
    if (this.isSubmitting) return;

    try {
      // Validate form
      if (!this.validateForm(description, this.photoBlob)) {
        this.safeViewCall('showError', 'Please fix the errors above');
        return;
      }

      this.isSubmitting = true;
      this.safeViewCall('setSubmitLoading', true);

      // Prepare form data
      const formData = new FormData();
      formData.append('description', description.trim());

      // Handle photo
      if (this.photoBlob instanceof Blob && !(this.photoBlob instanceof File)) {
        const file = new File([this.photoBlob], 'story-photo.jpg', { 
          type: 'image/jpeg' 
        });
        formData.append('photo', file);
      } else {
        formData.append('photo', this.photoBlob);
      }

      // Add location if selected
      if (this.selectedLocation) {
        formData.append('lat', this.selectedLocation.lat.toString());
        formData.append('lon', this.selectedLocation.lon.toString());
      }

      console.log('📝 Submitting story...');
      
      const result = await ApiService.addStory(formData);
      
      console.log('✅ Story submitted successfully:', result);

      // ✨ SEND PUSH NOTIFICATION
      try {
        await this.sendStoryNotification(result, description);
      } catch (notificationError) {
        console.warn('⚠️ Failed to send notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      this.safeViewCall('showSuccessMessage', 
        'Your story has been shared successfully!',
        'Story Shared'
      );

      // Redirect to home after delay
      setTimeout(() => {
        window.location.hash = '#/';
      }, 2000);

    } catch (error) {
      this.handleError(error, 'Submit Story');
    } finally {
      this.isSubmitting = false;
      this.safeViewCall('setSubmitLoading', false);
    }
  }

  // ✨ SEND STORY NOTIFICATION
  async sendStoryNotification(result, description) {
    try {
      console.log('🔔 Sending story notification...');
      
      // Create story object for notification
      const story = {
        id: result.storyId || Date.now().toString(),
        name: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
        description: description
      };
      
      // Send notification via push manager
      await pushManager.sendStoryNotification(story);
      
      console.log('✅ Story notification sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send story notification:', error);
      throw error;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  redirectToLogin() {
    window.location.hash = '#/login';
  }

// Add to the AddStoryPresenter class
initMap() {
  const mapEl = document.getElementById('locationMap');
  
  if (!window.L || !mapEl) {
    console.warn('Leaflet not available or map container not found');
    return;
  }

  try {
    console.log('🗺️ Initializing add story map...');
    
    // ✅ Clean up existing map first
    if (this.map) {
      console.log('🧹 Cleaning up existing add story map...');
      try {
        this.map.remove();
        this.map = null;
      } catch (cleanupError) {
        console.warn('⚠️ Add story map cleanup warning:', cleanupError.message);
        this.map = null;
      }
    }

    // ✅ Clear map container HTML to prevent conflicts
    mapEl.innerHTML = '';
    mapEl._leaflet_id = null; // Clear Leaflet ID
    
    // ✅ Create new map
    this.map = window.L.map(mapEl, {
      zoomControl: true,
      attributionControl: true
    }).setView([-6.2, 106.816666], 10);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);

    let marker = null;
    const locationInfo = document.getElementById('locationInfo');

    this.map.on('click', (e) => {
      if (marker) {
        this.map.removeLayer(marker);
      }
      
      marker = window.L.marker(e.latlng).addTo(this.map);
      this.selectedLocation = e.latlng;
      
      if (locationInfo) {
        locationInfo.innerHTML = `
          <i class="fas fa-map-marker-alt" style="color: green;"></i>
          Location selected: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}
        `;
        locationInfo.style.color = 'green';
      }
    });

    // Try to get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        if (this.map && !this.isDestroyed) {
          this.map.setView([latitude, longitude], 13);
        }
      });
    }
    
    console.log('✅ Add story map initialized successfully');
    
  } catch (error) {
    console.error('❌ Add story map initialization error:', error);
  }
}

// ✅ Update cleanup method
cleanup() {
  console.log('🧹 Cleaning up Add Story View...');
  
  this.isDestroyed = true;
  
  try {
    // Stop camera
    if (this.camera) {
      this.camera.stop();
    }
    
    // Clear photo blob
    this.photoBlob = null;
    
    // ✅ FIXED: Remove map properly
    if (this.map) {
      try {
        console.log('🗺️ Removing add story map instance...');
        this.map.remove();
        this.map = null;
        
        // Clear the map container
        const mapEl = document.getElementById('locationMap');
        if (mapEl) {
          mapEl.innerHTML = '';
          mapEl._leaflet_id = null;
        }
        
        console.log('✅ Add story map cleaned up successfully');
      } catch (error) {
        console.warn('⚠️ Add story map cleanup warning:', error.message);
        this.map = null;
      }
    }
    
    // Clear selected location
    this.selectedLocation = null;
    
    // Hide camera container
    const cameraContainer = document.getElementById('cameraContainer');
    if (cameraContainer) {
      cameraContainer.classList.add('hidden');
    }
    
    console.log('✅ Add Story View cleaned up');
    
  } catch (error) {
    console.error('❌ Error cleaning up Add Story View:', error);
  }
}
}