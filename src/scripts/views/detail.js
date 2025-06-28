import { ApiService } from '../data/api.js';
import { storage } from '../data/storage.js';
import { Alert } from '../utils/alert.js';

export class DetailView {
  constructor() {
    this.requiresAuth = true;
    this.story = null;
    this.map = null;
  }

  async render(route) {
    const storyId = route.split('/')[2];
    
    if (!storyId) {
      return '<div class="error">Story ID not found</div>';
    }

    return `
      <div class="detail-view">
        <div id="loadingContainer" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading story...</p>
        </div>
        
        <div id="storyContainer" class="story-detail hidden">
          <!-- Story content will be loaded here -->
        </div>
        
        <div id="errorContainer" class="error-container hidden">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Story not found</h3>
            <p>The story you're looking for doesn't exist or has been removed.</p>
            <a href="#/" class="btn btn-primary">Back to Home</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const route = window.location.hash.slice(1);
    const storyId = route.split('/')[2];
    
    if (storyId) {
      await this.loadStory(storyId);
    }
  }

  async loadStory(storyId) {
    try {
      await storage.init();
      
      const response = await ApiService.getStoryDetail(storyId);
      this.story = response.story;
      
      await this.renderStory();
      this.showStory();
      
    } catch (error) {
      console.error('Error loading story:', error);
      this.showError();
    }
  }

  async renderStory() {
    if (!this.story) return;
    
    const isFavorite = await storage.isFavorite(this.story.id);
    
    const storyContainer = document.getElementById('storyContainer');
    storyContainer.innerHTML = `
      <div class="story-header">
        <button class="back-btn" onclick="history.back()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" id="favoriteBtn">
          <i class="fas fa-heart"></i>
        </button>
      </div>
      
      <div class="story-content">
        <img src="${this.story.photoUrl}" alt="${this.story.name}" class="story-image">
        
        <div class="story-info">
          <h1>${this.story.name}</h1>
          <p class="story-date">
            <i class="fas fa-calendar"></i>
            ${new Date(this.story.createdAt).toLocaleDateString('id-ID')}
          </p>
          <p class="story-description">${this.story.description}</p>
        </div>
        
        ${this.story.lat && this.story.lon ? `
          <div class="story-location">
            <h3><i class="fas fa-map-marker-alt"></i> Location</h3>
            <div id="storyMap" class="map-container"></div>
          </div>
        ` : ''}
      </div>
    `;

    // Initialize favorite button
    const favoriteBtn = document.getElementById('favoriteBtn');
    favoriteBtn.addEventListener('click', () => this.toggleFavorite());

    // Initialize map if location exists
    if (this.story.lat && this.story.lon && window.L) {
      this.initMap();
    }
  }

  async toggleFavorite() {
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    try {
      const isFavorite = await storage.isFavorite(this.story.id);
      
      if (isFavorite) {
        await storage.removeFavorite(this.story.id);
        favoriteBtn.classList.remove('active');
        Alert.toast('Removed from favorites', 'info');
      } else {
        await storage.addFavorite(this.story);
        favoriteBtn.classList.add('active');
        Alert.toast('Added to favorites', 'success');
      }
    } catch (error) {
      Alert.error('Failed to update favorites');
    }
  }

  initMap() {
    const mapEl = document.getElementById('storyMap');
    if (!mapEl || !window.L) return;

    this.map = L.map(mapEl).setView([this.story.lat, this.story.lon], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([this.story.lat, this.story.lon])
      .addTo(this.map)
      .bindPopup(this.story.name)
      .openPopup();
  }

  showStory() {
    document.getElementById('loadingContainer').classList.add('hidden');
    document.getElementById('storyContainer').classList.remove('hidden');
  }

  showError() {
    document.getElementById('loadingContainer').classList.add('hidden');
    document.getElementById('errorContainer').classList.remove('hidden');
  }
}

export default DetailView;