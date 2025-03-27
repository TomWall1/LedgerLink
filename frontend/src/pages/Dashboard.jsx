import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useXero } from '../context/XeroContext';
import { navigateTo } from '../utils/customRouter';
import api from '../utils/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { isAuthenticated: isXeroConnected } = useXero();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    connections: 0,
    pendingMatches: 0,
    matchedTransactions: 0,
    companyLinks: 0
  });
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get ERP connections
        const connectionsResponse = await api.get('/erp-connections');
        const connections = connectionsResponse.data?.data || [];
        
        // Get matching stats
        const matchingResponse = await api.get('/api/transactions', {
          params: { stats: true }
        });
        const matchingStats = matchingResponse.data?.stats || {
          pending: 0,
          matched: 0
        };
        
        // Get company link count
        const linksResponse = await api.get('/api/links/count');
        const linksCount = linksResponse.data?.count || 0;
        
        setStats({
          connections: connections.length,
          pendingMatches: matchingStats.pending || 0,
          matchedTransactions: matchingStats.matched || 0,
          companyLinks: linksCount
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Don't show error, just use default values
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const featureCards = [
    {
      title: 'ERP Connections',
      description: 'Connect to your ERP systems to import and manage transaction data',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      stat: stats.connections,
      statLabel: 'Active Connections',
      action: () => navigateTo('erp-connections'),
      cta: 'Manage Connections'
    },
    {
      title: 'Transaction Matching',
      description: 'Match and reconcile transactions across different systems',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      stat: stats.pendingMatches,
      statLabel: 'Pending Matches',
      action: () => navigateTo('transaction-matching'),
      cta: 'Match Transactions'
    },
    {
      title: 'Company Links',
      description: 'Create and manage relationships between your companies and counterparties',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      stat: stats.companyLinks,
      statLabel: 'Active Links',
      action: () => navigateTo('company-links'),
      cta: 'Manage Links'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {currentUser?.name || 'User'}!</h1>
          <p className="text-gray-600 mt-2">Here's an overview of your account reconciliation activity</p>
        </div>
        
        {/* Connection status */}
        <div className={`mb-8 p-4 rounded-lg ${isXeroConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center">
            <div className={`rounded-full p-2 ${isXeroConnected ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              {isXeroConnected ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h3 className={`font-medium ${isXeroConnected ? 'text-green-800' : 'text-yellow-800'}`}>
                {isXeroConnected ? 'Connected to Xero' : 'Xero Connection Required'}
              </h3>
              <p className={`text-sm ${isXeroConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                {isXeroConnected 
                  ? 'Your Xero account is successfully connected and ready to use.' 
                  : 'Connect your Xero account to start importing data.'}
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => navigateTo('erp-connections')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${isXeroConnected ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
              >
                {isXeroConnected ? 'Manage Connection' : 'Connect Now'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featureCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 transition-transform transform hover:scale-105">
              <div className="flex flex-col h-full">
                <div className="mb-4">{card.icon}</div>
                <h2 className="text-xl font-bold mb-2">{card.title}</h2>
                <p className="text-gray-600 mb-4 flex-grow">{card.description}</p>
                
                {!loading && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{card.stat}</div>
                    <div className="text-sm text-gray-500">{card.statLabel}</div>
                  </div>
                )}
                
                <button
                  onClick={card.action}
                  className="mt-auto w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {card.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Quick actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigateTo('erp-connections')}
              className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium text-gray-800">Add Connection</span>
            </button>
            
            <button
              onClick={() => navigateTo('transaction-matching')}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-gray-800">Match Transactions</span>
            </button>
            
            <button
              onClick={() => navigateTo('company-links')}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
              </svg>
              <span className="text-sm font-medium text-gray-800">Create Link</span>
            </button>
            
            <button
              onClick={() => navigateTo('reports')}
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-800">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;