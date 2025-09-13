import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

export interface TopNavProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuToggle?: () => void;
  isMobile?: boolean;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onInvite?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({
  user,
  onMenuToggle,
  isMobile = false,
  isLoggedIn = false,
  onLogin,
  onLogout,
  onInvite,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement global search functionality
    console.log('Search:', searchQuery);
  };
  
  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-sticky-header bg-white border-b border-neutral-200',
      'h-14 md:h-16'
    )}>
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              type="button"
              className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-120"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">LL</span>
            </div>
            <span className="hidden sm:block text-h3 font-semibold text-neutral-900">
              LedgerLink
            </span>
          </div>
          
          {/* Global search - only show when logged in */}
          {isLoggedIn && (
            <form onSubmit={handleSearch} className="hidden md:block">
              <Input
                type="search"
                placeholder="Search invoices, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 lg:w-80"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </form>
          )}
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {isLoggedIn ? (
            <>
              {/* Invite button */}
              <Button
                variant="primary"
                size="sm"
                onClick={onInvite}
                className="hidden sm:flex"
              >
                Invite counterparty
              </Button>
              
              {/* Notifications */}
              <button
                type="button"
                className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-120 relative"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a1.94 1.94 0 014.06 0l6.06 6.06c.98.98.98 2.56 0 3.54l-6.06 6.06a1.94 1.94 0 01-4.06 0L4.91 14.57c-.98-.98-.98-2.56 0-3.54l6.06-6.06z" />
                </svg>
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              {/* Help */}
              <button
                type="button"
                className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-120"
                aria-label="Help"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 p-1 rounded-md hover:bg-neutral-100 transition-colors duration-120"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* User dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-10">
                    <div className="px-4 py-2 border-b border-neutral-200">
                      <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                      <p className="text-xs text-neutral-600">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors duration-120"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        // Navigate to settings
                      }}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors duration-120"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not logged in */
            <Button variant="primary" size="sm" onClick={onLogin}>
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export { TopNav };