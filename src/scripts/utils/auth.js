// Authentication Utility - Fixed
export class Auth {
  constructor() {
    this.currentUser = null;
  }

  init() {
    this.loadUser();
  }

  loadUser() {
    try {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      
      if (token && userJson) {
        const userData = JSON.parse(userJson);
        
        // Validate user data structure
        if (userData && typeof userData === 'object' && userData.id) {
          this.currentUser = userData;
        } else {
          console.warn('Invalid user data found, clearing...');
          this.clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.clearAuthData();
    }
  }

  isLoggedIn() {
    const token = localStorage.getItem('token');
    return !!token && !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setUser(userData) {
    if (!userData || !userData.id) {
      console.error('Invalid user data provided to setUser');
      return;
    }
    
    this.currentUser = {
      id: userData.id,
      name: userData.name || 'User'
    };
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    
    // Dispatch auth change event
    this.dispatchAuthChange();
  }

  logout() {
    this.clearAuthData();
    this.dispatchAuthChange();
  }

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser = null;
  }

  dispatchAuthChange() {
    try {
      document.dispatchEvent(new CustomEvent('authChange', {
        detail: {
          isLoggedIn: this.isLoggedIn(),
          user: this.currentUser
        }
      }));
    } catch (error) {
      console.error('Error dispatching auth change event:', error);
    }
  }
}