const API_BASE = 'https://story-api.dicoding.dev/v1';

export class ApiService {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    if (options.body && typeof options.body === 'string') {
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      console.log('🚀 API Request:', {
        url: `${API_BASE}${endpoint}`,
        method: config.method || 'GET',
        hasToken: !!token,
        hasBody: !!options.body
      });

      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      console.log('📡 API Response Status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('📄 Raw Response:', responseText.substring(0, 200) + '...');
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Parsed Response Data:', responseData);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        const errorMessage = responseData.message || 
                           responseData.error || 
                           `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API Error Response:', {
          status: response.status,
          message: errorMessage,
          fullResponse: responseData
        });
        throw new Error(errorMessage);
      }
      
      return responseData;
      
    } catch (error) {
      console.error('💥 API Request Failed:', {
        endpoint,
        error: error.message,
        stack: error.stack
      });
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your internet connection');
      }
      
      throw error;
    }
  }

  static async register(name, email, password) {
    console.log('🔐 Attempting user registration...');
    
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      throw new Error('Name is required and must be at least 1 character');
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password
    };

    try {
      const response = await this.request('/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      console.log('✅ Registration successful:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      
      if (error.message.includes('400')) {
        throw new Error('Invalid registration data. Please check your input.');
      } else if (error.message.includes('409')) {
        throw new Error('Email already registered. Please use a different email.');
      } else if (error.message.includes('422')) {
        throw new Error('Invalid email format or password too weak.');
      }
      
      throw error;
    }
  }

  static async login(email, password) {
    console.log('🔐 Attempting user login...');
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!password || typeof password !== 'string' || password.length < 1) {
      throw new Error('Password is required');
    }

    const payload = {
      email: email.trim().toLowerCase(),
      password: password
    };

    try {
      const response = await this.request('/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!response.loginResult) {
        console.error('❌ Invalid login response structure:', response);
        throw new Error('Invalid login response format');
      }
      
      if (!response.loginResult.token) {
        console.error('❌ Login response missing token:', response.loginResult);
        throw new Error('Login response missing authentication token');
      }
      
      const { token, userId, name } = response.loginResult;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        name: name || email.split('@')[0]
      }));
      
      console.log('✅ Login successful, token saved:', {
        userId,
        name,
        tokenLength: token.length
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      if (error.message.includes('400')) {
        throw new Error('Invalid email or password.');
      } else if (error.message.includes('401')) {
        throw new Error('Invalid email or password.');
      } else if (error.message.includes('404')) {
        throw new Error('User not found. Please check your email.');
      }
      
      throw error;
    }
  }

  static logout() {
    console.log('🔐 Logging out user...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ User logged out, tokens cleared');
  }

  static isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  static getCurrentUser() {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  static async getStories(page = 1, size = 20, location = 1) {
    console.log('📚 Fetching stories...');
    
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        location: location.toString()
      });
      
      const response = await this.request(`/stories?${queryParams}`);
      
      console.log('✅ Stories fetched successfully:', {
        totalStories: response.listStory?.length || 0,
        page,
        size
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch stories:', error.message);
      
      if (error.message.includes('401')) {
        throw new Error('Authentication required. Please login again.');
      }
      
      throw error;
    }
  }

  static async getStoryDetail(id) {
    console.log('📖 Fetching story detail for ID:', id);
    
    if (!id || typeof id !== 'string') {
      throw new Error('Valid story ID is required');
    }
    
    try {
      const response = await this.request(`/stories/${id}`);
      
      console.log('✅ Story detail fetched successfully:', {
        storyId: id,
        storyName: response.story?.name
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch story detail:', error.message);
      
      if (error.message.includes('401')) {
        throw new Error('Authentication required. Please login again.');
      } else if (error.message.includes('404')) {
        throw new Error('Story not found.');
      }
      
      throw error;
    }
  }

  static async addStory(formData) {
    console.log('📝 Adding new story...');
    
    if (!(formData instanceof FormData)) {
      throw new Error('Story data must be FormData instance');
    }
    
    const description = formData.get('description');
    const photo = formData.get('photo');
    
    if (!description || typeof description !== 'string' || description.trim().length < 1) {
      throw new Error('Story description is required');
    }
    
    if (!photo || !(photo instanceof File)) {
      throw new Error('Story photo is required');
    }
    
    if (photo.size > 1024 * 1024) {
      throw new Error('Photo file size must be less than 1MB');
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(photo.type)) {
      throw new Error('Photo must be JPEG or PNG format');
    }
    
    try {
      const response = await this.request('/stories', {
        method: 'POST',
        body: formData
      });
      
      console.log('✅ Story added successfully:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ Failed to add story:', error.message);
      
      if (error.message.includes('401')) {
        throw new Error('Authentication required. Please login again.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid story data. Please check your input.');
      } else if (error.message.includes('413')) {
        throw new Error('Photo file too large. Maximum size is 1MB.');
      }
      
      throw error;
    }
  }

  static async testConnection() {
    try {
      console.log('🔗 Testing API connection...');
      await fetch(`${API_BASE}/stories`);
      console.log('✅ API connection successful');
      return true;
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      return false;
    }
  }

  static getApiBase() {
    return API_BASE;
  }
}

export default ApiService;