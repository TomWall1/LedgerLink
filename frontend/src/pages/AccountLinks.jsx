import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AccountLinks = () => {
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewLinkForm, setShowNewLinkForm] = useState(false);
  const [newLink, setNewLink] = useState({
    source: {
      system: 'xero',
      accountId: '',
      accountName: '',
      companyName: ''
    },
    target: {
      system: 'csv',
      accountId: '',
      accountName: '',
      companyName: ''
    }
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll simulate a successful API call with mock data
      // In a real implementation, you would use:
      // const response = await axios.get(`${apiUrl}/link/accounts`);
      // setLinks(response.data.links);
      
      // Mock response for demo
      setTimeout(() => {
        setLinks([
          {
            id: 'link1',
            source: {
              system: 'xero',
              accountId: 'acc-123',
              accountName: 'Accounts Receivable',
              companyName: 'ABC Corp'
            },
            target: {
              system: 'quickbooks',
              accountId: 'qb-456',
              accountName: 'Accounts Payable',
              companyName: 'XYZ Supplier'
            },
            status: 'active',
            created: '2025-02-01T12:00:00Z',
            lastReconciled: '2025-03-01T15:30:00Z'
          },
          {
            id: 'link2',
            source: {
              system: 'xero',
              accountId: 'acc-789',
              accountName: 'Accounts Receivable',
              companyName: 'ABC Corp'
            },
            target: {
              system: 'csv',
              accountId: 'csv-file',
              accountName: 'Vendor Statement',
              companyName: 'PDQ Services'
            },
            status: 'pending',
            created: '2025-03-05T09:00:00Z',
            lastReconciled: null
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch account links');
      setIsLoading(false);
      console.error('Error fetching links:', err);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      // For demo purposes, we'll simulate a successful API call
      // In a real implementation, you would use:
      // const response = await axios.post(`${apiUrl}/link/accounts`, newLink);
      // setLinks([...links, response.data]);
      
      // Mock response for demo
      const mockResponse = {
        id: `new-link-${Date.now()}`,
        ...newLink,
        status: 'pending',
        created: new Date().toISOString(),
        lastReconciled: null
      };
      
      setLinks([...links, mockResponse]);
      setShowNewLinkForm(false);
      setNewLink({
        source: {
          system: 'xero',
          accountId: '',
          accountName: '',
          companyName: ''
        },
        target: {
          system: 'csv',
          accountId: '',
          accountName: '',
          companyName: ''
        }
      });
    } catch (err) {
      setError('Failed to create account link');
      console.error('Error creating link:', err);
    }
  };

  const handleInputChange = (entity, field, value) => {
    setNewLink({
      ...newLink,
      [entity]: {
        ...newLink[entity],
        [field]: value
      }
    });
  };

  const handleRunReconciliation = async (linkId) => {
    try {
      // For demo purposes, we'll simulate a reconciliation process
      // In a real implementation, you would use:
      // await axios.post(`${apiUrl}/link/accounts/${linkId}/reconcile`);
      
      alert(`Starting reconciliation for link ${linkId}. This would normally trigger a backend process.`);
      
      // Update the link's lastReconciled date in the UI
      const updatedLinks = links.map(link => {
        if (link.id === linkId) {
          return {
            ...link,
            lastReconciled: new Date().toISOString()
          };
        }
        return link;
      });
      
      setLinks(updatedLinks);
    } catch (err) {
      setError(`Failed to start reconciliation for link ${linkId}`);
      console.error('Error running reconciliation:', err);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (window.confirm('Are you sure you want to delete this account link?')) {
      try {
        // For demo purposes, we'll simulate a successful deletion
        // In a real implementation, you would use:
        // await axios.delete(`${apiUrl}/link/accounts/${linkId}`);
        
        // Remove the link from the UI
        setLinks(links.filter(link => link.id !== linkId));
      } catch (err) {
        setError(`Failed to delete account link ${linkId}`);
        console.error('Error deleting link:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Account Links</h1>
          <button 
            onClick={() => setShowNewLinkForm(!showNewLinkForm)}
            className={`${showNewLinkForm ? 'bg-gray-200 text-primary' : 'bg-secondary text-white'} hover:bg-opacity-90 px-4 py-2 rounded-lg transition-colors font-medium flex items-center`}
          >
            {showNewLinkForm ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Create New Link
              </>
            )}
          </button>
        </div>

        {showNewLinkForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-primary">Create New Account Link</h2>
            <form onSubmit={handleCreateLink}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Account */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-3 text-primary">Source Account (AR)</h3>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">System</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.source.system}
                      onChange={(e) => handleInputChange('source', 'system', e.target.value)}
                      required
                    >
                      <option value="xero">Xero</option>
                      <option value="quickbooks">QuickBooks</option>
                      <option value="sage">Sage</option>
                      <option value="csv">CSV Upload</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">Account ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.source.accountId}
                      onChange={(e) => handleInputChange('source', 'accountId', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">Account Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.source.accountName}
                      onChange={(e) => handleInputChange('source', 'accountName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.source.companyName}
                      onChange={(e) => handleInputChange('source', 'companyName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {/* Target Account */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-3 text-primary">Target Account (AP)</h3>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">System</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.target.system}
                      onChange={(e) => handleInputChange('target', 'system', e.target.value)}
                      required
                    >
                      <option value="quickbooks">QuickBooks</option>
                      <option value="xero">Xero</option>
                      <option value="sage">Sage</option>
                      <option value="csv">CSV Upload</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">Account ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.target.accountId}
                      onChange={(e) => handleInputChange('target', 'accountId', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">Account Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.target.accountName}
                      onChange={(e) => handleInputChange('target', 'accountName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-text mb-1">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={newLink.target.companyName}
                      onChange={(e) => handleInputChange('target', 'companyName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  type="button" 
                  className="bg-gray-200 hover:bg-gray-300 text-primary px-4 py-2 rounded-lg mr-3 transition-colors"
                  onClick={() => setShowNewLinkForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-secondary hover:bg-opacity-90 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        )}

        {links.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
            <p className="text-text">No account links found. Create your first link to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {links.map(link => (
              <div key={link.id} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className={`p-4 ${link.status === 'active' ? 'bg-green-50' : 'bg-yellow-50'} border-b`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-primary">{link.source.companyName} ↔ {link.target.companyName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${link.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>                  
                      {link.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-text mb-1">Source Account (AR)</h4>
                      <p className="font-medium text-primary">{link.source.accountName}</p>
                      <p className="text-sm text-text">{link.source.system.toUpperCase()} - {link.source.accountId}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-text mb-1">Target Account (AP)</h4>
                      <p className="font-medium text-primary">{link.target.accountName}</p>
                      <p className="text-sm text-text">{link.target.system.toUpperCase()} - {link.target.accountId}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-text mb-4">
                    <p>Created: {new Date(link.created).toLocaleDateString()}</p>
                    {link.lastReconciled && (
                      <p>Last reconciled: {new Date(link.lastReconciled).toLocaleDateString()} {new Date(link.lastReconciled).toLocaleTimeString()}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => handleRunReconciliation(link.id)}
                      className="bg-secondary hover:bg-opacity-90 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Run Reconciliation
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountLinks;