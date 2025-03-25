import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the Authentication Context
const AuthContext = createContext();

// Create a hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';

  // On mount, check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
      
      // Configure axios to use the token for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setToken(token);
        setCurrentUser(user);
        
        // Set Authorization header for subsequent requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true };
      } else {
        setError('Login failed. Please check your credentials.');
        return { success: false, error: 'Login failed' };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      
      // First create the company
      const companyResponse = await axios.post(`${apiUrl}/api/companies`, {
        name: userData.companyName,
        taxId: userData.taxId
      });

      if (companyResponse.data.success) {
        const companyId = companyResponse.data.data._id;

        // Then register the user with the company
        const userResponse = await axios.post(`${apiUrl}/api/auth/register`, {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          company: companyId
        });

        if (userResponse.data.success) {
          const { token, user } = userResponse.data;
          
          // Save to localStorage
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(user));
          
          // Update state
          setToken(token);
          setCurrentUser(user);
          
          // Set Authorization header for subsequent requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } else {
          setError('Registration failed. Please try again.');
          return { success: false, error: 'Registration failed' };
        }
      } else {
        setError('Failed to create company. Please try again.');
        return { success: false, error: 'Failed to create company' };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Clear state
    setToken(null);
    setCurrentUser(null);
    
    // Clear Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!currentUser;
  };

  // Get the current user's company ID
  const getCompanyId = () => {
    return currentUser ? currentUser.company : null;
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      setError(null);
      const response = await axios.put(`${apiUrl}/api/users/profile`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update local storage with new user data
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        return { success: true };
      } else {
        setError('Failed to update profile. Please try again.');
        return { success: false, error: 'Failed to update profile' };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Create value object to share with components
  const value = {
    currentUser,
    token,
    error,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    getCompanyId,
    updateProfile,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;