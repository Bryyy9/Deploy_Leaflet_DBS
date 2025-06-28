// src/scripts/presenters/auth-presenter.js - Enhanced Lifecycle Management
import { BasePresenter } from './base-presenter.js';
import { ApiService } from '../data/api.js';

export class AuthPresenter extends BasePresenter {
  constructor(view, isRegisterMode = false) {
    super(view);
    this.isRegisterMode = isRegisterMode;
    this.isSubmitting = false;
    this.formValidation = {
      name: false,
      email: false,
      password: false,
      confirmPassword: false
    };
    this.validationTimeouts = new Map(); // Track validation timeouts
  }

  async init() {
    if (this.isDestroyed) return;
    
    console.log(`🚀 ${this.constructor.name}.init() - Register mode: ${this.isRegisterMode}`);
    
    if (this.isAuthenticated()) {
      this.redirectToHome();
      return;
    }

    this.safeViewCall('initializeForm', this.isRegisterMode);
    
    // ✨ ENHANCED: Safe initialization with delay
    this.safeSetTimeout(() => {
      if (!this.isDestroyed) {
        this.updateFormValidation();
      }
    }, 100);
  }

  validateField(fieldName, value) {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring validateField on destroyed presenter: ${fieldName}`);
      return false;
    }
    
    console.log(`🔍 Validating field: ${fieldName} = "${value}"`);
    
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length < 1) {
          isValid = false;
          errorMessage = 'Name is required';
        } else if (value.trim().length > 100) {
          isValid = false;
          errorMessage = 'Name must be less than 100 characters';
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          isValid = false;
          errorMessage = 'Email is required';
        } else if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (!value) {
          isValid = false;
          errorMessage = 'Password is required';
        } else if (this.isRegisterMode && value.length < 8) {
          isValid = false;
          errorMessage = 'Password must be at least 8 characters';
        }
        break;

      case 'confirmPassword':
        const password = this.safeViewCall('getFieldValue', 'password');
        if (!value) {
          isValid = false;
          errorMessage = 'Please confirm your password';
        } else if (password && value !== password) {
          isValid = false;
          errorMessage = 'Passwords do not match';
        }
        break;
    }

    // ✨ ENHANCED: Update validation state safely
    if (!this.isDestroyed) {
      this.formValidation[fieldName] = isValid;
      this.safeViewCall('updateFieldValidation', fieldName, isValid, errorMessage);
      
      // ✨ ENHANCED: Debounced form validation update
      this.debouncedUpdateFormValidation();
    }
    
    return isValid;
  }

  // ✨ ENHANCED: Debounced form validation to prevent rapid calls
  debouncedUpdateFormValidation() {
    if (this.isDestroyed) return;
    
    // Clear previous timeout
    if (this.validationTimeouts.has('formValidation')) {
      clearTimeout(this.validationTimeouts.get('formValidation'));
    }
    
    const timeoutId = setTimeout(() => {
      if (!this.isDestroyed) {
        this.updateFormValidation();
      }
      this.validationTimeouts.delete('formValidation');
    }, 100);
    
    this.validationTimeouts.set('formValidation', timeoutId);
  }

  updateFormValidation() {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring updateFormValidation on destroyed presenter`);
      return;
    }
    
    const requiredFields = this.isRegisterMode 
      ? ['name', 'email', 'password', 'confirmPassword']
      : ['email', 'password'];
    
    // Check if all required fields are valid
    const isFormValid = requiredFields.every(field => {
      // If field hasn't been validated yet, check if it has content
      if (this.formValidation[field] === undefined) {
        const value = this.safeViewCall('getFieldValue', field) || '';
        return value.length > 0;
      }
      return this.formValidation[field];
    });

    console.log('🔍 Form validation state:', {
      isRegisterMode: this.isRegisterMode,
      requiredFields,
      formValidation: this.formValidation,
      isFormValid,
      isSubmitting: this.isSubmitting,
      isDestroyed: this.isDestroyed
    });

    this.safeViewCall('updateSubmitButton', isFormValid && !this.isSubmitting);
  }

  validateForm(formData) {
    if (this.isDestroyed) return false;
    
    const fields = ['email', 'password'];
    if (this.isRegisterMode) {
      fields.unshift('name');
      fields.push('confirmPassword');
    }

    let isFormValid = true;
    fields.forEach(fieldName => {
      const value = formData[fieldName] || '';
      const isFieldValid = this.validateField(fieldName, value);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    this.updateFormValidation();
    return isFormValid;
  }

  async handleSubmit(formData) {
    if (this.isDestroyed) {
      console.warn(`⚠️ Ignoring handleSubmit on destroyed presenter`);
      return;
    }
    
    if (this.isSubmitting) {
      console.log('⚠️ Already submitting, ignoring...');
      return;
    }

    console.log('📝 Form submit attempt:', formData);

    // ✨ ENHANCED: Use safeAsyncOperation for async handling
    await this.safeAsyncOperation(async () => {
      if (!this.validateForm(formData)) {
        this.safeViewCall('showMessage', 'Please fix the errors above', 'error');
        return;
      }

      this.isSubmitting = true;
      this.safeViewCall('setSubmitLoading', true);
      this.safeViewCall('clearMessages');

      if (this.isRegisterMode) {
        await this.handleRegister(formData);
      } else {
        await this.handleLogin(formData);
      }
    }, 'Form Submit').catch(error => {
      this.handleAuthError(error);
    }).finally(() => {
      if (!this.isDestroyed) {
        this.isSubmitting = false;
        this.safeViewCall('setSubmitLoading', false);
        this.updateFormValidation();
      }
    });
  }

  async handleRegister(formData) {
    if (this.isDestroyed) return;
    
    const { name, email, password } = formData;

    console.log('🔐 Attempting registration...');
    const response = await ApiService.register(name, email, password);

    if (this.isDestroyed) return; // Check again after async operation

    console.log('✅ Registration successful');
    
    this.safeViewCall('showSuccessMessage', 
      'Account created successfully! Please sign in with your new account.',
      'Welcome to StoryMaps!'
    );

    this.safeSetTimeout(() => {
      if (!this.isDestroyed) {
        window.location.hash = '#/login';
        this.safeSetTimeout(() => {
          if (!this.isDestroyed) {
            this.safeViewCall('prefillEmail', email);
          }
        }, 100);
      }
    }, 2000);
  }

  // src/scripts/presenters/auth-presenter.js - UPDATE handleLogin
  async handleLogin(formData) {
    if (this.isDestroyed) return;
    
    const { email, password } = formData;

    console.log('🔐 Attempting login...');
    const response = await ApiService.login(email, password);

    if (this.isDestroyed) return;

    if (!response.loginResult || !response.loginResult.token) {
      throw new Error('Invalid login response format');
    }

    const { token, userId, name } = response.loginResult;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: userId,
      name: name || email.split('@')[0]
    }));

    // ✅ FIXED: Dispatch auth change event
    this.dispatchAuthChange(true, { 
      id: userId, 
      name: name || email.split('@')[0] 
    });

    console.log('✅ Login successful');

    this.safeViewCall('showSuccessMessage', 
      `Welcome back, ${name || 'User'}!`,
      'Login Successful'
    );

    this.safeSetTimeout(() => {
      if (!this.isDestroyed) {
        this.redirectToHome();
      }
    }, 1500);
  }

