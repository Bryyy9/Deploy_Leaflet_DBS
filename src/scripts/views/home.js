// src/scripts/views/home.js - Complete Enhanced Version
import { HomePresenter } from '../presenters/home-presenter.js';
import { Alert } from '../utils/alert.js';

export class HomeView {
  constructor() {
    this.requiresAuth = false;
    this.presenter = null;
  }

  async render() {
    return `
      <div class="home-view">
        <div class="hero-section">
          <h1 class="mb-3">
            <i class="fas fa-map-marked-alt"></i>
            Discover Amazing Stories
          </h1>
          <p class="lead text-center mb-4">
            Explore stories from around the world, shared by people like you.
          </p>
        </div>

        <!-- Test Notification Section -->
        <div class="test-notification-section">
          <h3><i class="fas fa-tools"></i> Notification Testing</h3>
          <p>Test push notification functionality</p>
          <div class="test-buttons">
            <button id="testNotificationBtn" class="btn btn-secondary">
              <i class="fas fa-bell"></i>
              Test Push Notification
            </button>
            <button id="showPermissionBanner" class="btn btn-primary">
              <i class="fas fa-bell"></i>
              Show Permission Banner
            </button>
            <button id="checkNotificationStatus" class="btn btn-info">
              <i class="fas fa-info-circle"></i>
              Check Status
            </button>
          </div>
        </div>
        
        <!-- Loading State -->
        <div id="loadingContainer" class="loading-container hidden">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading stories...</p>
          </div>
        </div>

        <!-- Login Required State -->
        <div id="loginRequiredContainer" class="login-required-container hidden">
          <div class="card text-center">
            <div style="padding: 2rem;">
              <i class="fas fa-lock" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
              <h3>Login Required</h3>
              <p class="text-muted mb-3">Please login to view and share stories</p>
              <div>
                <a href="#/login" class="btn btn-primary me-2">
                  <i class="fas fa-sign-in-alt"></i> Login
                </a>
                <a href="#/register" class="btn btn-secondary">
                  <i class="fas fa-user-plus"></i> Register
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div id="errorContainer" class="error-container hidden">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Stories</h3>
            <p id="errorMessage">Something went wrong</p>
            <button id="retryBtn" class="btn btn-primary">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div id="mainContent" class="main-content hidden">
          <!-- Map Container -->
          <div class="map-container" id="mapContainer">
            <div id="mapElement" style="height: 400px; width: 100%;"></div>
            <div id="mapError" class="map-error hidden">
              <div class="text-center" style="padding: 2rem;">
                <i class="fas fa-map" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem;"></i>
                <p style="color: #6c757d;">Map could not be loaded</p>
              </div>
            </div>
          </div>
          
          <!-- Stories Section -->
          <div class="stories-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2>
                <i class="fas fa-book-open"></i>
                Latest Stories
                <span id="storiesCount" class="count-badge hidden">(0)</span>
              </h2>
              <div class="action-buttons">
                <button id="refreshBtn" class="btn btn-secondary">
                  <i class="fas fa-sync-alt"></i>
                  <span class="btn-text">Refresh</span>
                </button>
                <a href="#/add" class="btn btn-primary">
                  <i class="fas fa-plus"></i>
                  Share Your Story
                </a>
              </div>
            </div>
            
            <div class="grid grid-3" id="storiesGrid">
              <!-- Stories will be loaded here -->
            </div>
          </div>
        </div>

        <!-- Offline Message -->
        <div id="offlineMessage" class="offline-message hidden">
          <i class="fas fa-wifi-slash"></i>
          Showing offline data
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      this.presenter = new HomePresenter(this);
      this.initEventListeners();
      this.initTestButtons();
      await this.presenter.init();
    } catch (error) {
      console.error('Error in home afterRender:', error);
      this.showError('Failed to initialize: ' + error.message);
    }
  }

  initEventListeners() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (this.presenter) {
          this.presenter.loadContent();
        }
      });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.presenter) {
          this.presenter.refreshStories();
        }
      });
    }
  }

  initTestButtons() {
    const testNotificationBtn = document.getElementById('testNotificationBtn');
    const showPermissionBtn = document.getElementById('showPermissionBanner');
    const checkStatusBtn = document.getElementById('checkNotificationStatus');

    if (testNotificationBtn) {
      testNotificationBtn.addEventListener('click', async () => {
        try {
          console.log('🧪 Manual test notification triggered');
          
          const { pushManager } = await import('../utils/push-manager.js');
          
          await pushManager.init();
          await pushManager.subscribe();
          await pushManager.sendTestNotification();
          
          Alert.success('Test notification sent!');
        } catch (error) {
          console.error('Test notification failed:', error);
          Alert.error('Test notification failed: ' + error.message);
        }
      });
    }

    if (showPermissionBtn) {
      showPermissionBtn.addEventListener('click', async () => {
        try {
          console.log('🎯 Manual permission banner triggered');
          
          const { notificationPermission } = await import('../components/notification-permission.js');
          notificationPermission.forceShow();
        } catch (error) {
          console.error('Show permission banner failed:', error);
          Alert.error('Failed to show permission banner: ' + error.message);
        }
      });
    }

    if (checkStatusBtn) {
      checkStatusBtn.addEventListener('click', async () => {
        try {
          console.log('📊 Checking notification status...');
          
          const { pushManager } = await import('../utils/push-manager.js');
          const status = pushManager.getSubscriptionStatus();
          
          Alert.success(
            `Support: ${status.isSupported ? 'Yes' : 'No'}\n` +
            `Permission: ${status.permission}\n` +
            `Subscribed: ${status.isSubscribed ? 'Yes' : 'No'}`,
            'Notification Status'
          );
        } catch (error) {
          console.error('Check status failed:', error);
          Alert.error('Failed to check status: ' + error.message);
        }
      });
    }
  }

  showLoading() {
    this.hideAllContainers();
    document.getElementById('loadingContainer')?.classList.remove('hidden');
  }

  showLoginRequired() {
    this.hideAllContainers();
    document.getElementById('loginRequiredContainer')?.classList.remove('hidden');
  }

  showError(message) {
    this.hideAllContainers();
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorContainer) errorContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
  }

  showOfflineMessage() {
    const offlineMessage = document.getElementById('offlineMessage');
    if (offlineMessage) {
      offlineMessage.classList.remove('hidden');
      setTimeout(() => {
        offlineMessage.classList.add('hidden');
      }, 3000);
    }
  }

  displayStories(stories, favorites = []) {
    this.hideAllContainers();
    document.getElementById('mainContent')?.classList.remove('hidden');
    
    const gridEl = document.getElementById('storiesGrid');
    const countEl = document.getElementById('storiesCount');
    
    if (countEl) {
      countEl.textContent = `(${stories.length})`;
      countEl.classList.remove('hidden');
    }

    if (!gridEl) return;

    if (stories.length === 0) {
      gridEl.innerHTML = `
        <div class="col-span-full">
          <div class="card text-center">
            <div style="padding: 2rem;">
              <i class="fas fa-book-open" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
              <h3>No Stories Yet</h3>
              <p class="text-muted mb-3">Be the first to share your amazing story!</p>
              <a href="#/add" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add First Story
              </a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = stories.map(story => `
      <div class="story-item">
        <div class="story-image-container">
          <img src="${story.photoUrl}" alt="${story.name}" class="story-image" loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f8f9fa%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236c757d%22>Image not found</text></svg>'">
          <button class="favorite-btn ${favorites.includes(story.id) ? 'active' : ''}" 
                  data-id="${story.id}" title="Add to favorites">
            <i class="fas fa-heart"></i>
          </button>
        </div>
        <div class="story-content">
          <h3 class="story-title">
            <a href="#/detail/${story.id}">${story.name}</a>
          </h3>
          <p class="story-date">
            <i class="fas fa-calendar"></i>
            ${new Date(story.createdAt).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p class="story-description">
            ${story.description.length > 100 ? 
              story.description.substring(0, 100) + '...' : 
              story.description
            }
          </p>
          ${story.lat && story.lon ? 
            '<p class="story-location"><i class="fas fa-map-marker-alt"></i> Has location</p>' : 
            ''
          }
        </div>
      </div>
    `).join('');

    this.initFavoriteButtons();
  }

  initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const storyId = btn.dataset.id;
        if (this.presenter) {
          await this.presenter.toggleFavorite(storyId);
        }
      });
    });
  }

  updateFavoriteButton(storyId, isFavorite) {
    const btn = document.querySelector(`[data-id="${storyId}"]`);
    if (btn) {
      if (isFavorite) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }

  initializeMap(stories) {
    const mapElement = document.getElementById('mapElement');
    const mapError = document.getElementById('mapError');
    
    if (!window.L || !mapElement) {
      if (mapError) mapError.classList.remove('hidden');
      return;
    }

    try {
      if (this.map) {
        this.map.remove();
      }

      this.map = window.L.map(mapElement).setView([-2.5489, 118.0149], 5);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      stories.forEach(story => {
        if (story.lat && story.lon) {
          const marker = window.L.marker([story.lat, story.lon]).addTo(this.map);
          marker.bindPopup(`
            <div style="text-align: center; min-width: 200px;">
              <img src="${story.photoUrl}" alt="${story.name}" 
                   style="width: 150px; height: 100px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;"
                   onerror="this.style.display='none'">
              <h4 style="margin: 5px 0;">${story.name}</h4>
              <p style="margin: 5px 0; font-size: 0.9rem;">${story.description.substring(0, 80)}...</p>
              <a href="#/detail/${story.id}" class="btn btn-primary btn-sm" style="margin-top: 5px;">
                <i class="fas fa-eye"></i> View Details
              </a>
            </div>
          `);
        }
      });
      
      console.log(`✅ Map initialized with ${stories.length} markers`);
      
    } catch (error) {
      console.error('Map initialization error:', error);
      if (mapError) mapError.classList.remove('hidden');
    }
  }

  showMapError() {
    const mapError = document.getElementById('mapError');
    if (mapError) mapError.classList.remove('hidden');
  }

  showRefreshLoading() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Refreshing...</span>';
      refreshBtn.disabled = true;
      refreshBtn.dataset.originalHtml = originalHTML;
    }
  }

  hideRefreshLoading() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn && refreshBtn.dataset.originalHtml) {
      refreshBtn.innerHTML = refreshBtn.dataset.originalHtml;
      refreshBtn.disabled = false;
      delete refreshBtn.dataset.originalHtml;
    }
  }

  showToast(message, type = 'success') {
    if (window.Swal) {
      window.Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } else {
      console.log(`Toast: ${message}`);
    }
  }

  hideAllContainers() {
    const containers = [
      'loadingContainer',
      'loginRequiredContainer', 
      'errorContainer',
      'mainContent'
    ];
    
    containers.forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }

  cleanup() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    if (this.presenter) {
      this.presenter.destroy();
      this.presenter = null;
    }
  }
}

export default HomeView;