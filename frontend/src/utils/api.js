import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000 // 30 second timeout
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
    // Check if we have an error response
    if (error.response) {
      // Handle unauthorized errors
      if (error.response.status === 401) {
        // If not on login page, redirect to login
        if (!window.location.pathname.includes('/login')) {
          // Clear tokens and user data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          
          // Redirect to login (using simple window.location instead of navigation)
          window.location.href = '/login';
        }
      }
      
      // Handle server errors
      if (error.response.status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add convenience methods for working with Xero API
api.xero = {
  getAuthStatus: () => api.get('/direct-auth-status'),
  getConnectionDetails: () => api.get('/direct-connection-details'),
  getCustomers: () => api.get('/api/xero/customers'),
  getInvoices: () => api.get('/api/xero/invoices'),
  getCustomerInvoices: (customerId, includeHistory = false) => api.get(
    `/api/xero/customers/${customerId}/invoices${includeHistory ? '?includeHistory=true' : ''}`
  ),
  disconnect: () => api.post('/auth/xero/disconnect')
};

export default api;