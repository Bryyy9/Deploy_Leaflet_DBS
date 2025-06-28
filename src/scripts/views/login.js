// src/scripts/views/login.js
import { AuthPresenter } from '../presenters/auth-presenter.js';

export class LoginView {
  constructor() {
    this.presenter = null;
    this.isRegisterMode = false;
  }

  async render(route) {
    this.isRegisterMode = route === '/register';
    
    return `
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="auth-title">
            <i class="fas ${this.isRegisterMode ? 'fa-user-plus' : 'fa-sign-in-alt'}"></i>
            ${this.isRegisterMode ? 'Join StoryMaps' : 'Welcome Back'}
          </h1>
          <p class="auth-subtitle">
            ${this.isRegisterMode ? 
              'Create your account and start sharing amazing stories' : 
              'Sign in to continue sharing and exploring stories'
            }
          </p>
        </div>
        
        <div id="messageContainer" class="message-container hidden"></div>
        
        <form id="authForm" class="auth-form" novalidate>
          ${this.isRegisterMode ? `
            <div class="form-group">
              <label for="name" class="form-label">
                <i class="fas fa-user"></i> Full Name *
              </label>
              <input type="text" id="name" name="name" class="form-control" 
                     placeholder="Enter your full name" required autocomplete="name">
              <div class="field-feedback">
                <small class="help-text">Your display name (minimum 1 character)</small>
                <small class="error-text hidden" id="nameError"></small>
              </div>
            </div>
          ` : ''}
          
          <div class="form-group">
            <label for="email" class="form-label">
              <i class="fas fa-envelope"></i> Email Address *
            </label>
            <input type="email" id="email" name="email" class="form-control" 
                   placeholder="Enter your email address" required autocomplete="email">
            <div class="field-feedback">
              <small class="help-text">We'll use this to identify your account</small>
              <small class="error-text hidden" id="emailError"></small>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">
              <i class="fas fa-lock"></i> Password *
            </label>
            <div class="password-input-group">
              <input type="password" id="password" name="password" class="form-control" 
                     placeholder="Enter your password" required 
                     ${this.isRegisterMode ? 'minlength="8"' : ''}
                     autocomplete="${this.isRegisterMode ? 'new-password' : 'current-password'}">
              <button type="button" class="password-toggle" id="passwordToggle">
                <i class="fas fa-eye" id="passwordToggleIcon"></i>
              </button>
            </div>
            <div class="field-feedback">
              <small class="help-text">
                ${this.isRegisterMode ? 
                  'Minimum 8 characters for security' : 
                  'Enter your account password'
                }
              </small>
              <small class="error-text hidden" id="passwordError"></small>
            </div>
          </div>
          
          ${this.isRegisterMode ? `
            <div class="form-group">
              <label for="confirmPassword" class="form-label">
                <i class="fas fa-lock"></i> Confirm Password *
              </label>
              <input type="password" id="confirmPassword" name="confirmPassword" 
                     class="form-control" placeholder="Confirm your password" 
                     required minlength="8" autocomplete="new-password">
              <div class="field-feedback">
                <small class="help-text">Re-enter your password to confirm</small>
                <small class="error-text hidden" id="confirmPasswordError"></small>
              </div>
            </div>
          ` : ''}
          
          <div class="form-group">
            <!-- ✨ PERBAIKAN: Hapus disabled, tambahkan data attribute -->
            <button type="submit" class="btn btn-primary btn-block" id="submitBtn" data-can-submit="false">
              <span class="btn-content">
                <i class="fas ${this.isRegisterMode ? 'fa-user-plus' : 'fa-sign-in-alt'}"></i>
                <span class="btn-text">${this.isRegisterMode ? 'Create Account' : 'Sign In'}</span>
              </span>
              <span class="btn-loading hidden">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${this.isRegisterMode ? 'Creating Account...' : 'Signing In...'}</span>
              </span>
            </button>
          </div>
        </form>
        
        <div class="auth-switch">
          <p>
            ${this.isRegisterMode ? 
              'Already have an account?' : 
              "Don't have an account?"
            }
            <a href="#/${this.isRegisterMode ? 'login' : 'register'}" class="auth-switch-link">
              ${this.isRegisterMode ? 'Sign in here' : 'Create one here'}
            </a>
          </p>
        </div>

        ${!this.isRegisterMode ? `
          <div class="demo-accounts">
            <h6 class="demo-title">
              <i class="fas fa-info-circle"></i>
              Demo Account
            </h6>
            <div class="demo-account-card">
              <div class="demo-account-info">
                <strong>Test Account:</strong><br>
                <code>test@example.com</code><br>
                <code>testpassword123</code>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="useDemoBtn">
                Use Demo
              </button>
            </div>
            <small class="demo-note">
              Click "Use Demo" to automatically fill the form with test credentials
            </small>
          </div>
        ` : ''}

        ${this.isRegisterMode ? `
          <div class="features-info">
            <h6 class="features-title">
              <i class="fas fa-star"></i>
              What you'll get:
            </h6>
            <ul class="features-list">
              <li><i class="fas fa-map-marked-alt"></i> Share stories with location</li>
              <li><i class="fas fa-camera"></i> Upload photos or take with camera</li>
              <li><i class="fas fa-heart"></i> Save favorite stories</li>
              <li><i class="fas fa-mobile-alt"></i> Works offline with PWA</li>
            </ul>
          </div>
        ` : ''}

        <div class="auth-footer">
          <a href="#/" class="footer-link">
            <i class="fas fa-home"></i> Back to Home
          </a>
        </div>
      </div>
    `;
  }
  
