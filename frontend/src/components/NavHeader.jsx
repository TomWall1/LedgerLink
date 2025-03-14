import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavHeader = () => {
  const location = useLocation();

  return (
    <header className="bg-primary text-white py-4 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" className="text-white">
                <path fill="currentColor" d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">LedgerLink</span>
          </Link>
          <nav>
            <ul className="flex flex-wrap space-x-4">
              <li>
                <Link to="/" className={`hover:text-secondary transition-colors ${location.pathname === '/' ? 'text-secondary font-medium' : ''}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/upload" className={`hover:text-secondary transition-colors ${location.pathname === '/upload' ? 'text-secondary font-medium' : ''}`}>
                  Upload
                </Link>
              </li>
              <li>
                <Link to="/results" className={`hover:text-secondary transition-colors ${location.pathname === '/results' ? 'text-secondary font-medium' : ''}`}>
                  Results
                </Link>
              </li>
              <li>
                <Link to="/account-links" className={`hover:text-secondary transition-colors ${location.pathname === '/account-links' ? 'text-secondary font-medium' : ''}`}>
                  Account Links
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
