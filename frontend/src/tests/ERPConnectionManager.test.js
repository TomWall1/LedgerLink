import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ERPConnectionManager from '../components/ERPConnectionManager';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { XeroContext } from '../context/XeroContext';

// Mock the API utility
jest.mock('../utils/api');

// Mock the router utility
jest.mock('../utils/customRouter', () => ({
  navigateTo: jest.fn(),
}));

const mockUser = { _id: 'user123', name: 'Test User' };
const mockConnections = [
  {
    _id: 'conn1',
    connectionName: 'Test Xero Connection',
    provider: 'xero',
    type: 'AR',
    userId: 'user123',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

describe('ERPConnectionManager Component', () => {
  let mockAuthContext;
  let mockXeroContext;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock checkHealth to return true (server online)
    api.checkHealth = jest.fn().mockResolvedValue(true);
    
    // Mock successful API responses
    api.get = jest.fn().mockImplementation((url) => {
      if (url === '/api/erp-connections') {
        return Promise.resolve({ data: { data: mockConnections } });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    // Setup mock contexts
    mockAuthContext = {
      currentUser: mockUser,
      isAuthenticated: true
    };
    
    mockXeroContext = {
      isAuthenticated: true,
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  });
  
  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <XeroContext.Provider value={mockXeroContext}>
          <ERPConnectionManager />
        </XeroContext.Provider>
      </AuthContext.Provider>
    );
  };
  
  it('renders without crashing', async () => {
    renderComponent();
    expect(screen.getByText('ERP Connections')).toBeInTheDocument();
  });
  
  it('displays loading state initially', () => {
    renderComponent();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('shows connection list when loaded', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Xero Connection')).toBeInTheDocument();
    });
  });
  
  it('handles server offline state', async () => {
    // Mock server offline
    api.checkHealth.mockResolvedValue(false);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Server Connection Issue')).toBeInTheDocument();
    });
  });
  
  it('opens add connection form when button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Add Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add Connection'));
    
    expect(screen.getByText('Add ERP Connection')).toBeInTheDocument();
    expect(screen.getByLabelText('Connection Name')).toBeInTheDocument();
  });
  
  it('submits the form with correct data', async () => {
    // Mock the post request
    api.post = jest.fn().mockResolvedValue({
      data: {
        data: {
          _id: 'newConn',
          connectionName: 'New Connection',
          provider: 'xero',
          type: 'AR',
        }
      }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Add Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add Connection'));
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Connection Name'), {
      target: { value: 'New Connection' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Add Connection', { selector: 'button[type="submit"]' }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/erp-connections', expect.objectContaining({
        connectionName: 'New Connection',
        provider: 'xero',
        type: 'AR',
        userId: 'user123'
      }));
    });
  });
  
  it('activates mock mode when API returns 404', async () => {
    // Mock 404 for all API calls
    api.get.mockImplementation(() => {
      const error = new Error('Not found');
      error.response = { status: 404 };
      return Promise.reject(error);
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
  });
  
  it('allows deleting a connection', async () => {
    // Mock delete request
    api.delete = jest.fn().mockResolvedValue({ data: { success: true } });
    
    // Mock confirm
    window.confirm = jest.fn().mockReturnValue(true);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Xero Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/erp-connections/conn1');
    });
  });
});
