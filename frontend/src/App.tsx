import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/ui/Toast';

// Page components
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Connections } from './pages/Connections';
import { Counterparties } from './pages/Counterparties';
import { Matches } from './pages/Matches';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const isLandingPage = location.pathname === '/';
  
  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle authentication (placeholder - integrate with your auth system)
  const handleLogin = () => {
    // For demo purposes, set a mock user
    setUser({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    });
    navigate('/dashboard');
    addToast({
      id: Date.now().toString(),
      title: 'Welcome back!',
      description: 'You have been successfully logged in.',
      variant: 'success',
    });
  };
  
  const handleLogout = () => {
    setUser(null);
    navigate('/');
    addToast({
      id: Date.now().toString(),
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      variant: 'default',
    });
  };
  
  const handleTryForFree = () => {
    navigate('/matches');
  };
  
  const handleInvite = () => {
    addToast({
      id: Date.now().toString(),
      title: 'Invite feature',
      description: 'Counterparty invitation feature will be implemented here.',
      variant: 'default',
    });
  };
  
  // Toast management
  const addToast = (toast: Omit<Toast, 'id'> & { id?: string }) => {
    const newToast = {
      ...toast,
      id: toast.id || Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Get current tab based on route
  const getCurrentTab = () => {
    const path = location.pathname.slice(1);
    return path || 'dashboard';
  };
  
  const handleTabChange = (tab: string) => {
    if (tab === 'login') {
      navigate('/login');
      return;
    }
    
    // Check if user needs to be logged in for this tab
    const authRequiredTabs = ['dashboard', 'connections', 'counterparties', 'reports', 'settings'];
    if (authRequiredTabs.includes(tab) && !isLoggedIn) {
      navigate('/login');
      addToast({
        id: Date.now().toString(),
        title: 'Login required',
        description: 'Please log in to access this feature.',
        variant: 'warning',
      });
      return;
    }
    
    navigate(`/${tab}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {!isLandingPage && (
        <>
          <TopNav 
            user={user || undefined}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
            isLoggedIn={isLoggedIn}
            onLogin={() => navigate('/login')}
            onLogout={handleLogout}
            onInvite={handleInvite}
          />
          
          <Sidebar 
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab={getCurrentTab()}
            onTabChange={handleTabChange}
            isLoggedIn={isLoggedIn}
            isMobile={isMobile}
          />
        </>
      )}
      
      <main className={!isLandingPage ? (
        `transition-all duration-240 ease-smooth pt-14 md:pt-16 ${
          isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-18' : 'ml-70'
        }`
      ) : ''}>
        <Routes>
          <Route 
            path="/" 
            element={
              <LandingPage 
                onLogin={() => navigate('/login')}
                onTryForFree={handleTryForFree}
              />
            } 
          />
          <Route 
            path="/login" 
            element={
              <Login 
                onLogin={handleLogin}
                onTryForFree={handleTryForFree}
              />
            } 
          />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/counterparties" element={<Counterparties />} />
          <Route path="/matches" element={<Matches isLoggedIn={isLoggedIn} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;