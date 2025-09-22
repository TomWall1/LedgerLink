/**
 * API Client Configuration
 * Base configuration for all API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Get the API URL based on environment
const getApiUrl = (): string => {
  // If explicitly set in environment variables, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Production environment detection
  if (process.env.NODE_ENV === 'production') {
    // Use your production backend URL
    return 'https://ledgerlink.onrender.com/api';
  }
  
  // Development fallback
  return 'http://localhost:3002/api';
};

// Create base API client
const createApiClient = (): AxiosInstance => {
  const baseURL = getApiUrl();
  
  console.log('API Client initialized with base URL:', baseURL);
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config: any) => {
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

  // Response interceptor for global error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      // Handle common errors
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('authToken');
        // Only redirect to login if we're not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// Error response type
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  data?: any;
}

export default apiClient;