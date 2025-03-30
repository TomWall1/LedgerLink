import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentRoute, navigateTo } from '../utils/customRouter';

const NavHeader = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Update current path when location changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('locationchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('locationchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  // Only show main navigation links on pages other than the home page
  const isHomePage = currentPath === '/';
  const isAuthPage = currentPath.startsWith('/auth/');

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Custom link component
  const CustomLink = ({ to, children, className }) => {
    const handleClick = (e) => {
      e.preventDefault();
      navigateTo(to === '/' ? 'dashboard' : to.substring(1));
    };
    
    return (
      <a href={to} onClick={handleClick} className={className}>
        {children}
      </a>
    );
  };

  return (
    <header className="bg-white py-4 shadow-sm border-b border-gray-100 fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <CustomLink to="/" className="flex items-center space-x-2">
            <div className="relative">
              {/* Interlocking chains logo */}
              <div className="relative inline-flex">
                <div className="w-6 h-6 rounded-full bg-indigo-600 opacity-90"></div>
                <div className="w-6 h-6 rounded-full bg-blue-600 opacity-90 -ml-3"></div>
              </div>
            </div>
            <span className="font-bold text-xl text-gray-900">LedgerLink</span>
          </CustomLink>
          
          {/* Main navigation - only show if user is authenticated and not on auth pages */}
          {isAuthenticated && !isAuthPage && !isHomePage && (
            <nav className="hidden md:block">
              <ul className="flex flex-wrap space-x-6">
                <li>
                  <CustomLink 
                    to="/dashboard" 
                    className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/' ? 'text-indigo-600 font-medium' : ''}`}
                  >
                    Dashboard
                  </CustomLink>
                </li>
                <li>
                  <CustomLink 
                    to="/erp-connections" 
                    className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/erp-connections' || currentPath.startsWith('/erp-data') ? 'text-indigo-600 font-medium' : ''}`}
                  >
                    ERP Connections
                  </CustomLink>
                </li>
                <li>
                  <CustomLink 
                    to="/customer-transaction-matching" 
                    className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/customer-transaction-matching' ? 'text-indigo-600 font-medium' : ''}`}
                  >
                    Invoice Matching
                  </CustomLink>
                </li>
                <li>
                  <CustomLink 
                    to="/company-links" 
                    className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/company-links' ? 'text-indigo-600 font-medium' : ''}`}
                  >
                    Company Links
                  </CustomLink>
                </li>
              </ul>
            </nav>
          )}

          {/* User menu or auth buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline">{currentUser?.name || 'User'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{currentUser?.name}</div>
                      <div className="text-gray-500 truncate">{currentUser?.email}</div>
                    </div>
                    <CustomLink 
                      to="/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </CustomLink>
                    <CustomLink 
                      to="/erp-connections" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ERP Connections
                    </CustomLink>
                    <CustomLink 
                      to="/customer-transaction-matching" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Invoice Matching
                    </CustomLink>
                    <CustomLink 
                      to="/company-links" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Company Links
                    </CustomLink>
                    <div className="border-t border-gray-100 mt-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !isAuthPage && (
                <div className="space-x-2">
                  <CustomLink 
                    to="/login" 
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Log in
                  </CustomLink>
                  <CustomLink 
                    to="/register" 
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </CustomLink>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu for small screens */}
      {isAuthenticated && !isAuthPage && !isHomePage && (
        <div className="md:hidden border-t border-gray-100 mt-4 pt-2">
          <nav className="px-4">
            <ul className="flex flex-wrap space-x-4">
              <li>
                <CustomLink 
                  to="/dashboard" 
                  className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/' ? 'text-indigo-600 font-medium' : ''}`}
                >
                  Dashboard
                </CustomLink>
              </li>
              <li>
                <CustomLink 
                  to="/erp-connections" 
                  className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/erp-connections' || currentPath.startsWith('/erp-data') ? 'text-indigo-600 font-medium' : ''}`}
                >
                  ERP
                </CustomLink>
              </li>
              <li>
                <CustomLink 
                  to="/customer-transaction-matching" 
                  className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/customer-transaction-matching' ? 'text-indigo-600 font-medium' : ''}`}
                >
                  Invoices
                </CustomLink>
              </li>
              <li>
                <CustomLink 
                  to="/company-links" 
                  className={`hover:text-indigo-600 transition-colors text-gray-700 ${currentPath === '/company-links' ? 'text-indigo-600 font-medium' : ''}`}
                >
                  Links
                </CustomLink>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavHeader;