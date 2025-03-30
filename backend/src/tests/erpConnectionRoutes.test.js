const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const ERPConnection = require('../models/ERPConnection');
const { generateToken } = require('../utils/authUtils');

describe('ERP Connection API Routes', () => {
  let token;
  let userId;
  let connectionId;
  
  beforeAll(async () => {
    // Generate a test user and token
    userId = new mongoose.Types.ObjectId();
    token = generateToken(userId);
    
    // Create a test connection
    const testConnection = await ERPConnection.create({
      connectionName: 'Test Connection',
      provider: 'xero',
      type: 'AR',
      userId,
      status: 'active'
    });
    
    connectionId = testConnection._id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await ERPConnection.deleteMany({ userId });
    await mongoose.connection.close();
  });
  
  describe('GET /api/erp-connections', () => {
    it('should return all user connections', async () => {
      const res = await request(app)
        .get('/api/erp-connections')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/erp-connections');
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  describe('POST /api/erp-connections', () => {
    it('should create a new connection', async () => {
      const newConnection = {
        connectionName: 'New Test Connection',
        provider: 'xero',
        type: 'AP'
      };
      
      const res = await request(app)
        .post('/api/erp-connections')
        .set('Authorization', `Bearer ${token}`)
        .send(newConnection);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connectionName).toBe(newConnection.connectionName);
      expect(res.body.data.provider).toBe(newConnection.provider);
      expect(res.body.data.type).toBe(newConnection.type);
      
      // Clean up the created connection
      await ERPConnection.findByIdAndDelete(res.body.data._id);
    });
    
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/erp-connections')
        .set('Authorization', `Bearer ${token}`)
        .send({ provider: 'xero' }); // Missing connectionName and type
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /api/erp-connections/:id', () => {
    it('should return a specific connection', async () => {
      const res = await request(app)
        .get(`/api/erp-connections/${connectionId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(connectionId.toString());
    });
    
    it('should return 404 for non-existent connection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/erp-connections/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('PUT /api/erp-connections/:id', () => {
    it('should update a connection', async () => {
      const updateData = {
        connectionName: 'Updated Connection Name'
      };
      
      const res = await request(app)
        .put(`/api/erp-connections/${connectionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connectionName).toBe(updateData.connectionName);
    });
  });
  
  describe('DELETE /api/erp-connections/:id', () => {
    it('should delete a connection', async () => {
      // Create a temporary connection to delete
      const tempConnection = await ERPConnection.create({
        connectionName: 'Temp Connection',
        provider: 'xero',
        type: 'AR',
        userId,
        status: 'active'
      });
      
      const res = await request(app)
        .delete(`/api/erp-connections/${tempConnection._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Verify the connection was deleted
      const deletedConnection = await ERPConnection.findById(tempConnection._id);
      expect(deletedConnection).toBeNull();
    });
  });
});
