// src/scripts/presenters/favorites-presenter.js
import { BasePresenter } from './base-presenter.js';
import { storage } from '../data/storage.js';

export class FavoritesPresenter extends BasePresenter {
  constructor(view) {
    super(view);
    this.favorites = [];
    this.selectedItems = new Set();
  }

  async init() {
    try {
      // Check authentication
      if (!this.isAuthenticated()) {
        this.redirectToLogin();
        return;
      }

      await this.initializeStorage();
      await this.loadFavorites();
    } catch (error) {
      this.handleError(error, 'Favorites Initialization');
    }
  }

  async initializeStorage() {
    try {
      await storage.init();
      console.log('📦 Storage initialized for favorites');
    } catch (error) {
      throw new Error('Storage not available');
    }
  }

  async loadFavorites() {
    try {
      this.safeViewCall('showLoading');
      
      this.favorites = await storage.getFavorites();
      
      console.log(`✅ Loaded ${this.favorites.length} favorites`);
      
      this.safeViewCall('updateFavoritesCount', this.favorites.length);
      
      if (this.favorites.length === 0) {
        this.safeViewCall('showEmpty');
      } else {
        this.safeViewCall('displayFavorites', this.favorites);
      }
      
    } catch (error) {
      this.handleError(error, 'Load Favorites');
    }
  }

  async removeFavorite(storyId) {
    try {
      const story = this.favorites.find(s => s.id === storyId);
      if (!story) {
        throw new Error('Story not found');
      }

      const confirmed = await this.safeViewCall('confirmRemove', story.name);
      if (!confirmed) return;

      await storage.removeFavorite(storyId);
      
      // Update local array
      this.favorites = this.favorites.filter(s => s.id !== storyId);
      
      // Update UI
      this.safeViewCall('removeFavoriteFromUI', storyId);
      this.safeViewCall('updateFavoritesCount', this.favorites.length);
      this.safeViewCall('showToast', 'Removed from favorites', 'success');
      
      // Show empty state if no favorites left
      if (this.favorites.length === 0) {
        this.safeViewCall('showEmpty');
      }
      
      // Clear from selected items
      this.selectedItems.delete(storyId);
      this.updateBulkActions();
      
    } catch (error) {
      this.handleError(error, 'Remove Favorite');
    }
  }

  async refreshFavorites() {
    try {
      this.safeViewCall('showRefreshLoading');
      await this.loadFavorites();
      this.safeViewCall('showToast', 'Favorites refreshed!', 'success');
    } catch (error) {
      this.handleError(error, 'Refresh Favorites');
    } finally {
      this.safeViewCall('hideRefreshLoading');
    }
  }

  async clearAllFavorites() {
    try {
      if (this.favorites.length === 0) return;

      const confirmed = await this.safeViewCall('confirmClearAll', this.favorites.length);
      if (!confirmed) return;

      // Clear all from storage
      for (const story of this.favorites) {
        await storage.removeFavorite(story.id);
      }

      this.favorites = [];
      this.selectedItems.clear();
      
      this.safeViewCall('updateFavoritesCount', 0);
      this.safeViewCall('showEmpty');
      this.safeViewCall('showSuccessMessage', 'All favorites cleared successfully!');
      
    } catch (error) {
      this.handleError(error, 'Clear All Favorites');
    }
  }

  async shareStory(storyId) {
    try {
      const story = this.favorites.find(s => s.id === storyId);
      if (!story) return;

      const shareData = {
        title: `${story.name} - StoryMaps`,
        text: story.description.substring(0, 100) + '...',
        url: `${window.location.origin}/#/detail/${storyId}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
        this.safeViewCall('showToast', 'Story shared successfully!', 'success');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        this.safeViewCall('showToast', 'Story link copied to clipboard!', 'info');
      }
      
    } catch (error) {
      console.error('Share error:', error);
      this.safeViewCall('showToast', 'Failed to share story', 'error');
    }
  }

  // Bulk Actions
  toggleItemSelection(storyId, isSelected) {
    if (isSelected) {
      this.selectedItems.add(storyId);
    } else {
      this.selectedItems.delete(storyId);
    }
    this.updateBulkActions();
  }

  selectAllItems() {
    this.selectedItems.clear();
    this.favorites.forEach(story => {
      this.selectedItems.add(story.id);
    });
    this.safeViewCall('selectAllCheckboxes');
    this.updateBulkActions();
  }

  deselectAllItems() {
    this.selectedItems.clear();
    this.safeViewCall('deselectAllCheckboxes');
    this.updateBulkActions();
  }

  async removeSelectedItems() {
    try {
      const selectedIds = Array.from(this.selectedItems);
      
      if (selectedIds.length === 0) {
        this.safeViewCall('showToast', 'Please select favorites to remove', 'info');
        return;
      }

      const confirmed = await this.safeViewCall('confirmRemoveSelected', selectedIds.length);
      if (!confirmed) return;

      // Remove each selected favorite
      for (const storyId of selectedIds) {
        await storage.removeFavorite(storyId);
        this.favorites = this.favorites.filter(s => s.id !== storyId);
      }

      // Update UI
      this.safeViewCall('updateFavoritesCount', this.favorites.length);
      
      if (this.favorites.length === 0) {
        this.safeViewCall('showEmpty');
      } else {
        this.safeViewCall('displayFavorites', this.favorites);
      }

      this.selectedItems.clear();
      this.updateBulkActions();

      this.safeViewCall('showSuccessMessage', 
        `${selectedIds.length} favorites removed successfully!`
      );
      
    } catch (error) {
      this.handleError(error, 'Remove Selected Favorites');
    }
  }

  updateBulkActions() {
    const selectedCount = this.selectedItems.size;
    this.safeViewCall('updateBulkActions', selectedCount);
  }

  // Utility Methods
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  redirectToLogin() {
    window.location.hash = '#/login';
  }

  getFavoritesCount() {
    return this.favorites.length;
  }

  getSelectedCount() {
    return this.selectedItems.size;
  }

  isFavorite(storyId) {
    return this.favorites.some(story => story.id === storyId);
  }
}