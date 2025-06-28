// src/scripts/router.js 
export class Router {
  constructor() {
    this.routes = {
      '/': () => import('./views/home.js').then(m => m.HomeView || m.default),
      '/home': () => import('./views/home.js').then(m => m.HomeView || m.default),
      '/login': () => import('./views/login.js').then(m => m.LoginView || m.default),
      '/register': () => import('./views/login.js').then(m => m.LoginView || m.default),
      '/add': () => import('./views/add-story.js').then(m => m.AddStoryView || m.default),
      '/favorites': () => import('./views/favorites.js').then(m => m.FavoritesView || m.default),
      '/detail': () => import('./views/detail.js').then(m => m.DetailView || m.default),
      '/settings': () => import('./views/settings.js').then(m => m.SettingsView || m.default),
      '/logout': this.handleLogout.bind(this)
    };
    
    this.currentView = null;
    this.currentPresenter = null; // ✨ ENHANCED: Track current presenter
    this.isNavigating = false;
    this.cleanupTimeout = null; // ✨ ENHANCED: Cleanup timeout
  }

  init() {
    console.log('🚦 Router initialized with enhanced lifecycle management');
    
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('popstate', () => this.handleRoute());
    
    // ✨ ENHANCED: Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  async handleRoute() {
    if (this.isNavigating) {
      console.log('🚦 Already navigating, ignoring route change');
      return;
    }
    
    try {
      this.isNavigating = true;
      
      const hash = window.location.hash.slice(1) || '/';
      console.log('🚦 Routing to:', hash);
      
      // ✨ ENHANCED: Proper cleanup of previous view and presenter
      await this.cleanupPrevious();
      
      if (hash === '/logout') {
        this.handleLogout();
        return;
      }
      
      const { route, params } = this.parseRoute(hash);
      console.log('🔍 Parsed route:', { route, params, hash });
      
      const routeLoader = this.routes[route];
      
      if (routeLoader) {
        await this.loadViewWithTransition(routeLoader, hash, params);
      } else {
        console.warn('🚦 Route not found:', hash);
        this.show404(hash);
      }
      
    } catch (error) {
      console.error('🚦 Router error:', error);
      this.showError('Navigation error: ' + error.message);
    } finally {
      this.isNavigating = false;
    }
  }

  // ✨ ENHANCED: Proper cleanup of previous view and presenter
  async cleanupPrevious() {
    console.log('🧹 Cleaning up previous view and presenter...');
    
    // Clear any pending cleanup timeout
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
    
    // Cleanup presenter first (if exists)
    if (this.currentPresenter) {
      try {
        if (typeof this.currentPresenter.destroy === 'function') {
          console.log('🗑️ Destroying current presenter...');
          this.currentPresenter.destroy();
        }
      } catch (error) {
        console.error('❌ Error destroying presenter:', error);
      }
      this.currentPresenter = null;
    }
    
    // Then cleanup view
    if (this.currentView) {
      try {
        if (typeof this.currentView.cleanup === 'function') {
          console.log('🧹 Cleaning up current view...');
          await this.currentView.cleanup();
        }
      } catch (error) {
        console.error('❌ Error cleaning up view:', error);
      }
      this.currentView = null;
    }
    
    console.log('✅ Previous view and presenter cleaned up');
  }

  parseRoute(hash) {
    const parts = hash.split('/').filter(part => part.length > 0);
    
    console.log('🔍 Parsing hash:', hash, 'Parts:', parts);
    
    if (parts.length === 0) {
      return { route: '/', params: {} };
    }
    
    const firstPart = '/' + parts[0];
    
    if (firstPart === '/detail' && parts[1]) {
      return {
        route: '/detail',
        params: { id: parts[1] }
      };
    }
    
    if (this.routes[firstPart]) {
      return {
        route: firstPart,
        params: {}
      };
    }
    
    return {
      route: null,
      params: {}
    };
  }

  async loadViewWithTransition(routeLoader, fullRoute, params = {}) {
    const contentEl = document.getElementById('content');
    
    if (!contentEl) {
      console.error('🚦 Content element not found');
      return;
    }

    try {
      if (!document.startViewTransition) {
        await this.renderView(routeLoader, fullRoute, params);
        return;
      }

      await document.startViewTransition(async () => {
        await this.renderView(routeLoader, fullRoute, params);
      });

    } catch (error) {
      console.error('❌ Error loading view with transition:', error);
      this.showError('Failed to load page: ' + error.message);
    }
  }

