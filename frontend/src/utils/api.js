import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthorized errors
    if (error.response && error.response.status === 401) {
      // If not on login page, redirect to login
      if (!window.location.pathname.includes('/login')) {
        // Clear tokens and user data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Redirect to login (using simple window.location instead of navigation)
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;