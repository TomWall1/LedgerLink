import React, { useState } from 'react';
import axios from 'axios';
import { navigateTo } from '../utils/customRouter';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    taxId: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { name, email, password, confirmPassword, companyName, taxId } = formData;

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // First create the company
      const companyResponse = await axios.post(`${apiUrl}/api/companies`, {
        name: companyName,
        taxId
      });

      if (companyResponse.data.success) {
        const companyId = companyResponse.data.data._id;

        // Then register the user with the company
        const userResponse = await axios.post(`${apiUrl}/api/auth/register`, {
          name,
          email,
          password,
          company: companyId
        });

        if (userResponse.data.success) {
          // Store token in localStorage
          localStorage.setItem('authToken', userResponse.data.token);
          localStorage.setItem('userData', JSON.stringify(userResponse.data.user));
          
          // Redirect to dashboard using custom routing
          navigateTo('dashboard');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError('Failed to create company. Please try again.');
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Registration failed. Please try again.'
      );
      setIsLoading(false);
    }
  };

  // Custom link for navigation
  const CustomLink = ({ to, children, className }) => {
    const handleClick = (e) => {
      e.preventDefault();
      navigateTo(to.substring(1)); // Remove the leading '/'
    };
    
    return (
      <a href={to} onClick={handleClick} className={className}>
        {children}
      </a>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join LedgerLink to connect your accounting systems</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary mb-2">Personal Information</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="John Doe"
                name="name"
                value={name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="you@example.com"
                name="email"
                value={email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="••••••••"
                name="password"
                value={password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary mb-2">Company Information</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyName">
                Company Name
              </label>
              <input
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="companyName"
                type="text"
                placeholder="Acme Inc"
                name="companyName"
                value={companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taxId">
                Tax ID / Business Number
              </label>
              <input
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="taxId"
                type="text"
                placeholder="123456789"
                name="taxId"
                value={taxId}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <CustomLink to="/login" className="text-indigo-600 hover:text-opacity-80">
                Login here
              </CustomLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;