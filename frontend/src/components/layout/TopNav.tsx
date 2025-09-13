import React from 'react';
import { Button } from '../ui/Button';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TopNavProps {
  user?: User;
  onMenuToggle: () => void;
  isMobile: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onInvite: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  user,
  onMenuToggle,
  isMobile,
  isLoggedIn,
  onLogin,
  onLogout,
  onInvite
}) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between px-4 h-14 md:h-16">
        {/* Left side - Logo and menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-120 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LL</span>
            </div>
            <span className="text-h3 font-bold text-neutral-900 hidden sm:block">LedgerLink</span>
          </div>
        </div>
        
        {/* Right side - Actions and user menu */}
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <>
              {/* Invite button - desktop only */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onInvite}
                className="hidden md:inline-flex"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Invite
              </Button>
              
              {/* Notifications */}
              <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors duration-120 relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a.235.235 0 00-.02.022L9.477 6.417 8.05 7.847a.698.698 0 01-.988-.01L6.05 6.825a.71.71 0 01-.207-.5c0-.19.074-.372.207-.506l.707-.707M10.97 4.97s.018-.013.028-.02c.298-.164.636-.22.968-.14.332.081.63.284.821.567.191.282.267.62.213.953a1.125 1.125 0 01-.44.832c-.109.073-.234.13-.363.167-.742.21-1.527.32-2.334.32-2.08 0-3.903-.903-5.187-2.34L2.34 2.34A8 8 0 1021.66 21.66 8 8 0 0010.97 4.97z" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </button>
              
              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 text-sm bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors duration-120">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {!isMobile && (
                    <>
                      <span className="text-neutral-900 font-medium hidden md:block">
                        {user?.name?.split(' ')[0] || 'User'}
                      </span>
                      <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                
                {/* Dropdown menu - would need proper dropdown implementation */}
                <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
                  <a href="#" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">Profile</a>
                  <a href="#" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">Settings</a>
                  <div className="border-t border-neutral-100 my-1"></div>
                  <button 
                    onClick={onLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onLogin}>
                Login
              </Button>
              <Button variant="primary" size="sm">
                Try for free
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};