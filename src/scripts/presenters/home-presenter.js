import { BasePresenter } from './base-presenter.js';
import { ApiService } from '../data/api.js';
import { storage } from '../data/storage.js';

export class HomePresenter extends BasePresenter {
  constructor(view) {
    super(view);
    this.stories = [];
    this.favorites = [];
  }

  async init() {
    try {
      await this.initializeStorage();
      await this.loadContent();
    } catch (error) {
      this.handleError(error, 'Home Initialization');
    }
  }

  async initializeStorage() {
    try {
      await storage.init();
      console.log('📦 Storage initialized');
    } catch (error) {
      console.warn('Storage initialization failed:', error);
    }
  }

  async loadContent() {
    this.safeViewCall('showLoading');

    try {
      if (!this.isAuthenticated()) {
        this.safeViewCall('showLoginRequired');
        return;
      }

      await this.loadStories();
      await this.loadFavorites();
      this.safeViewCall('displayStories', this.stories, this.favorites);
      this.safeViewCall('initializeMap', this.stories.filter(s => s.lat && s.lon));
      
    } catch (error) {
      this.handleError(error, 'Content Loading');
    }
  }

  async loadStories() {
    try {
      if (navigator.onLine) {
        const response = await ApiService.getStories();
        this.stories = response.listStory || [];
        
        if (storage && this.stories.length > 0) {
          await storage.saveStories(this.stories);
        }
        
        console.log(`✅ Loaded ${this.stories.length} stories from API`);
      } else {
        throw new Error('offline');
      }
    } catch (error) {
      console.warn('API failed, trying storage:', error.message);
      
      if (storage) {
        this.stories = await storage.getStories() || [];
        if (this.stories.length > 0) {
          this.safeViewCall('showOfflineMessage');
          console.log(`✅ Loaded ${this.stories.length} stories from storage`);
        }
      }
      
      if (this.stories.length === 0) {
        throw new Error('No stories available');
      }
    }
  }

  async loadFavorites() {
    try {
      if (storage) {
        const favoritesList = await storage.getFavorites();
        this.favorites = favoritesList.map(f => f.id);
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error);
      this.favorites = [];
    }
  }

  async toggleFavorite(storyId) {
    try {
      if (!storage) {
        throw new Error('Storage not available');
      }

      const story = this.stories.find(s => s.id === storyId);
      if (!story) {
        throw new Error('Story not found');
      }

      const isFavorite = this.favorites.includes(storyId);
      
      if (isFavorite) {
        await storage.removeFavorite(storyId);
        this.favorites = this.favorites.filter(id => id !== storyId);
        this.safeViewCall('showToast', 'Removed from favorites', 'info');
      } else {
        await storage.addFavorite(story);
        this.favorites.push(storyId);
        this.safeViewCall('showToast', 'Added to favorites', 'success');
      }

      this.safeViewCall('updateFavoriteButton', storyId, !isFavorite);
      
    } catch (error) {
      this.handleError(error, 'Toggle Favorite');
    }
  }

  async refreshStories() {
    try {
      this.safeViewCall('showRefreshLoading');
      await this.loadStories();
      await this.loadFavorites();
      this.safeViewCall('displayStories', this.stories, this.favorites);
      this.safeViewCall('showToast', 'Stories refreshed!', 'success');
    } catch (error) {
      this.handleError(error, 'Refresh Stories');
    } finally {
      this.safeViewCall('hideRefreshLoading');
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  getStoriesCount() {
    return this.stories.length;
  }

  getFavoritesCount() {
    return this.favorites.length;
  }
}