dispatchAuthChange(isLoggedIn, user) {
  if (this.isDestroyed) return;
  
  try {
    console.log('📡 Dispatching auth change:', { isLoggedIn, user });
    document.dispatchEvent(new CustomEvent('authChange', {
      detail: { isLoggedIn, user }
    }));
  } catch (error) {
    console.error('Error dispatching auth change:', error);
  }
}

  handleAuthError(error) {
    if (this.isDestroyed) return;
    
    let errorMessage = error.message;

    if (errorMessage.includes('400')) {
      errorMessage = this.isRegisterMode ? 
        'Registration failed. Please check your input and try again.' :
        'Invalid email or password.';
    } else if (errorMessage.includes('401')) {
      errorMessage = 'Invalid email or password.';
    } else if (errorMessage.includes('409')) {
      errorMessage = 'Email already registered. Please use a different email or try logging in.';
    } else if (errorMessage.includes('422')) {
      errorMessage = 'Invalid data format. Please check your input.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }

    this.safeViewCall('showMessage', errorMessage, 'error');
  }

  fillDemoCredentials() {
    if (this.isDestroyed) return;
    
    this.safeViewCall('fillDemoCredentials', 'test@example.com', 'testpassword123');
    this.safeViewCall('showMessage', 'Demo credentials filled!', 'info');
    
    // ✨ ENHANCED: Safe validation update
    this.safeSetTimeout(() => {
      if (!this.isDestroyed) {
        this.validateField('email', 'test@example.com');
        this.validateField('password', 'testpassword123');
      }
    }, 100);
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  redirectToHome() {
    if (!this.isDestroyed) {
      window.location.hash = '#/';
    }
  }

  dispatchAuthChange(isLoggedIn, user) {
    if (this.isDestroyed) return;
    
    try {
      document.dispatchEvent(new CustomEvent('authChange', {
        detail: { isLoggedIn, user }
      }));
    } catch (error) {
      console.error('Error dispatching auth change:', error);
    }
  }

  // ✨ ENHANCED: Override destroy to clear validation timeouts
  destroy() {
    console.log(`🗑️ Destroying ${this.constructor.name}...`);
    
    // Clear validation timeouts
    this.validationTimeouts.forEach((timeoutId, key) => {
      clearTimeout(timeoutId);
      console.log(`⏰ Cleared validation timeout: ${key}`);
    });
    this.validationTimeouts.clear();
    
    // Call parent destroy
    super.destroy();
  }
}