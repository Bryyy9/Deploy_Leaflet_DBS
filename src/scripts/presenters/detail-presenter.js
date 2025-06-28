// src/scripts/presenters/detail-presenter.js
import { BasePresenter } from './base-presenter.js';
import { ApiService } from '../data/api.js';
import { storage } from '../data/storage.js';

export class DetailPresenter extends BasePresenter {
  constructor(view, storyId) {
    super(view);
    this.storyId = storyId;
    this.story = null;
    this.isFavorite = false;
  }

  async init() {
    try {
      // Check authentication
      if (!this.isAuthenticated()) {
        this.redirectToLogin();
        return;
      }

      if (!this.storyId) {
        throw new Error('Story ID not provided');
      }

      await this.initializeStorage();
      await this.loadStory();
    } catch (error) {
      this.handleError(error, 'Detail Initialization');
    }
  }

  async initializeStorage() {
    try {
      await storage.init();
    } catch (error) {
      console.warn('Storage initialization failed:', error);
    }
  }

  async loadStory() {
    try {
      this.safeViewCall('showLoading');

      // Load story details
      const response = await ApiService.getStoryDetail(this.storyId);
      this.story = response.story;

      if (!this.story) {
        throw new Error('Story not found');
      }

      // Check if story is in favorites
      await this.checkFavoriteStatus();

      // Display story
      this.safeViewCall('displayStory', this.story, this.isFavorite);

      // Initialize map if location exists
      if (this.story.lat && this.story.lon) {
        this.safeViewCall('initializeMap', this.story.lat, this.story.lon, this.story.name);
      }

      console.log('✅ Story loaded successfully:', this.story.name);

    } catch (error) {
      if (error.message.includes('404')) {
        this.safeViewCall('showNotFound');
      } else {
        this.handleError(error, 'Load Story');
      }
    }
  }

  async checkFavoriteStatus() {
    try {
      if (storage) {
        this.isFavorite = await storage.isFavorite(this.storyId);
      }
    } catch (error) {
      console.warn('Failed to check favorite status:', error);
      this.isFavorite = false;
    }
  }

  async toggleFavorite() {
    try {
      if (!storage) {
        throw new Error('Storage not available');
      }

      if (!this.story) {
        throw new Error('Story not loaded');
      }

      if (this.isFavorite) {
        await storage.removeFavorite(this.storyId);
        this.isFavorite = false;
        this.safeViewCall('updateFavoriteButton', false);
        this.safeViewCall('showToast', 'Removed from favorites', 'info');
      } else {
        await storage.addFavorite(this.story);
        this.isFavorite = true;
        this.safeViewCall('updateFavoriteButton', true);
        this.safeViewCall('showToast', 'Added to favorites', 'success');
      }

    } catch (error) {
      this.handleError(error, 'Toggle Favorite');
    }
  }

  async shareStory() {
    try {
      if (!this.story) return;

      const shareData = {
        title: `${this.story.name} - StoryMaps`,
        text: this.story.description.substring(0, 100) + '...',
        url: `${window.location.origin}/#/detail/${this.storyId}`
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

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#/';
    }
  }

  goToHome() {
    window.location.hash = '#/';
  }

  goToFavorites() {
    window.location.hash = '#/favorites';
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

  getStoryId() {
    return this.storyId;
  }

  getStory() {
    return this.story;
  }

  getIsFavorite() {
    return this.isFavorite;
  }

  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  }
}