import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Only show main navigation links on pages other than the home page
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname.startsWith('/auth/');

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className={`bg-white py-4 shadow-sm border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              {/* Interlocking chains logo */}
              <div className="relative inline-flex">
                <div className="w-6 h-6 rounded-full bg-indigo-600 opacity-90"></div>
                <div className="w-6 h-6 rounded-full bg-blue-600 opacity-90 -ml-3"></div>
              </div>
            </div>
            <span className="font-bold text-xl text-gray-900">LedgerLink</span>
          </Link>
          
          {/* Main navigation - only show if user is authenticated and not on auth pages */}
          {isAuthenticated && !isAuthPage && !isHomePage && (
            <nav className="hidden md:block">
              <ul className="flex flex-wrap space-x-6">
                <li>
                  <Link to="/upload" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/upload' ? 'text-indigo-600 font-medium' : ''}`}>
                    Upload
                  </Link>
                </li>
                <li>
                  <Link to="/results" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/results' ? 'text-indigo-600 font-medium' : ''}`}>
                    Results
                  </Link>
                </li>
                <li>
                  <Link to="/account-links" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/account-links' ? 'text-indigo-600 font-medium' : ''}`}>
                    Account Links
                  </Link>
                </li>
                <li>
                  <Link to="/system" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/system' ? 'text-indigo-600 font-medium' : ''}`}>
                    System Status
                  </Link>
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
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Your Profile
                    </Link>
                    <Link 
                      to="/company-settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Company Settings
                    </Link>
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
                  <Link 
                    to="/auth/login" 
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/auth/register" 
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
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
                <Link to="/upload" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/upload' ? 'text-indigo-600 font-medium' : ''}`}>
                  Upload
                </Link>
              </li>
              <li>
                <Link to="/results" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/results' ? 'text-indigo-600 font-medium' : ''}`}>
                  Results
                </Link>
              </li>
              <li>
                <Link to="/account-links" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/account-links' ? 'text-indigo-600 font-medium' : ''}`}>
                  Links
                </Link>
              </li>
              <li>
                <Link to="/system" className={`hover:text-indigo-600 transition-colors text-gray-700 ${location.pathname === '/system' ? 'text-indigo-600 font-medium' : ''}`}>
                  System
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavHeader;