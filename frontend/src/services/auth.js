import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service functions
export const authService = {
  // FIXED: Changed from /api/auth/login to /api/users/login
  login: async (email, password) => {
    const response = await api.post('/api/users/login', { email, password });
    return response.data;
  },

  // FIXED: Changed from /api/auth/register to /api/users/register  
  register: async (email, password, companyName) => {
    const response = await api.post('/api/users/register', { email, password, companyName });
    return response.data;
  },

  // FIXED: Changed from /api/auth/profile to /api/users/profile
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }
};

export default authService;