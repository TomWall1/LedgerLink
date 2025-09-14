import React, { useState, useEffect } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  isLoggedIn?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  onInvite?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  user,
  isLoggedIn = false,
  activeTab,
  onTabChange,
  onLogin,
  onLogout,
  onInvite
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toasts, removeToast } = useToast();
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (!mobile) {
        setSidebarOpen(false); // Close mobile sidebar on desktop
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeTab, isMobile]);
  
  const handleMenuToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation */}
      <TopNav
        user={user}
        onMenuToggle={handleMenuToggle}
        isMobile={isMobile}
        isLoggedIn={isLoggedIn}
        onLogin={onLogin}
        onLogout={onLogout}
        onInvite={onInvite}
      />
      
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleMenuToggle}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isLoggedIn={isLoggedIn}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <main 
        className={cn(
          'transition-all duration-240 ease-smooth',
          'pt-14 md:pt-16', // Account for fixed top nav
          isMobile ? 'ml-0' : (
            sidebarCollapsed ? 'ml-18' : 'ml-70'
          )
        )}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export { AppLayout };