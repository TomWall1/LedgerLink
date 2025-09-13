import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await register(formData.email, formData.password, formData.companyName);
      
      if (!result.success) {
        setErrors({
          submit: result.error || 'Registration failed. Please try again.'
        });
      }
      // Success is handled by AuthContext (redirect, etc.)
    } catch (error) {
      setErrors({
        submit: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="card">
          <div className="card-header text-center">
            {/* Logo */}
            <div className="mb-6">
              <div className="w-12 h-12 mx-auto bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" 
                  />
                </svg>
              </div>
              <h1 className="h2 text-neutral-900">Create your account</h1>
              <p className="text-base text-neutral-400 mt-2">
                Start reconciling your ledgers in minutes
              </p>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name Field */}
              <div>
                <label htmlFor="companyName" className="label">
                  Company name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  autoComplete="organization"
                  required
                  className={`input ${errors.companyName ? 'error' : ''}`}
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.companyName && (
                  <p className="error-message" role="alert">
                    {errors.companyName}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="label">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your work email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="error-message" role="alert">
                    {errors.email}
                  </p>
                )}
                <p className="text-small text-neutral-400 mt-1">
                  We'll use this to send you account updates and reconciliation reports
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`input ${errors.password ? 'error' : ''}`}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="error-message" role="alert">
                    {errors.password}
                  </p>
                )}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-small">
                    <div className={`w-2 h-2 rounded-full ${
                      formData.password.length >= 8 ? 'bg-success' : 'bg-neutral-200'
                    }`}></div>
                    <span className={formData.password.length >= 8 ? 'text-success' : 'text-neutral-400'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-small">
                    <div className={`w-2 h-2 rounded-full ${
                      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) ? 'bg-success' : 'bg-neutral-200'
                    }`}></div>
                    <span className={/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) ? 'text-success' : 'text-neutral-400'}>
                      Uppercase, lowercase, and number
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="error-message" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-small text-error" role="alert">
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Terms Agreement */}
              <div className="bg-muted rounded-md p-4">
                <p className="text-small text-neutral-600">
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="text-primary-500 hover:text-primary-700 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-500 hover:text-primary-700 font-medium">
                    Privacy Policy
                  </a>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          <div className="card-footer">
            <p className="text-center text-small text-neutral-400">
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary-500 hover:text-primary-700 font-medium transition-colors"
                onClick={onSwitchToLogin}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Value proposition */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-small font-medium text-neutral-900">Fast Setup</p>
                <p className="text-small text-neutral-400">Ready in minutes</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-small font-medium text-neutral-900">Auto Match</p>
                <p className="text-small text-neutral-400">AI-powered matching</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-small font-medium text-neutral-900">Secure</p>
                <p className="text-small text-neutral-400">Bank-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;