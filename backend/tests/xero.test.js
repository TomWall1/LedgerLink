/**
 * Xero Integration Tests
 * Test suite for Xero OAuth and API functionality
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Adjust path to your server file
const XeroConnection = require('../models/XeroConnection');
const xeroService = require('../services/xeroService');
const { generateOAuthState, parseOAuthState } = require('../utils/xeroHelpers');

// Mock data
const mockUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com'
};

const mockCompany = {
  id: '507f1f77bcf86cd799439012',
  name: 'Test Company'
};

const mockXeroTokens = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'accounting.transactions.read'
};

const mockXeroConnection = {
  tenantId: '12345678-1234-1234-1234-123456789012',
  tenantName: 'Test Organization',
  tenantType: 'ORGANISATION'
};

describe('Xero Integration', () => {
  let authToken;
  
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ledgerlink-test');
    }
    
    // Create test user and get auth token
    // This depends on your auth system implementation
    authToken = 'mock_jwt_token';
  });
  
  afterAll(async () => {
    // Clean up test data
    await XeroConnection.deleteMany({});
    
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
  
  beforeEach(async () => {
    // Clear test data before each test
    await XeroConnection.deleteMany({});
  });
  
  describe('OAuth Flow', () => {
    test('should generate auth URL', async () => {
      const response = await request(app)
        .get(`/api/xero/auth?companyId=${mockCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toContain('login.xero.com');
      expect(response.body.data.state).toBeDefined();
    });
    
    test('should reject auth request without company ID', async () => {
      const response = await request(app)
        .get('/api/xero/auth')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Company ID is required');
    });
    
    test('should handle OAuth callback', async () => {
      // Mock the xeroService methods
      jest.spyOn(xeroService, 'handleCallback').mockResolvedValueOnce([
        {
          tenantId: mockXeroConnection.tenantId,
          tenantName: mockXeroConnection.tenantName,
          status: 'active'
        }
      ]);
      
      const state = generateOAuthState(mockUser.id, mockCompany.id);
      
      const response = await request(app)
        .get('/api/xero/callback')
        .query({
          code: 'mock_auth_code',
          state: state
        });
      
      expect(response.status).toBe(302); // Redirect
      expect(response.headers.location).toContain('success=true');
    });
    
    test('should handle OAuth error', async () => {
      const response = await request(app)
        .get('/api/xero/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access'
        });
      
      expect(response.status).toBe(302); // Redirect
      expect(response.headers.location).toContain('error=oauth_error');
    });
  });
  
  describe('Connection Management', () => {
    let testConnection;
    
    beforeEach(async () => {
      // Create test connection
      testConnection = new XeroConnection({
        userId: mockUser.id,
        companyId: mockCompany.id,
        tenantId: mockXeroConnection.tenantId,
        tenantName: mockXeroConnection.tenantName,
        accessToken: 'encrypted_access_token',
        refreshToken: 'encrypted_refresh_token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        status: 'active'
      });
      
      await testConnection.save();
    });
    
    test('should list user connections', async () => {
      const response = await request(app)
        .get('/api/xero/connections')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tenantName).toBe(mockXeroConnection.tenantName);
    });
    
    test('should disconnect Xero connection', async () => {
      const response = await request(app)
        .delete(`/api/xero/connections/${testConnection._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify connection is marked as revoked
      const updatedConnection = await XeroConnection.findById(testConnection._id);
      expect(updatedConnection.status).toBe('revoked');
    });
    
    test('should check connection health', async () => {
      // Mock successful API call
      jest.spyOn(xeroService, 'makeApiRequest').mockResolvedValueOnce({
        Organisations: [{ Name: 'Test Org' }]
      });
      
      const response = await request(app)
        .get(`/api/xero/health/${testConnection._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.apiConnectivity).toBe('ok');
    });
  });
  
  describe('Data Fetching', () => {
    let testConnection;
    
    beforeEach(async () => {
      testConnection = new XeroConnection({
        userId: mockUser.id,
        companyId: mockCompany.id,
        tenantId: mockXeroConnection.tenantId,
        tenantName: mockXeroConnection.tenantName,
        accessToken: 'encrypted_access_token',
        refreshToken: 'encrypted_refresh_token',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'active'
      });
      
      await testConnection.save();
    });
    
    test('should fetch invoices from Xero', async () => {
      const mockInvoices = [
        {
          InvoiceID: '12345',
          InvoiceNumber: 'INV-001',
          Type: 'ACCREC',
          Contact: { Name: 'Test Customer' },
          Date: '2023-12-01T00:00:00',
          DueDate: '2023-12-31T00:00:00',
          AmountDue: 1000.00,
          Status: 'AUTHORISED'
        }
      ];
      
      jest.spyOn(xeroService, 'getInvoices').mockResolvedValueOnce(
        mockInvoices.map(inv => ({
          transaction_number: inv.InvoiceNumber,
          transaction_type: inv.Type,
          amount: inv.AmountDue,
          issue_date: new Date(inv.Date),
          due_date: new Date(inv.DueDate),
          status: 'open',
          contact_name: inv.Contact.Name,
          xero_id: inv.InvoiceID
        }))
      );
      
      const response = await request(app)
        .get('/api/xero/invoices')
        .query({ connectionId: testConnection._id })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoices).toHaveLength(1);
      expect(response.body.data.invoices[0].transaction_number).toBe('INV-001');
    });
    
    test('should fetch contacts from Xero', async () => {
      const mockContacts = [
        {
          ContactID: '12345',
          Name: 'Test Customer',
          EmailAddress: 'test@customer.com'
        }
      ];
      
      jest.spyOn(xeroService, 'getContacts').mockResolvedValueOnce(mockContacts);
      
      const response = await request(app)
        .get('/api/xero/contacts')
        .query({ connectionId: testConnection._id })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toHaveLength(1);
      expect(response.body.data.contacts[0].Name).toBe('Test Customer');
    });
    
    test('should require connection ID for data requests', async () => {
      const response = await request(app)
        .get('/api/xero/invoices')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Connection ID is required');
    });
  });
  
  describe('Utility Functions', () => {
    test('should generate and parse OAuth state', () => {
      const state = generateOAuthState(mockUser.id, mockCompany.id);
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      
      const parsed = parseOAuthState(state);
      expect(parsed.userId).toBe(mockUser.id);
      expect(parsed.companyId).toBe(mockCompany.id);
      expect(parsed.timestamp).toBeDefined();
    });
    
    test('should reject expired state', () => {
      // Create an old state (simulate time passing)
      const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      const oldData = JSON.stringify({
        userId: mockUser.id,
        companyId: mockCompany.id,
        timestamp: oldTimestamp,
        random: 'test'
      });
      const oldState = Buffer.from(oldData).toString('base64url');
      
      expect(() => parseOAuthState(oldState)).toThrow('State parameter has expired');
    });
    
    test('should validate connection ownership', async () => {
      const testConnection = new XeroConnection({
        userId: mockUser.id,
        companyId: mockCompany.id,
        tenantId: 'test-tenant',
        tenantName: 'Test Tenant',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'active'
      });
      
      await testConnection.save();
      
      // Test with correct user
      const ownedConnection = await XeroConnection.findOne({
        _id: testConnection._id,
        userId: mockUser.id
      });
      expect(ownedConnection).toBeTruthy();
      
      // Test with wrong user
      const notOwnedConnection = await XeroConnection.findOne({
        _id: testConnection._id,
        userId: 'different-user-id'
      });
      expect(notOwnedConnection).toBeFalsy();
    });
  });
});

// Helper function to create authenticated request
const authenticatedRequest = (app, method, url) => {
  return request(app)[method](url)
    .set('Authorization', `Bearer ${authToken}`);
};

// Clean up mocks after tests
afterEach(() => {
  jest.restoreAllMocks();
});