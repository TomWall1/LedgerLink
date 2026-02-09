import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('API Client initialized with base URL:', api.defaults.baseURL);

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
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
    if (error.response?.status === 401) {
      console.debug('API: Received 401 - authentication required');
    }
    return Promise.reject(error);
  }
);

export default api;
