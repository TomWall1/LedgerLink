import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavHeader = () => {
  const location = useLocation();

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-xl font-bold mb-4 md:mb-0">
          <Link to="/" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v-1H5v1h10zm0 3v-1H5v1h10z" clipRule="evenodd" />
            </svg>
            LedgerLink
          </Link>
        </div>
        <nav>
          <ul className="flex flex-wrap space-x-1 md:space-x-6">
            <li>
              <Link to="/" className={`px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/upload" className={`px-3 py-2 rounded-md ${location.pathname === '/upload' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                Upload
              </Link>
            </li>
            <li>
              <Link to="/results" className={`px-3 py-2 rounded-md ${location.pathname === '/results' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                Results
              </Link>
            </li>
            <li>
              <Link to="/account-links" className={`px-3 py-2 rounded-md ${location.pathname === '/account-links' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                Account Links
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default NavHeader;
