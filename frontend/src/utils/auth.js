import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';

// FIXED: All endpoints changed from /api/auth/ to /api/users/
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const registerUser = async (email, password, companyName) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/register`, {
      email,
      password,
      companyName
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
};

// Token utilities
export const getToken = () => localStorage.getItem('authToken');
export const setToken = (token) => localStorage.setItem('authToken', token);
export const removeToken = () => localStorage.removeItem('authToken');

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};