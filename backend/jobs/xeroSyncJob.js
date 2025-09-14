/**
 * Xero Sync Job
 * Background job for syncing data from Xero
 */

const cron = require('node-cron');
const XeroConnection = require('../models/XeroConnection');
const xeroService = require('../services/xeroService');

class XeroSyncJob {
  constructor() {
    this.isRunning = false;
    this.syncStats = {
      lastRun: null,
      connectionsProcessed: 0,
      errors: [],
      duration: 0
    };
  }
  
  /**
   * Start the sync job scheduler
   */
  start() {
    console.log('Starting Xero sync job scheduler...');
    
    // Run every 5 minutes for invoice updates
    cron.schedule('*/5 * * * *', () => {
      this.syncInvoices();
    });
    
    // Run every hour for contact updates
    cron.schedule('0 * * * *', () => {
      this.syncContacts();
    });
    
    // Run daily for organization settings
    cron.schedule('0 6 * * *', () => {
      this.syncOrganizationSettings();
    });
    
    // Token refresh check every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.checkAndRefreshTokens();
    });
    
    console.log('Xero sync job scheduler started');
  }
  
  /**
   * Stop the sync job scheduler
   */
  stop() {
    console.log('Stopping Xero sync job scheduler...');
    cron.destroy();
  }
  
  /**
   * Sync invoices for all active connections
   */
  async syncInvoices() {
    if (this.isRunning) {
      console.log('Sync job already running, skipping...');
      return;
    }
    
    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log('Starting invoice sync job...');
      
      const activeConnections = await XeroConnection.findActiveConnections()
        .select('+accessToken +refreshToken');
      
      console.log(`Found ${activeConnections.length} active Xero connections`);
      
      let processed = 0;
      const errors = [];
      
      for (const connection of activeConnections) {
        try {
          await this.syncConnectionInvoices(connection);
          processed++;
        } catch (error) {
          console.error(`Failed to sync invoices for connection ${connection.tenantId}:`, error);
          errors.push({
            connectionId: connection._id,
            tenantId: connection.tenantId,
            error: error.message
          });
          
          // Mark connection as having sync issues
          await connection.markAsError(`Invoice sync failed: ${error.message}`);
        }
      }
      
      this.syncStats = {
        lastRun: new Date(),
        connectionsProcessed: processed,
        errors,
        duration: Date.now() - startTime
      };
      
      console.log(`Invoice sync completed: ${processed}/${activeConnections.length} connections processed in ${this.syncStats.duration}ms`);
      
    } catch (error) {
      console.error('Invoice sync job error:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Sync contacts for all active connections
   */
  async syncContacts() {
    try {
      console.log('Starting contact sync job...');
      
      const activeConnections = await XeroConnection.findActiveConnections()
        .select('+accessToken +refreshToken');
      
      for (const connection of activeConnections) {
        try {
          await this.syncConnectionContacts(connection);
        } catch (error) {
          console.error(`Failed to sync contacts for connection ${connection.tenantId}:`, error);
          await connection.markAsError(`Contact sync failed: ${error.message}`);
        }
      }
      
      console.log('Contact sync completed');
      
    } catch (error) {
      console.error('Contact sync job error:', error);
    }
  }
  
  /**
   * Sync organization settings for all active connections
   */
  async syncOrganizationSettings() {
    try {
      console.log('Starting organization settings sync job...');
      
      const activeConnections = await XeroConnection.findActiveConnections()
        .select('+accessToken +refreshToken');
      
      for (const connection of activeConnections) {
        try {
          await xeroService.syncOrganizationSettings(connection);
        } catch (error) {
          console.error(`Failed to sync settings for connection ${connection.tenantId}:`, error);
          await connection.markAsError(`Settings sync failed: ${error.message}`);
        }
      }
      
      console.log('Organization settings sync completed');
      
    } catch (error) {
      console.error('Organization settings sync job error:', error);
    }
  }
  
  /**
   * Check and refresh tokens for connections nearing expiry
   */
  async checkAndRefreshTokens() {
    try {
      console.log('Checking tokens for refresh...');
      
      // Find connections that expire in the next hour
      const expiringConnections = await XeroConnection.find({
        status: 'active',
        expiresAt: {
          $lt: new Date(Date.now() + 60 * 60 * 1000) // Next hour
        }
      }).select('+accessToken +refreshToken');
      
      console.log(`Found ${expiringConnections.length} connections needing token refresh`);
      
      for (const connection of expiringConnections) {
        try {
          await xeroService.refreshToken(connection);
          console.log(`Refreshed tokens for connection ${connection.tenantId}`);
        } catch (error) {
          console.error(`Failed to refresh token for connection ${connection.tenantId}:`, error);
          await connection.markAsError(`Token refresh failed: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('Token refresh job error:', error);
    }
  }
  
  /**
   * Sync invoices for a specific connection
   * @param {Object} connection - Xero connection object
   */
  async syncConnectionInvoices(connection) {
    // Get invoices updated in the last day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const filters = {
      dateFrom: yesterday.toISOString().split('T')[0],
      page: 1
    };
    
    let hasMore = true;
    let totalSynced = 0;
    
    while (hasMore) {
      const invoices = await xeroService.getInvoices(connection, filters);
      
      if (invoices.length === 0) {
        hasMore = false;
        break;
      }
      
      // Here you would typically save the invoices to your database
      // For now, we'll just count them
      totalSynced += invoices.length;
      
      // If we got less than the batch size, we're done
      if (invoices.length < 100) {
        hasMore = false;
      } else {
        filters.page++;
      }
    }
    
    // Update connection sync status
    connection.lastSyncAt = new Date();
    connection.lastSyncStatus = 'success';
    connection.dataCounts.invoices = totalSynced;
    connection.dataCounts.lastUpdated = new Date();
    
    await connection.save();
    
    console.log(`Synced ${totalSynced} invoices for connection ${connection.tenantId}`);
  }
  
  /**
   * Sync contacts for a specific connection
   * @param {Object} connection - Xero connection object
   */
  async syncConnectionContacts(connection) {
    const filters = { page: 1 };
    let hasMore = true;
    let totalSynced = 0;
    
    while (hasMore) {
      const contacts = await xeroService.getContacts(connection, filters);
      
      if (contacts.length === 0) {
        hasMore = false;
        break;
      }
      
      // Here you would typically save the contacts to your database
      totalSynced += contacts.length;
      
      if (contacts.length < 100) {
        hasMore = false;
      } else {
        filters.page++;
      }
    }
    
    // Update connection contact count
    connection.dataCounts.contacts = totalSynced;
    connection.dataCounts.lastUpdated = new Date();
    
    await connection.save();
    
    console.log(`Synced ${totalSynced} contacts for connection ${connection.tenantId}`);
  }
  
  /**
   * Get sync job statistics
   * @returns {Object} - Sync statistics
   */
  getStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning
    };
  }
  
  /**
   * Manually trigger a sync for a specific connection
   * @param {string} connectionId - Connection ID to sync
   */
  async syncConnection(connectionId) {
    try {
      const connection = await XeroConnection.findById(connectionId)
        .select('+accessToken +refreshToken');
      
      if (!connection) {
        throw new Error('Connection not found');
      }
      
      if (connection.status !== 'active') {
        throw new Error('Connection is not active');
      }
      
      // Sync invoices and contacts
      await Promise.all([
        this.syncConnectionInvoices(connection),
        this.syncConnectionContacts(connection),
        xeroService.syncOrganizationSettings(connection)
      ]);
      
      return {
        success: true,
        message: 'Connection synced successfully',
        syncedAt: new Date()
      };
      
    } catch (error) {
      console.error('Manual sync error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const xeroSyncJob = new XeroSyncJob();

module.exports = xeroSyncJob;