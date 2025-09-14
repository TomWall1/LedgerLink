import React from 'react';
import { Button } from '../ui/Button';
import LedgerLinkLogo from '../ui/LedgerLinkLogo';

interface User {
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
    <nav className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-neutral-200 z-40">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="p-2 -ml-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          {/* Logo - visible on mobile when sidebar is closed */}
          {isMobile && (
            <LedgerLinkLogo size={32} withText={true} color="#6366f1" />
          )}
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <>
              {/* Invite button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onInvite}
                className="hidden sm:inline-flex"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Invite
              </Button>
              
              {/* User menu */}
              <div className="flex items-center space-x-3">
                {user && (
                  <>
                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-medium text-neutral-900">{user.name}</div>
                      <div className="text-xs text-neutral-500">{user.email}</div>
                    </div>
                    
                    <div className="relative">
                      <button className="flex items-center space-x-2 p-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        {user.avatar ? (
                          <img className="w-8 h-8 rounded-full" src={user.avatar} alt="" />
                        ) : (
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </button>
                      
                      {/* Dropdown menu would go here */}
                    </div>
                  </>
                )}
                
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onLogin}>
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};