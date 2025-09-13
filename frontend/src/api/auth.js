import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';

// Create axios instance
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

// FIXED: All auth endpoints changed from /api/auth/ to /api/users/
export const auth = {
  login: (credentials) => authAPI.post('/api/users/login', credentials),
  register: (userData) => authAPI.post('/api/users/register', userData),
  getProfile: () => authAPI.get('/api/users/profile'),
  updateProfile: (data) => authAPI.put('/api/users/profile', data),
  logout: () => {
    localStorage.removeItem('authToken');
    return Promise.resolve();
  }
};

export default auth;