// src/scripts/views/add-story.js - FIXED MAP CLEANUP
import { ApiService } from '../data/api.js';
import { Camera } from '../utils/camera.js';
import { Alert } from '../utils/alert.js';

export class AddStoryView {
  constructor() {
    this.requiresAuth = true;
    this.camera = new Camera();
    this.selectedLocation = null;
    this.photoBlob = null;
    this.map = null;
    this.isDestroyed = false;
  }

  async render() {
    return `
      <div class="add-story-view">
        <h1 class="mb-3">📝 Share Your Story</h1>
        
        <form id="storyForm" class="story-form">
          <div class="form-group">
            <label for="description">Tell Your Story *</label>
            <textarea id="description" class="form-control" rows="4" 
                      placeholder="What's your story? Share your experience, thoughts, or adventure..."
                      required minlength="10"></textarea>
            <small class="text-muted">Minimum 10 characters</small>
          </div>
          
          <div class="form-group">
            <label>Photo *</label>
            <div class="photo-controls mb-2">
              <input type="file" id="photoInput" accept="image/*" style="display: none;">
              <button type="button" class="btn btn-secondary" id="chooseFileBtn">
                <i class="fas fa-folder-open"></i> Choose File
              </button>
              <button type="button" class="btn btn-secondary" id="cameraBtn">
                <i class="fas fa-camera"></i> Take Photo
              </button>
            </div>
            <small class="text-muted">Maximum file size: 1MB. Supported formats: JPG, PNG</small>
            
            <div id="photoPreview" class="photo-preview hidden"></div>
            
            <div id="cameraContainer" class="camera-container hidden">
              <video id="cameraVideo" class="camera-video" autoplay playsinline></video>
              <div class="camera-controls">
                <button type="button" class="btn btn-primary" id="captureBtn">
                  <i class="fas fa-camera"></i> Capture
                </button>
                <button type="button" class="btn btn-secondary" id="cancelCameraBtn">
                  <i class="fas fa-times"></i> Cancel
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Location (Optional)</label>
            <div class="map-container" id="locationMap"></div>
            <p id="locationInfo" class="text-muted mt-1">
              <i class="fas fa-map-marker-alt"></i>
              Click on the map to select location
            </p>
          </div>
          
          <button type="submit" class="btn btn-primary" id="submitBtn">
            <i class="fas fa-plus"></i> Share Story
          </button>
        </form>
      </div>
    `;
  }

  async afterRender() {
    if (this.isDestroyed) return;
    
    try {
      console.log('🎯 Initializing Add Story View...');
      
      this.initPhotoControls();
      this.initMap();
      this.initForm();
      
      console.log('✅ Add Story View initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing add story view:', error);
      if (!this.isDestroyed) {
        Alert.error('Failed to initialize form: ' + error.message);
      }
    }
  }

