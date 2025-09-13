import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Connections } from './pages/Connections';
import { Matches } from './pages/Matches';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ToastProvider } from './contexts/ToastContext';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { useToast } from './hooks/useToast';
import './styles/globals.css';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const LoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (isSignUp && (!name || !company))) {
      error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const user: User = {
        id: '1',
        name: name || 'John Smith',
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'John Smith')}&background=3b82f6&color=fff`,
      };
      
      onLogin(user);
      success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
      onClose();
      setIsLoading(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      setCompany('');
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSignUp ? 'Create Account' : 'Sign In'}
      description={isSignUp ? 'Get started with LedgerLink today' : 'Welcome back to LedgerLink'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
            <Input
              label="Company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter your company name"
              required
            />
          </>
        )}
        
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
        
        <div className="flex flex-col space-y-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
          
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Create one"
            }
          </button>
        </div>
        
        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ledgerlink-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('ledgerlink-user');
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ledgerlink-user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ledgerlink-user');
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const isLoggedIn = !!user;

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50">
          {/* Navigation */}
          <Navbar 
            user={user}
            onLogin={openLoginModal}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <div className="flex">
            {/* Sidebar */}
            <Sidebar 
              collapsed={sidebarCollapsed}
              isLoggedIn={isLoggedIn}
              onLogin={openLoginModal}
            />
            
            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <Dashboard 
                      isLoggedIn={isLoggedIn}
                      onLogin={openLoginModal}
                      user={user}
                    />
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={<Navigate to="/" replace />} 
                />
                <Route 
                  path="/connections" 
                  element={
                    <Connections 
                      isLoggedIn={isLoggedIn}
                      onLogin={openLoginModal}
                    />
                  } 
                />
                <Route 
                  path="/matches" 
                  element={
                    <Matches 
                      isLoggedIn={isLoggedIn}
                      onLogin={openLoginModal}
                    />
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <Reports 
                      isLoggedIn={isLoggedIn}
                      onLogin={openLoginModal}
                    />
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <Settings 
                      isLoggedIn={isLoggedIn}
                      onLogin={openLoginModal}
                      user={user}
                    />
                  } 
                />
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          
          {/* Login Modal */}
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLogin={handleLogin}
          />
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;