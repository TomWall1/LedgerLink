import React from 'react';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  isMobile?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    requiresAuth: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v10H8V5z" />
      </svg>
    ),
  },
  {
    id: 'connections',
    label: 'Connections',
    requiresAuth: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'counterparties',
    label: 'Counterparties',
    requiresAuth: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'matches',
    label: 'Matches',
    requiresAuth: false, // Available in "try for free" mode
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    requiresAuth: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    requiresAuth: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
  isLoggedIn,
  isMobile = false,
}) => {
  const handleNavClick = (item: NavItem) => {
    if (item.requiresAuth && !isLoggedIn) {
      // Show login prompt or redirect to login
      return;
    }
    
    onTabChange(item.id);
  };
  
  const isItemDisabled = (item: NavItem) => {
    return item.requiresAuth && !isLoggedIn;
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => onToggleCollapse?.()}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed top-14 md:top-16 left-0 bottom-0 z-sidebar bg-white border-r border-neutral-200 transition-all duration-240 ease-smooth',
          isMobile ? (
            isOpen ? 'translate-x-0' : '-translate-x-full'
          ) : (
            isCollapsed ? 'w-18' : 'w-70'
          ),
          !isMobile && 'w-70' // Desktop width when not collapsed
        )}
      >
        <div className="flex flex-col h-full">
          {/* Collapse toggle - desktop only */}
          {!isMobile && (
            <div className="p-4 border-b border-neutral-200">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-120"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg 
                  className={cn('w-5 h-5 transition-transform duration-240', isCollapsed && 'rotate-180')} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const disabled = isItemDisabled(item);
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-120',
                    'focus:outline-none focus:ring-2 focus:ring-primary-300',
                    isActive ? (
                      'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                    ) : disabled ? (
                      'text-neutral-400 cursor-not-allowed'
                    ) : (
                      'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                    ),
                    isCollapsed && !isMobile && 'justify-center px-2'
                  )}
                  title={isCollapsed && !isMobile ? item.label : undefined}
                >
                  <span className={cn(disabled && 'opacity-50')}>
                    {item.icon}
                  </span>
                  {(!isCollapsed || isMobile) && (
                    <span className={cn(disabled && 'opacity-50')}>
                      {item.label}
                    </span>
                  )}
                  {disabled && (!isCollapsed || isMobile) && (
                    <svg className="w-4 h-4 ml-auto text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Upgrade prompt for free users */}
          {!isLoggedIn && (!isCollapsed || isMobile) && (
            <div className="p-4 border-t border-neutral-200">
              <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
                <p className="text-xs text-primary-700 font-medium mb-2">
                  Unlock all features
                </p>
                <p className="text-xs text-primary-600 mb-3">
                  Create an account to connect your ERP systems and access advanced matching.
                </p>
                <button
                  type="button"
                  className="w-full btn btn-primary text-xs py-1.5"
                  onClick={() => onTabChange('login')}
                >
                  Sign up now
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export { Sidebar };