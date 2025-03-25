import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavHeader = () => {
  const location = useLocation();
  
  // Only show navigation links on pages other than the home page
  const isHomePage = location.pathname === '/';

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
          
          {/* Only show navigation on non-home pages */}
          {!isHomePage && (
            <nav>
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
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
