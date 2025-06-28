import { openDB } from 'idb';

class Storage {
  constructor() {
    this.dbName = 'StoryMapsDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('stories')) {
            db.createObjectStore('stories', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('favorites')) {
            db.createObjectStore('favorites', { keyPath: 'id' });
          }
        }
      });
      console.log('✅ IndexedDB initialized');
    } catch (error) {
      console.error('❌ IndexedDB initialization failed:', error);
      throw error;
    }
  }

  async saveStories(stories) {
    if (!this.db) await this.init();
    
    try {
      const tx = this.db.transaction('stories', 'readwrite');
      await tx.store.clear();
      for (const story of stories) {
        await tx.store.put(story);
      }
      await tx.done;
      console.log(`✅ Saved ${stories.length} stories to storage`);
    } catch (error) {
      console.error('❌ Failed to save stories:', error);
      throw error;
    }
  }

  async getStories() {
    if (!this.db) await this.init();
    
    try {
      const stories = await this.db.getAll('stories');
      console.log(`✅ Retrieved ${stories.length} stories from storage`);
      return stories;
    } catch (error) {
      console.error('❌ Failed to get stories:', error);
      return [];
    }
  }

  async addFavorite(story) {
    if (!this.db) await this.init();
    
    try {
      await this.db.put('favorites', story);
      console.log(`✅ Added story ${story.id} to favorites`);
    } catch (error) {
      console.error('❌ Failed to add favorite:', error);
      throw error;
    }
  }

  async removeFavorite(id) {
    if (!this.db) await this.init();
    
    try {
      await this.db.delete('favorites', id);
      console.log(`✅ Removed story ${id} from favorites`);
    } catch (error) {
      console.error('❌ Failed to remove favorite:', error);
      throw error;
    }
  }

  async getFavorites() {
    if (!this.db) await this.init();
    
    try {
      const favorites = await this.db.getAll('favorites');
      console.log(`✅ Retrieved ${favorites.length} favorites from storage`);
      return favorites;
    } catch (error) {
      console.error('❌ Failed to get favorites:', error);
      return [];
    }
  }

  async isFavorite(id) {
    if (!this.db) await this.init();
    
    try {
      const story = await this.db.get('favorites', id);
      return !!story;
    } catch (error) {
      console.error('❌ Failed to check favorite:', error);
      return false;
    }
  }
}

export const storage = new Storage();
export default storage;