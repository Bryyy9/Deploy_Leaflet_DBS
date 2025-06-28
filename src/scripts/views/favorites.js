// Favorites View - Complete Implementation
import { storage } from '../data/storage.js';
import { Alert } from '../utils/alert.js';

export class FavoritesView {
  constructor() {
    this.requiresAuth = true;
    this.favorites = [];
    this.isLoading = false;
  }

  /**
   * Render the favorites page
   * @returns {string} HTML template
   */
  async render() {
    return `
      <div class="favorites-view">
        <!-- Header Section -->
        <div class="favorites-header">
          <h1 class="page-title">
            <i class="fas fa-heart"></i>
            My Favorite Stories
          </h1>
          <p class="page-subtitle">
            Stories you've saved and loved. Keep track of your favorite reads!
          </p>
        </div>

        <!-- Action Bar -->
        <div class="action-bar">
          <div class="favorites-count">
            <span id="favoritesCount" class="count-badge">
              <i class="fas fa-heart"></i>
              <span id="countNumber">0</span> favorites
            </span>
          </div>
          
          <div class="action-buttons">
            <button id="refreshBtn" class="btn btn-secondary" title="Refresh favorites">
              <i class="fas fa-sync-alt"></i>
              <span class="btn-text">Refresh</span>
            </button>
            
            <button id="clearAllBtn" class="btn btn-danger" title="Clear all favorites" style="display: none;">
              <i class="fas fa-trash-alt"></i>
              <span class="btn-text">Clear All</span>
            </button>
            
            <a href="#/" class="btn btn-primary">
              <i class="fas fa-search"></i>
              <span class="btn-text">Discover More</span>
            </a>
          </div>
        </div>

        <!-- Loading State -->
        <div id="loadingContainer" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-heart fa-beat"></i>
            <p>Loading your favorite stories...</p>
          </div>
        </div>

        <!-- Error State -->
        <div id="errorContainer" class="error-container hidden">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p id="errorMessage">Failed to load favorites</p>
            <button id="retryBtn" class="btn btn-primary">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div id="emptyContainer" class="empty-container hidden">
          <div class="empty-content">
            <div class="empty-icon">
              <i class="fas fa-heart-broken"></i>
            </div>
            <h3>No Favorite Stories Yet</h3>
            <p>Start exploring amazing stories and add them to your favorites!</p>
            <div class="empty-actions">
              <a href="#/" class="btn btn-primary">
                <i class="fas fa-compass"></i> Explore Stories
              </a>
              <a href="#/add" class="btn btn-secondary">
                <i class="fas fa-plus"></i> Share Your Story
              </a>
            </div>
            
            <!-- Tips Section -->
            <div class="tips-section">
              <h6><i class="fas fa-lightbulb"></i> How to add favorites:</h6>
              <ul class="tips-list">
                <li>Browse stories on the home page</li>
                <li>Click the <i class="fas fa-heart" style="color: #e74c3c;"></i> icon on any story</li>
                <li>Your favorites will appear here</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Favorites Grid -->
        <div id="favoritesContainer" class="favorites-container hidden">
          <div class="grid grid-3" id="favoritesGrid">
            <!-- Dynamic content will be loaded here -->
          </div>
        </div>

        <!-- Bulk Actions (when items selected) -->
        <div id="bulkActions" class="bulk-actions hidden">
          <div class="bulk-actions-content">
            <span class="selected-count">
              <i class="fas fa-check-circle"></i>
              <span id="selectedCount">0</span> selected
            </span>
            <div class="bulk-buttons">
              <button id="selectAllBtn" class="btn btn-secondary btn-sm">
                <i class="fas fa-check-double"></i> Select All
              </button>
              <button id="deselectAllBtn" class="btn btn-secondary btn-sm">
                <i class="fas fa-times"></i> Deselect All
              </button>
              <button id="removeSelectedBtn" class="btn btn-danger btn-sm">
                <i class="fas fa-trash"></i> Remove Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize the favorites view after rendering
   */
  async afterRender() {
    try {
      console.log('🎯 Initializing Favorites View...');
      
      // Initialize storage
      await this.initStorage();
      
      // Initialize UI handlers
      this.initEventHandlers();
      
      // Load favorites
      await this.loadFavorites();
      
      console.log('✅ Favorites View initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing favorites view:', error);
      this.showError('Failed to initialize favorites: ' + error.message);
    }
  }

  /**
   * Initialize storage
   */
  async initStorage() {
    try {
      await storage.init();
      console.log('📦 Storage initialized for favorites');
    } catch (error) {
      console.error('Storage initialization failed:', error);
      throw new Error('Storage not available');
    }
  }

  /**
   * Initialize event handlers
   */
  initEventHandlers() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.handleClearAll());
    }

    // Retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadFavorites());
    }

    // Bulk action buttons
    this.initBulkActionHandlers();

    console.log('🎮 Event handlers initialized');
  }

  /**
   * Initialize bulk action handlers
   */
  initBulkActionHandlers() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllFavorites());
    }

    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => this.deselectAllFavorites());
    }

    if (removeSelectedBtn) {
      removeSelectedBtn.addEventListener('click', () => this.removeSelectedFavorites());
    }
  }

  /**
   * Load favorites from storage
   */
  async loadFavorites() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading();
    
    try {
      console.log('📚 Loading favorites from storage...');
      
      // Get favorites from storage
      this.favorites = await storage.getFavorites();
      
      console.log(`✅ Loaded ${this.favorites.length} favorites`);
      
      // Update UI
      this.updateFavoritesCount();
      
      if (this.favorites.length === 0) {
        this.showEmpty();
      } else {
        await this.renderFavorites();
        this.showFavorites();
      }
      
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      this.showError('Failed to load favorites: ' + error.message);
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render favorites grid
   */
  async renderFavorites() {
    const gridEl = document.getElementById('favoritesGrid');
    
    if (!gridEl || this.favorites.length === 0) return;
    
    try {
      // Sort favorites by date added (newest first)
      const sortedFavorites = [...this.favorites].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.dateAdded || 0);
        const dateB = new Date(b.createdAt || b.dateAdded || 0);
        return dateB - dateA;
      });

      // Generate HTML for each favorite
      gridEl.innerHTML = sortedFavorites.map(story => this.createFavoriteItemHTML(story)).join('');
      
      // Initialize item handlers
      this.initFavoriteItemHandlers();
      
      console.log('🎨 Favorites rendered successfully');
      
    } catch (error) {
      console.error('Error rendering favorites:', error);
      throw error;
    }
  }

  /**
   * Create HTML for a single favorite item
   * @param {object} story - Story object
   * @returns {string} HTML string
   */
  createFavoriteItemHTML(story) {
    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return 'Unknown date';
      }
    };

    return `
      <div class="favorite-item" data-story-id="${story.id}">
        <!-- Selection Checkbox -->
        <div class="item-selection">
          <input type="checkbox" class="selection-checkbox" data-story-id="${story.id}">
        </div>

        <!-- Story Image -->
        <div class="story-image-container">
          <img src="${story.photoUrl}" 
               alt="${story.name}" 
               class="story-image" 
               loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f8f9fa%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236c757d%22>Image not found</text></svg>'">
          
          <!-- Favorite Badge -->
          <div class="favorite-badge">
            <i class="fas fa-heart"></i>
          </div>
        </div>

        <!-- Story Content -->
        <div class="story-content">
          <h3 class="story-title">
            <a href="#/detail/${story.id}" title="View story details">${story.name}</a>
          </h3>
          
          <p class="story-date">
            <i class="fas fa-calendar-alt"></i>
            ${formatDate(story.createdAt)}
          </p>
          
          <p class="story-description">
            ${story.description.length > 120 ? 
              story.description.substring(0, 120) + '...' : 
              story.description
            }
          </p>
          
          ${story.lat && story.lon ? 
            '<p class="story-location"><i class="fas fa-map-marker-alt"></i> Has location</p>' : 
            ''
          }
        </div>

        <!-- Action Buttons -->
        <div class="story-actions">
          <a href="#/detail/${story.id}" class="btn btn-primary btn-sm" title="View details">
            <i class="fas fa-eye"></i>
            <span>View</span>
          </a>
          
          <button class="btn btn-secondary btn-sm share-btn" 
                  data-story-id="${story.id}" 
                  title="Share story">
            <i class="fas fa-share-alt"></i>
            <span>Share</span>
          </button>
          
          <button class="btn btn-danger btn-sm remove-btn" 
                  data-story-id="${story.id}" 
                  title="Remove from favorites">
            <i class="fas fa-heart-broken"></i>
            <span>Remove</span>
          </button>
        </div>

        <!-- Story Stats (if available) -->
        <div class="story-stats">
          <span class="stat-item" title="Added to favorites">
            <i class="fas fa-heart"></i>
            Favorited
          </span>
          ${story.lat && story.lon ? 
            '<span class="stat-item" title="Has location data"><i class="fas fa-map-pin"></i> Located</span>' : 
            ''
          }
        </div>
      </div>
    `;
  }

  /**
   * Initialize handlers for favorite items
   */
  initFavoriteItemHandlers() {
    // Remove buttons
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const storyId = btn.dataset.storyId;
        this.handleRemoveFavorite(storyId);
      });
    });

    // Share buttons
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const storyId = btn.dataset.storyId;
        this.handleShareStory(storyId);
      });
    });

    // Selection checkboxes
    const checkboxes = document.querySelectorAll('.selection-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateBulkActions();
      });
    });

    // Double-click to view story
    const favoriteItems = document.querySelectorAll('.favorite-item');
    favoriteItems.forEach(item => {
      item.addEventListener('dblclick', () => {
        const storyId = item.dataset.storyId;
        window.location.hash = `#/detail/${storyId}`;
      });
    });

    console.log('🎯 Favorite item handlers initialized');
  }

  /**
   * Handle removing a single favorite
   * @param {string} storyId - Story ID to remove
   */
  async handleRemoveFavorite(storyId) {
    const story = this.favorites.find(s => s.id === storyId);
    
    if (!story) {
      console.error('Story not found:', storyId);
      return;
    }

    try {
      // Show confirmation dialog
      const result = await Alert.confirm(
        `Remove "${story.name}" from your favorites?`,
        'Remove Favorite'
      );
      
      if (!result.isConfirmed) return;
      
      // Remove from storage
      await storage.removeFavorite(storyId);
      
      // Update local array
      this.favorites = this.favorites.filter(s => s.id !== storyId);
      
      // Update UI
      this.updateFavoritesCount();
      
      // Remove item from DOM with animation
      const itemEl = document.querySelector(`[data-story-id="${storyId}"]`);
      if (itemEl) {
        itemEl.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
          itemEl.remove();
          
          // Check if empty
          if (this.favorites.length === 0) {
            this.showEmpty();
          }
        }, 300);
      }
      
      // Show success message
      Alert.toast('Removed from favorites', 'success');
      
      console.log('✅ Favorite removed:', storyId);
      
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      Alert.error('Failed to remove favorite: ' + error.message);
    }
  }

  /**
   * Handle sharing a story
   * @param {string} storyId - Story ID to share
   */
  async handleShareStory(storyId) {
    const story = this.favorites.find(s => s.id === storyId);
    
    if (!story) return;

    try {
      const shareData = {
        title: `${story.name} - StoryMaps`,
        text: story.description.substring(0, 100) + '...',
        url: `${window.location.origin}/#/detail/${storyId}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
        Alert.toast('Story shared successfully!', 'success');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        Alert.toast('Story link copied to clipboard!', 'info');
      }
      
    } catch (error) {
      console.error('Share error:', error);
      Alert.toast('Failed to share story', 'error');
    }
  }

  /**
   * Handle refresh action
   */
  async handleRefresh() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (refreshBtn) {
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Refreshing...</span>';
      refreshBtn.disabled = true;
    }
    
    try {
      await this.loadFavorites();
      Alert.toast('Favorites refreshed!', 'success');
    } finally {
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span class="btn-text">Refresh</span>';
        refreshBtn.disabled = false;
      }
    }
  }

  /**
   * Handle clear all favorites
   */
  async handleClearAll() {
    if (this.favorites.length === 0) return;
    
    try {
      const result = await Alert.confirm(
        `Remove all ${this.favorites.length} favorites? This action cannot be undone.`,
        'Clear All Favorites'
      );
      
      if (!result.isConfirmed) return;
      
      // Clear all from storage
      for (const story of this.favorites) {
        await storage.removeFavorite(story.id);
      }
      
      // Update local state
      this.favorites = [];
      this.updateFavoritesCount();
      
      // Show empty state
      this.showEmpty();
      
      Alert.success('All favorites cleared successfully!');
      
    } catch (error) {
      console.error('Error clearing favorites:', error);
      Alert.error('Failed to clear favorites: ' + error.message);
    }
  }

  /**
   * Select all favorites
   */
  selectAllFavorites() {
    const checkboxes = document.querySelectorAll('.selection-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    this.updateBulkActions();
  }

  /**
   * Deselect all favorites
   */
  deselectAllFavorites() {
    const checkboxes = document.querySelectorAll('.selection-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    this.updateBulkActions();
  }

  /**
   * Remove selected favorites
   */
  async removeSelectedFavorites() {
    const selectedCheckboxes = document.querySelectorAll('.selection-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.storyId);
    
    if (selectedIds.length === 0) {
      Alert.info('Please select favorites to remove');
      return;
    }
    
    try {
      const result = await Alert.confirm(
        `Remove ${selectedIds.length} selected favorites?`,
        'Remove Selected'
      );
      
      if (!result.isConfirmed) return;
      
      // Remove each selected favorite
      for (const storyId of selectedIds) {
        await storage.removeFavorite(storyId);
        this.favorites = this.favorites.filter(s => s.id !== storyId);
      }
      
      // Update UI
      this.updateFavoritesCount();
      
      if (this.favorites.length === 0) {
        this.showEmpty();
      } else {
        await this.renderFavorites();
      }
      
      this.updateBulkActions();
      
      Alert.success(`${selectedIds.length} favorites removed successfully!`);
      
    } catch (error) {
      console.error('Error removing selected favorites:', error);
      Alert.error('Failed to remove selected favorites: ' + error.message);
    }
  }

  /**
   * Update bulk actions visibility
   */
  updateBulkActions() {
    const selectedCheckboxes = document.querySelectorAll('.selection-checkbox:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCountEl = document.getElementById('selectedCount');
    
    if (selectedCheckboxes.length > 0) {
      bulkActions?.classList.remove('hidden');
      if (selectedCountEl) {
        selectedCountEl.textContent = selectedCheckboxes.length;
      }
    } else {
      bulkActions?.classList.add('hidden');
    }
  }

  /**
   * Update favorites count display
   */
  updateFavoritesCount() {
    const countEl = document.getElementById('countNumber');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (countEl) {
      countEl.textContent = this.favorites.length;
    }
    
    if (clearAllBtn) {
      if (this.favorites.length > 0) {
        clearAllBtn.style.display = 'inline-flex';
      } else {
        clearAllBtn.style.display = 'none';
      }
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.hideAllContainers();
    document.getElementById('loadingContainer')?.classList.remove('hidden');
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showError(message) {
    this.hideAllContainers();
    
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorContainer) errorContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
  }

  /**
   * Show empty state
   */
  showEmpty() {
    this.hideAllContainers();
    document.getElementById('emptyContainer')?.classList.remove('hidden');
  }

  /**
   * Show favorites
   */
  showFavorites() {
    this.hideAllContainers();
    document.getElementById('favoritesContainer')?.classList.remove('hidden');
  }

  /**
   * Hide all container states
   */
  hideAllContainers() {
    const containers = [
      'loadingContainer',
      'errorContainer', 
      'emptyContainer',
      'favoritesContainer'
    ];
    
    containers.forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }
}

// Ensure proper export
export default FavoritesView;