  async afterRender() {
    try {
      this.presenter = new AuthPresenter(this, this.isRegisterMode);
      
      // ✨ ENHANCED: Track presenter in view for router cleanup
      if (this.presenter) {
        // Make presenter accessible to router
        Object.defineProperty(this, 'presenter', {
          value: this.presenter,
          writable: false,
          enumerable: true
        });
      }
      
      this.initEventListeners();
      await this.presenter.init();
      
      console.log('✅ LoginView initialized successfully');
      
    } catch (error) {
      console.error('Error in login afterRender:', error);
      this.showMessage('Failed to initialize form: ' + error.message, 'error');
    }
  }

  // ✨ ENHANCED: Proper cleanup method
  cleanup() {
    console.log('🧹 Cleaning up LoginView');
    
    // Destroy presenter first
    if (this.presenter && typeof this.presenter.destroy === 'function') {
      try {
        this.presenter.destroy();
      } catch (error) {
        console.error('Error destroying presenter:', error);
      }
      this.presenter = null;
    }
    
    // Clear any remaining event listeners
    const form = document.getElementById('authForm');
    if (form) {
      form.removeEventListener('submit', this.formSubmitHandler);
    }
    
    console.log('✅ LoginView cleaned up');
  }

  initEventListeners() {
    const form = document.getElementById('authForm');
    const useDemoBtn = document.getElementById('useDemoBtn');
    const passwordToggle = document.getElementById('passwordToggle');
    const submitBtn = document.getElementById('submitBtn');
    
    // ✨ PERBAIKAN: Form submit handler
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('📝 Form submitted');
        
        const formData = this.getFormData();
        console.log('📋 Form data:', formData);
        
        if (this.presenter) {
          this.presenter.handleSubmit(formData);
        } else {
          console.error('❌ Presenter not available');
        }
      });
    }
    
    // ✨ PERBAIKAN: Button click handler sebagai backup
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        console.log('🔘 Submit button clicked directly');
        
        // Jika form submit tidak trigger, handle manual
        if (e.target.type === 'submit') {
          return; // Biarkan form submit handle
        }
        
        e.preventDefault();
        const formData = this.getFormData();
        
        if (this.presenter) {
          this.presenter.handleSubmit(formData);
        }
      });
    }
    
    if (useDemoBtn) {
      useDemoBtn.addEventListener('click', () => {
        console.log('🎯 Demo button clicked');
        if (this.presenter) {
          this.presenter.fillDemoCredentials();
        }
      });
    }

    if (passwordToggle) {
      passwordToggle.addEventListener('click', () => {
        this.togglePasswordVisibility();
      });
    }
    
    // ✨ PERBAIKAN: Real-time validation
    const fields = ['name', 'email', 'password', 'confirmPassword'];
    fields.forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (field) {
        // Input event untuk real-time validation
        field.addEventListener('input', (e) => {
          console.log(`📝 Field ${fieldName} changed:`, e.target.value);
          if (this.presenter) {
            this.presenter.validateField(fieldName, e.target.value);
          }
        });

        // Blur event untuk validation saat focus hilang
        field.addEventListener('blur', (e) => {
          if (this.presenter) {
            this.presenter.validateField(fieldName, e.target.value);
          }
        });

        // ✨ PERBAIKAN: Keyup untuk responsive validation
        field.addEventListener('keyup', (e) => {
          if (this.presenter) {
            this.presenter.validateField(fieldName, e.target.value);
          }
        });
      }
    });

    console.log('🎮 Event listeners initialized');
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput && toggleIcon) {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
      passwordInput.focus();
    }
  }

  getFormData() {
    const data = {
      name: document.getElementById('name')?.value?.trim() || '',
      email: document.getElementById('email')?.value?.trim() || '',
      password: document.getElementById('password')?.value || '',
      confirmPassword: document.getElementById('confirmPassword')?.value || ''
    };
    
    console.log('📋 Getting form data:', data);
    return data;
  }

  getFieldValue(fieldName) {
    const value = document.getElementById(fieldName)?.value || '';
    console.log(`🔍 Getting field ${fieldName}:`, value);
    return value;
  }

  updateFieldValidation(fieldName, isValid, errorMessage) {
    const field = document.getElementById(fieldName);
    const errorEl = document.getElementById(`${fieldName}Error`);
    
    console.log(`🔍 Updating field validation ${fieldName}:`, { isValid, errorMessage });
    
    if (field) {
      if (isValid) {
        field.classList.remove('error');
      } else {
        field.classList.add('error');
      }
    }
    
    if (errorEl) {
      if (isValid) {
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
      } else {
        errorEl.classList.remove('hidden');
        errorEl.textContent = errorMessage;
      }
    }
  }

  // ✨ PERBAIKAN: Update submit button dengan logging
  updateSubmitButton(enabled) {
    const submitBtn = document.getElementById('submitBtn');
    
    console.log('🔘 Updating submit button:', { enabled, buttonExists: !!submitBtn });
    
    if (submitBtn) {
      // Update disabled state
      submitBtn.disabled = !enabled;
      
      // Update data attribute
      submitBtn.setAttribute('data-can-submit', enabled.toString());
      
      // Update visual state
      if (enabled) {
        submitBtn.classList.remove('btn-disabled');
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      } else {
        submitBtn.classList.add('btn-disabled');
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
      }
      
      console.log('✅ Submit button updated:', {
        disabled: submitBtn.disabled,
        canSubmit: submitBtn.getAttribute('data-can-submit'),
        opacity: submitBtn.style.opacity
      });
    } else {
      console.error('❌ Submit button not found!');
    }
  }

  setSubmitLoading(loading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnContent = submitBtn?.querySelector('.btn-content');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    console.log('⏳ Setting submit loading:', loading);
    
    if (loading) {
      btnContent?.classList.add('hidden');
      btnLoading?.classList.remove('hidden');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'wait';
      }
    } else {
      btnContent?.classList.remove('hidden');
      btnLoading?.classList.add('hidden');
      if (submitBtn) {
        submitBtn.style.cursor = 'pointer';
      }
    }
  }

  showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
      const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };
      
      messageContainer.innerHTML = `
        <div class="message message-${type}">
          <i class="fas ${iconMap[type] || iconMap.info}"></i>
          <span>${message}</span>
        </div>
      `;
      messageContainer.classList.remove('hidden');
      
      if (type !== 'error') {
        setTimeout(() => {
          this.clearMessages();
        }, 5000);
      }
    }
  }

  clearMessages() {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
      messageContainer.classList.add('hidden');
      messageContainer.innerHTML = '';
    }
  }

  showSuccessMessage(message, title) {
    if (window.Swal) {
      window.Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonColor: '#00d4ff'
      });
    } else {
      alert(`${title}\n${message}`);
    }
  }

  fillDemoCredentials(email, password) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    console.log('🎯 Filling demo credentials:', { email, password });
    
    if (emailInput) {
      emailInput.value = email;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (passwordInput) {
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  prefillEmail(email) {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.value = email;
      emailInput.focus();
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  initializeForm(isRegisterMode) {
    console.log('🎯 Initializing form:', { isRegisterMode });
    
    // Focus first input
    const firstInput = document.querySelector('input');
    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
      }, 100);
    }
    
    // ✨ PERBAIKAN: Force enable button initially untuk testing
    setTimeout(() => {
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        console.log('🔧 Initial button state setup');
        this.updateSubmitButton(false); // Start disabled, akan di-enable oleh validation
      }
    }, 200);
  }

  cleanup() {
    console.log('🧹 Cleaning up LoginView');
    
    if (this.presenter) {
      this.presenter.destroy();
      this.presenter = null;
    }
  }
}

export default LoginView;