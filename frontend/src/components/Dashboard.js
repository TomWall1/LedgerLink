import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [xeroConnected, setXeroConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkXeroConnection();
  }, []);

  const checkXeroConnection = async () => {
    try {
      const response = await api.get('/api/xero/status');
      setXeroConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Xero connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceMatchingClick = () => {
    navigate('/invoice-matching');
  };

  const handleXeroConnectionClick = () => {
    navigate('/xero-auth');
  };

  const handleERPConnectionsClick = () => {
    navigate('/erp-connections');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1>Welcome to LedgerLink</h1>
        <p>Hello {user?.email}! Manage your account reconciliation and ERP connections.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Invoice Matching</h3>
          <p>Match customer invoices with your transaction records</p>
          <button 
            className="btn btn-primary" 
            onClick={handleInvoiceMatchingClick}
          >
            Start Invoice Matching
          </button>
        </div>

        <div className="dashboard-card">
          <h3>Xero Connection</h3>
          <p>Status: {xeroConnected ? 'Connected' : 'Not Connected'}</p>
          <button 
            className="btn btn-secondary" 
            onClick={handleXeroConnectionClick}
          >
            {xeroConnected ? 'Manage' : 'Connect'} Xero
          </button>
        </div>

        <div className="dashboard-card">
          <h3>ERP Connections</h3>
          <p>Manage all your ERP system connections</p>
          <button 
            className="btn btn-secondary" 
            onClick={handleERPConnectionsClick}
          >
            Manage Connections
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;