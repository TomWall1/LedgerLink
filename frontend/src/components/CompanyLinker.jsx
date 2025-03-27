import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { navigateTo } from '../utils/customRouter';

const CompanyLinker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [sourceCompany, setSourceCompany] = useState(null);
  const [targetCompany, setTargetCompany] = useState(null);
  const [linkType, setLinkType] = useState('customer');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [processingLink, setProcessingLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch data on component mount
  useEffect(() => {
    fetchCompanies();
    fetchLinkedCompanies();
  }, []);
  
  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/companies');
      setCompanies(response.data.companies || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch existing company links
  const fetchLinkedCompanies = async () => {
    try {
      const response = await api.get('/api/links');
      setLinkedCompanies(response.data.links || []);
    } catch (err) {
      console.error('Error fetching linked companies:', err);
      // Don't set error state here to avoid blocking the main view
    }
  };
  
  // Create a new company link
  const createCompanyLink = async () => {
    if (!sourceCompany || !targetCompany) {
      setError('Please select both source and target companies');
      return;
    }
    
    try {
      setProcessingLink(true);
      setError(null);
      
      const response = await api.post('/api/links', {
        sourceCompanyId: sourceCompany._id,
        targetCompanyId: targetCompany._id,
        linkType,
        status: 'active'
      });
      
      // If successful, add to the list and reset form
      if (response.data.success) {
        await fetchLinkedCompanies(); // Refresh the list
        resetForm();
      }
    } catch (err) {
      console.error('Error creating company link:', err);
      setError('Failed to create company link. Please try again.');
    } finally {
      setProcessingLink(false);
    }
  };
  
  // Delete a company link
  const deleteCompanyLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) {
      return;
    }
    
    try {
      await api.delete(`/api/links/${linkId}`);
      // Remove from the list without refetching
      setLinkedCompanies(prev => prev.filter(link => link._id !== linkId));
    } catch (err) {
      console.error('Error deleting link:', err);
      setError('Failed to delete link. Please try again.');
    }
  };
  
  // Reset form fields
  const resetForm = () => {
    setSourceCompany(null);
    setTargetCompany(null);
    setLinkType('customer');
    setShowLinkForm(false);
  };
  
  // Filter companies based on search term
  const filteredCompanies = searchTerm.trim() === '' ? 
    companies :
    companies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c._id === companyId);
    return company ? company.name : 'Unknown Company';
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Company Links</h1>
        <div>
          <button
            onClick={() => setShowLinkForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Create New Link
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="ml-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Create link form */}
      {showLinkForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Company Link</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Company</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={sourceCompany?._id || ''}
                onChange={(e) => {
                  const selected = companies.find(c => c._id === e.target.value);
                  setSourceCompany(selected || null);
                }}
              >
                <option value="">Select Source Company</option>
                {companies.map(company => (
                  <option key={`source-${company._id}`} value={company._id}>{company.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Company</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={targetCompany?._id || ''}
                onChange={(e) => {
                  const selected = companies.find(c => c._id === e.target.value);
                  setTargetCompany(selected || null);
                }}
              >
                <option value="">Select Target Company</option>
                {companies.map(company => (
                  <option key={`target-${company._id}`} value={company._id}>{company.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
              <option value="subsidiary">Subsidiary</option>
              <option value="parent">Parent</option>
              <option value="affiliate">Affiliate</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createCompanyLink}
              disabled={processingLink || !sourceCompany || !targetCompany}
              className={`px-4 py-2 rounded-md text-white ${processingLink || !sourceCompany || !targetCompany ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
            >
              {processingLink ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </div>
      )}
      
      {/* Company links list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Existing Company Links</h2>
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading company data...</span>
          </div>
        ) : linkedCompanies.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No company links found. Create your first link by clicking the "Create New Link" button.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {linkedCompanies.map(link => (
                  <tr key={link._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getCompanyName(link.sourceCompanyId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                        {link.linkType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCompanyName(link.targetCompanyId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${link.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => deleteCompanyLink(link._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLinker;