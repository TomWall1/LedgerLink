import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ledgerlink.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // FIXED: Use 'authToken' to match AuthContext.jsx
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FIXED: Remove automatic redirect to /login
    // Let React components handle authentication flow naturally
    if (error.response?.status === 401) {
      // Only clean up invalid tokens, don't force redirect
      console.debug('API: Received 401 - authentication required');
    }
    return Promise.reject(error);
  }
);

export default api;