// Favorites View
import { storage } from '../data/storage.js';
import { Alert } from '../utils/alert.js';

export class FavoritesView {
  constructor() {
    this.requiresAuth = true;
    this.favorites = [];
  }

  async render() {
    return `
      <div class="favorites-view">
        <h1 class="mb-3">❤️ My Favorites</h1>
        
        <div class="grid grid-3" id="favoritesGrid">
          <div class="loading">
            <i class="fas fa-spinner"></i> Loading favorites...
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await storage.init();
    await this.loadFavorites();
  }

  async loadFavorites() {
    const gridEl = document.getElementById('favoritesGrid');
    
    try {
      this.favorites = await storage.getFavorites();
      
      if (this.favorites.length === 0) {
        gridEl.innerHTML = `
          <div class="card text-center">
            <h3>No favorites yet</h3>
            <p>Start exploring and add stories to your favorites!</p>
            <a href="#/" class="btn btn-primary">Explore Stories</a>
          </div>
        `;
        return;
      }

      gridEl.innerHTML = this.favorites.map(story => `
        <div class="story-item">
          <img src="${story.photoUrl}" alt="${story.name}" class="story-image">
          <button class="favorite-btn active" data-id="${story.id}">
            <i class="fas fa-heart"></i>
          </button>
          <div class="story-content">
            <h3 class="story-title">
              <a href="#/detail/${story.id}">${story.name}</a>
            </h3>
            <p class="story-date">
              <i class="fas fa-calendar"></i>
              ${new Date(story.createdAt).toLocaleDateString()}
            </p>
            <p class="story-description">
              ${story.description.substring(0, 100)}...
            </p>
          </div>
        </div>
      `).join('');

      // Add remove listeners
      document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.removeFavorite(e));
      });

    } catch (error) {
      Alert.error('Error loading favorites');
      gridEl.innerHTML = '<div class="card"><p>Error loading favorites</p></div>';
    }
  }

  async removeFavorite(e) {
    e.stopPropagation();
    
    const result = await Alert.confirm('Remove from favorites?');
    if (!result.isConfirmed) return;

    const btn = e.currentTarget;
    const storyId = btn.dataset.id;
    
    try {
      await storage.removeFavorite(storyId);
      Alert.toast('Removed from favorites');
      
      // Remove from UI
      btn.closest('.story-item').remove();
      
      // Check if empty
      this.favorites = this.favorites.filter(f => f.id !== storyId);
      if (this.favorites.length === 0) {
        await this.loadFavorites();
      }
      
    } catch (error) {
      Alert.error('Error removing favorite');
    }
  }
}