  initPhotoControls() {
    if (this.isDestroyed) return;
    
    const photoInput = document.getElementById('photoInput');
    const chooseFileBtn = document.getElementById('chooseFileBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const cameraContainer = document.getElementById('cameraContainer');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureBtn = document.getElementById('captureBtn');
    const cancelCameraBtn = document.getElementById('cancelCameraBtn');

    if (!photoInput || !chooseFileBtn) {
      console.error('Photo control elements not found');
      return;
    }

    // Choose file
    chooseFileBtn.addEventListener('click', () => photoInput.click());
    
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (1MB)
        if (file.size > 1024 * 1024) {
          Alert.error('File size too large. Maximum 1MB allowed.');
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          Alert.error('Please select an image file.');
          return;
        }
        
        this.photoBlob = file;
        this.showPhotoPreview(file);
      }
    });

    // Camera controls
    if (cameraBtn && cameraContainer && cameraVideo) {
      cameraBtn.addEventListener('click', async () => {
        try {
          cameraContainer.classList.remove('hidden');
          await this.camera.start(cameraVideo);
        } catch (error) {
          Alert.error('Could not access camera: ' + error.message);
          cameraContainer.classList.add('hidden');
        }
      });

      if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
          try {
            this.photoBlob = await this.camera.capture();
            this.showPhotoPreview(this.photoBlob);
            this.camera.stop();
            cameraContainer.classList.add('hidden');
          } catch (error) {
            Alert.error('Could not capture photo');
          }
        });
      }

      if (cancelCameraBtn) {
        cancelCameraBtn.addEventListener('click', () => {
          this.camera.stop();
          cameraContainer.classList.add('hidden');
        });
      }
    }
  }

  showPhotoPreview(file) {
    if (this.isDestroyed) return;
    
    const photoPreview = document.getElementById('photoPreview');
    
    if (!photoPreview) return;
    
    const url = URL.createObjectURL(file);
    
    photoPreview.innerHTML = `
      <div style="text-align: center;">
        <img src="${url}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 10px; margin-bottom: 10px;">
        <br>
        <button type="button" class="btn btn-danger btn-sm" id="removePhotoBtn">
          <i class="fas fa-trash"></i> Remove Photo
        </button>
      </div>
    `;
    
    photoPreview.classList.remove('hidden');
    
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        this.photoBlob = null;
        photoPreview.classList.add('hidden');
        photoPreview.innerHTML = '';
        const photoInput = document.getElementById('photoInput');
        if (photoInput) photoInput.value = '';
      });
    }
  }

  // ✅ COMPLETELY FIXED: Map initialization with proper cleanup
  initMap() {
    if (this.isDestroyed) return;
    
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
          console.log('✅ Add story map removed successfully');
        } catch (cleanupError) {
          console.warn('⚠️ Add story map cleanup warning:', cleanupError.message);
        } finally {
          this.map = null;
        }
      }

      // ✅ Clear and reset map container
      mapEl.innerHTML = '';
      mapEl._leaflet_id = null; // Clear Leaflet's internal ID
      
      // ✅ Create new map
      this.map = window.L.map(mapEl, {
        center: [-6.2, 106.816666],
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });
      
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

  initForm() {
    if (this.isDestroyed) return;
    
    const form = document.getElementById('storyForm');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!form || !submitBtn) {
      console.error('Form elements not found');
      return;
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (this.isDestroyed) return;
      
      const description = document.getElementById('description')?.value?.trim();
      
      if (!description || description.length < 10) {
        Alert.error('Story description must be at least 10 characters long.');
        return;
      }
      
      if (!this.photoBlob) {
        Alert.error('Please select or take a photo for your story.');
        return;
      }

      try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing Story...';
        
        const formData = new FormData();
        formData.append('description', description);
        
        // Convert blob to file if needed
        if (this.photoBlob instanceof Blob && !(this.photoBlob instanceof File)) {
          const file = new File([this.photoBlob], 'story-photo.jpg', { type: 'image/jpeg' });
          formData.append('photo', file);
        } else {
          formData.append('photo', this.photoBlob);
        }
        
        // Add location if selected
        if (this.selectedLocation) {
          formData.append('lat', this.selectedLocation.lat.toString());
          formData.append('lon', this.selectedLocation.lng.toString());
        }

        console.log('Submitting story with data:', {
          description,
          hasPhoto: !!this.photoBlob,
          hasLocation: !!this.selectedLocation
        });

        const result = await ApiService.addStory(formData);
        console.log('Story added successfully:', result);
        
        await Alert.success('Your story has been shared successfully!');
        window.location.hash = '#/';
        
      } catch (error) {
        console.error('Error adding story:', error);
        Alert.error('Failed to share story: ' + error.message);
        
      } finally {
        // Re-enable submit button
        if (!this.isDestroyed) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-plus"></i> Share Story';
        }
      }
    });
  }

  // ✅ FIXED: Complete cleanup method
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
          console.log('✅ Add story map cleaned up successfully');
        } catch (error) {
          console.warn('⚠️ Add story map cleanup warning:', error.message);
        } finally {
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

export default AddStoryView;