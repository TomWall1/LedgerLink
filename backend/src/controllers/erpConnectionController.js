import ERPConnection from '../models/ERPConnection.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { tokenStore } from '../utils/tokenStore.js';

// Get all ERP connections for a user
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connections = await ERPConnection.find({ userId })
      .populate('companyId', 'name taxId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });
  } catch (error) {
    console.error('Error fetching user connections:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Create a new ERP connection
export const createConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, provider, connectionType, connectionName } = req.body;
    
    // Validate company exists and belongs to user
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    // Check if connection already exists
    const existingConnection = await ERPConnection.findOne({
      userId,
      companyId,
      provider,
      connectionType
    });
    
    if (existingConnection) {
      return res.status(400).json({
        success: false,
        error: 'Connection already exists for this company and type',
        data: existingConnection
      });
    }
    
    // Create new connection
    const connection = await ERPConnection.create({
      userId,
      companyId,
      provider,
      connectionType,
      connectionName: connectionName || `${company.name} ${provider.toUpperCase()} ${connectionType.toUpperCase()}`
    });
    
    res.status(201).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Get a single connection
export const getConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = req.params.id;
    
    const connection = await ERPConnection.findOne({
      _id: connectionId,
      userId
    }).populate('companyId', 'name taxId');
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Update a connection
export const updateConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = req.params.id;
    const updateData = req.body;
    
    // Prevent changing userId or companyId
    delete updateData.userId;
    delete updateData.companyId;
    
    const connection = await ERPConnection.findOneAndUpdate(
      { _id: connectionId, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Delete a connection
export const deleteConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = req.params.id;
    
    const connection = await ERPConnection.findOneAndDelete({
      _id: connectionId,
      userId
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Link a Xero tenant to a connection
export const linkXeroTenant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId, tenantId, tenantName } = req.body;
    
    // Find the connection
    const connection = await ERPConnection.findOne({
      _id: connectionId,
      userId,
      provider: 'xero' // Must be a Xero connection
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Xero connection not found'
      });
    }
    
    // Update the connection with tenant info
    connection.tenantId = tenantId;
    connection.tenantName = tenantName;
    connection.status = 'active';
    await connection.save();
    
    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error linking Xero tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Get data from a Xero connection
export const getXeroData = async (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = req.params.id;
    const { dataType } = req.query; // 'invoices', 'contacts', etc.
    
    // Find the connection
    const connection = await ERPConnection.findOne({
      _id: connectionId,
      userId,
      provider: 'xero'
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Xero connection not found'
      });
    }
    
    // Check if we have valid tokens
    const tokens = await tokenStore.getValidTokens();
    if (!tokens) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Xero'
      });
    }
    
    // Different data fetching logic based on type and connection type
    let data = [];
    if (dataType === 'invoices') {
      // Logic to get invoices based on connection type (AR/AP)
      if (connection.connectionType === 'ar' || connection.connectionType === 'both') {
        // Get sales invoices logic
      }
      if (connection.connectionType === 'ap' || connection.connectionType === 'both') {
        // Get purchase invoices logic
      }
    } else if (dataType === 'contacts') {
      // Logic to get contacts
    }
    
    // Update last synced timestamp
    connection.lastSyncedAt = new Date();
    await connection.save();
    
    res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Error fetching Xero data:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};