import { renderHook, act } from '@testing-library/react-hooks';
import useERPConnections from '../hooks/useERPConnections';
import api from '../utils/api';

// Mock the API utility
jest.mock('../utils/api');

describe('useERPConnections Hook', () => {
  const mockConnections = [
    {
      _id: 'conn1',
      connectionName: 'Test Connection',
      provider: 'xero',
      type: 'AR',
      status: 'active'
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API mock implementations
    api.get = jest.fn().mockImplementation((url) => {
      if (url === '/api/erp-connections') {
        return Promise.resolve({
          data: {
            success: true,
            data: mockConnections
          }
        });
      }
      
      throw new Error('Not found');
    });
    
    api.post = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            _id: 'new-conn',
            connectionName: 'New Connection',
            provider: 'xero',
            type: 'AR',
            status: 'pending'
          }
        }
      });
    });
    
    api.delete = jest.fn().mockResolvedValue({
      data: { success: true }
    });
  });
  
  it('should fetch connections on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useERPConnections());
    
    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.connections).toEqual([]);
    
    await waitForNextUpdate();
    
    // After loading
    expect(result.current.loading).toBe(false);
    expect(result.current.connections).toEqual(mockConnections);
    expect(api.get).toHaveBeenCalledWith('/api/erp-connections');
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    api.get.mockImplementation(() => {
      throw new Error('API error');
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useERPConnections());
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('Failed to load connections');
  });
  
  it('should create a new connection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useERPConnections());
    
    await waitForNextUpdate();
    
    const newConnection = {
      connectionName: 'New Connection',
      provider: 'xero',
      type: 'AR'
    };
    
    await act(async () => {
      await result.current.createConnection(newConnection);
    });
    
    expect(api.post).toHaveBeenCalledWith('/api/erp-connections', newConnection);
  });
  
  it('should delete a connection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useERPConnections());
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.deleteConnection('conn1');
    });
    
    expect(api.delete).toHaveBeenCalledWith('/api/erp-connections/conn1');
  });
  
  it('should enable mock mode when 404 error occurs', async () => {
    // Mock 404 response
    api.get.mockImplementation(() => {
      const error = new Error('Not found');
      error.response = { status: 404 };
      throw error;
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useERPConnections());
    
    await waitForNextUpdate();
    
    expect(result.current.mockMode).toBe(true);
    expect(result.current.loading).toBe(false);
  });
  
  it('should work in mock mode without API calls', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useERPConnections());
    
    await waitForNextUpdate();
    
    // Enable mock mode manually
    act(() => {
      result.current.enableMockMode();
    });
    
    // Create a connection in mock mode
    await act(async () => {
      const response = await result.current.createConnection({
        connectionName: 'Mock Connection',
        provider: 'xero',
        type: 'AR'
      });
      
      expect(response.success).toBe(true);
      expect(response.data._id).toContain('mock-');
    });
    
    // API should not be called in mock mode
    expect(api.post).not.toHaveBeenCalled();
    
    // The connection should be in the local state
    expect(result.current.connections.length).toBe(1);
    expect(result.current.connections[0].connectionName).toBe('Mock Connection');
  });
});
