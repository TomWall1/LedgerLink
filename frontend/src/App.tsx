import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Connections } from './pages/Connections';
import { Matches } from './pages/Matches';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ToastContainer } from './hooks/useToast';
import './index.css';

type Page = 'dashboard' | 'connections' | 'matches' | 'reports' | 'settings';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = () => {
    // Simulate login
    setIsLoggedIn(true);
    setUser({
      name: 'John Smith',
      email: 'john.smith@company.com',
      avatar: undefined,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(undefined);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    const pageProps = {
      isLoggedIn,
      onLogin: handleLogin,
      user,
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />;
      case 'connections':
        return <Connections {...pageProps} />;
      case 'matches':
        return <Matches {...pageProps} />;
      case 'reports':
        return <Reports {...pageProps} />;
      case 'settings':
        return <Settings {...pageProps} />;
      default:
        return <Dashboard {...pageProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isLoggedIn={isLoggedIn}
        />
        
        <main className="flex-1 lg:ml-64">
          {renderPage()}
        </main>
      </div>
      
      <ToastContainer />
    </div>
  );
}

export default App;