  async renderView(routeLoader, fullRoute, params = {}) {
    const contentEl = document.getElementById('content');
    
    this.showLoadingWithTransition();
    
    try {
      console.log('🚦 Loading view for route:', fullRoute);
      const ViewClass = await routeLoader();
      
      if (!ViewClass || typeof ViewClass !== 'function') {
        throw new Error('Invalid view class loaded for route: ' + fullRoute);
      }
      
      const view = new ViewClass();
      
      if (view.requiresAuth && !this.isAuthenticated()) {
        console.log('🚦 Authentication required, redirecting to login');
        this.navigate('/login');
        return;
      }
      
      console.log('🚦 Rendering view...', ViewClass.name);
      const html = await view.render(fullRoute, params);
      
      if (typeof html !== 'string') {
        throw new Error('View render method must return HTML string');
      }
      
      contentEl.innerHTML = html;
      contentEl.style.viewTransitionName = `page-${this.getRouteTransitionName(fullRoute)}`;
      
      // ✨ ENHANCED: Set current view before afterRender
      this.currentView = view;
      
      if (view.afterRender && typeof view.afterRender === 'function') {
        await view.afterRender(params);
      }
      
      // ✨ ENHANCED: Track presenter if view has one
      if (view.presenter) {
        this.currentPresenter = view.presenter;
        console.log('📋 Presenter tracked:', view.presenter.constructor.name);
      }
      
      this.updatePageTitle(fullRoute);
      this.updateActiveNavLink(fullRoute);
      window.scrollTo(0, 0);
      
      console.log('✅ View loaded successfully');
      
    } catch (error) {
      console.error('❌ Error rendering view:', error);
      this.showError('Failed to render page: ' + error.message);
    }
  }

  show404(route) {
    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.style.viewTransitionName = 'page-404';
      contentEl.innerHTML = `
        <div class="error-page" style="view-transition-name: error-content;">
          <div class="error-content">
            <div class="error-icon">
              <i class="fas fa-map-signs"></i>
            </div>
            <h2>Page Not Found</h2>
            <p class="error-message">The page "${route}" doesn't exist.</p>
            <div class="error-actions">
              <a href="#/" class="btn btn-primary">
                <i class="fas fa-home"></i> Go Home
              </a>
              <a href="#/add" class="btn btn-secondary">
                <i class="fas fa-plus"></i> Add Story
              </a>
            </div>
          </div>
        </div>
      `;
    }
  }

  updateActiveNavLink(route) {
    try {
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      const currentLink = document.querySelector(`[href="#${route}"], [href="#${route.split('/')[0]}"]`);
      if (currentLink) {
        currentLink.classList.add('active');
      }
    } catch (error) {
      console.error('Error updating nav links:', error);
    }
  }

  showLoadingWithTransition() {
    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.style.viewTransitionName = 'page-loading';
      contentEl.innerHTML = `
        <div class="loading-container" style="view-transition-name: loading-content;">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
          </div>
        </div>
      `;
    }
  }

  getRouteTransitionName(route) {
    const routeMap = {
      '/': 'home',
      '/home': 'home',
      '/login': 'auth',
      '/register': 'auth',
      '/add': 'add-story',
      '/favorites': 'favorites',
      '/detail': 'detail',
      '/settings': 'settings'
    };
    
    const baseRoute = route.split('/').slice(0, 2).join('/') || '/';
    return routeMap[baseRoute] || 'default';
  }

  showError(message) {
    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.style.viewTransitionName = 'page-error';
      contentEl.innerHTML = `
        <div class="error-page" style="view-transition-name: error-content;">
          <div class="error-content">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2>Oops! Something went wrong</h2>
            <p class="error-message">${message}</p>
            <div class="error-actions">
              <button onclick="window.location.reload()" class="btn btn-primary">
                <i class="fas fa-redo"></i> Reload Page
              </button>
              <a href="#/" class="btn btn-secondary">
                <i class="fas fa-home"></i> Go Home
              </a>
            </div>
          </div>
        </div>
      `;
    }
  }

  updatePageTitle(route) {
    const titles = {
      '/': 'Home - StoryMaps',
      '/home': 'Home - StoryMaps',
      '/login': 'Login - StoryMaps',
      '/register': 'Register - StoryMaps',
      '/add': 'Add Story - StoryMaps',
      '/favorites': 'Favorites - StoryMaps',
      '/detail': 'Story Detail - StoryMaps',
      '/settings': 'Settings - StoryMaps'
    };
    
    const baseRoute = route.split('/').slice(0, 2).join('/') || '/';
    document.title = titles[baseRoute] || 'StoryMaps';
  }

  handleLogout() {
    try {
      console.log('🚦 Handling logout...');
      
      // Cleanup current view/presenter before logout
      this.cleanupPrevious();
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // ✅ FIXED: Dispatch auth change event
      document.dispatchEvent(new CustomEvent('authChange', {
        detail: { isLoggedIn: false, user: null }
      }));
      
      // Show logout message
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been successfully logged out.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'bottom-end'
        });
      }
      
      // ✅ FIXED: Redirect setelah logout
      setTimeout(() => {
        this.navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error('🚦 Logout error:', error);
      this.navigate('/');
    }
  }

  navigate(route) {
    if (route !== window.location.hash.slice(1)) {
      window.location.hash = route;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  getCurrentRoute() {
    return window.location.hash.slice(1) || '/';
  }

  // ✨ ENHANCED: Manual cleanup method
  cleanup() {
    console.log('🧹 Router cleanup...');
    this.cleanupPrevious();
  }
}

export default Router;