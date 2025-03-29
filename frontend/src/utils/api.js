import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000 // 30 second timeout
});

// Network error detection helper
const isNetworkError = (error) => {
  return (
    !error.response && 
    error.code !== 'ECONNABORTED' && 
    (!error.request || (error.request.status === 0 && error.request.readyState === 4))
  );
};

// Timeout error detection helper
const isTimeoutError = (error) => {
  return error.code === 'ECONNABORTED' || 
    (error.message && error.message.includes('timeout'));
};

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
        error.isServerError = true;
        error.friendlyMessage = 'The server encountered an error. Our team has been notified. Please try again later.';
      }
    } else if (isNetworkError(error)) {
      // Network connectivity issues
      console.error('Network error detected:', error);
      error.isNetworkError = true;
      error.friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (isTimeoutError(error)) {
      // Request timeout
      console.error('Request timeout:', error);
      error.isTimeoutError = true;
      error.friendlyMessage = 'The request took too long to complete. The server might be experiencing high load. Please try again later.';
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error - no response received:', error.request);
      error.isRequestError = true;
      error.friendlyMessage = 'No response received from the server. Please check your connection and try again.';
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
      error.isRequestSetupError = true;
      error.friendlyMessage = 'There was a problem preparing your request. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// Retry helper for failed requests
api.retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      // Only retry network errors, timeouts, or 5xx server errors
      if (!(error.isNetworkError || error.isTimeoutError || error.isServerError) || retries === maxRetries - 1) {
        throw error; // Don't retry other errors or if we've hit max retries
      }
      
      // Wait with exponential backoff before retrying
      const waitTime = delay * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      retries++;
      
      console.log(`Retrying request, attempt ${retries} of ${maxRetries}...`);
    }
  }
};

// Health check function to verify backend connectivity
api.checkHealth = async () => {
  try {
    // Try multiple potential endpoints that should exist on the server
    const endpoints = [
      '/api/health-check',
      '/health',
      '/api/status',
      '/'
    ];
    
    // Try each endpoint until one succeeds
    for (const endpoint of endpoints) {
      try {
        await api.get(endpoint, { timeout: 5000 }); // Shorter timeout for health checks
        return true; // If any request succeeds, return true
      } catch (err) {
        console.log(`Health check failed for ${endpoint}:`, err.message);
        // Continue to the next endpoint
      }
    }
    
    // If all endpoints fail, return false
    return false;
  } catch (error) {
    console.error('Health check failed completely:', error);
    return false;
  }
};

// Function to get a user-friendly error message
api.getErrorMessage = (error) => {
  if (error.friendlyMessage) {
    return error.friendlyMessage;
  }
  
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  
  if (error.message && error.message.includes('Network Error')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
};

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