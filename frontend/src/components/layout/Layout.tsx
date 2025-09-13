import React, { useState, useEffect } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onInvite?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  isLoggedIn,
  user,
  onLogin,
  onLogout,
  onInvite,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toasts, removeToast } = useToast();
  
  // Handle responsive behavior
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  const handleMenuToggle = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };
  
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    
    // Close mobile sidebar when navigating
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  
  const sidebarWidth = isMobile ? 0 : (isSidebarCollapsed ? 72 : 280);
  
  return (
    <div className="min-h-screen bg-muted-bg">
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
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleMenuToggle}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isLoggedIn={isLoggedIn}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <main 
        className={cn(
          'transition-all duration-240 ease-smooth',
          'pt-14 md:pt-16', // Account for fixed top nav
          !isMobile && `ml-${isSidebarCollapsed ? '18' : '70'}` // Account for sidebar width
        )}
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
        }}
      >
        <div className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export { Layout };