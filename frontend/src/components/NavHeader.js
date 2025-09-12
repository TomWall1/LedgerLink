import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function NavHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="nav-header">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          LedgerLink
        </Link>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Dashboard
          </Link>
          <Link to="/invoice-matching" className="nav-link">
            Invoice Matching
          </Link>
          <Link to="/erp-connections" className="nav-link">
            ERP Connections
          </Link>
        </div>
        
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavHeader;