import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export interface TopNavProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuToggle: () => void;
  isMobile: boolean;
  isLoggedIn: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onInvite?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({
  user,
  onMenuToggle,
  isMobile,
  isLoggedIn,
  onLogin,
  onLogout,
  onInvite
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 h-14 md:h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="sr-only">Toggle menu</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LL</span>
            </div>
            <span className="font-semibold text-lg text-neutral-900">LedgerLink</span>
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {onInvite && (
                <Button variant="secondary" size="sm" onClick={onInvite}>
                  Invite
                </Button>
              )}
              
              <div className="flex items-center space-x-3">
                {user && (
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                    <p className="text-xs text-neutral-600">{user.email}</p>
                  </div>
                )}
                
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={onLogout}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onLogin}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export { TopNav };