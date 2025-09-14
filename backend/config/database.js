/**
 * Database Configuration
 * Enhanced MongoDB configuration with Xero collection optimization
 */

const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        
        // Additional options for production
        ...(process.env.NODE_ENV === 'production' && {
          ssl: process.env.MONGODB_SSL === 'true',
          retryWrites: true,
          w: 'majority',
          readPreference: 'primary',
          compressors: ['zlib'],
        })
      };
      
      console.log('Connecting to MongoDB...');
      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Connected to MongoDB');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Create indexes after connection
      await this.createIndexes();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Retrying connection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => this.connect(), 5000 * this.reconnectAttempts);
      } else {
        console.error('Max reconnection attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }
  
  setupEventListeners() {
    mongoose.connection.on('disconnected', () => {
      console.warn('📶 MongoDB disconnected');
      this.isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('📶 MongoDB reconnected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('📶 MongoDB error:', error.message);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
  
  async createIndexes() {
    try {
      console.log('Creating database indexes...');
      
      // XeroConnection indexes
      await mongoose.connection.db.collection('xeroconnections').createIndex(
        { userId: 1, companyId: 1 }
      );
      
      await mongoose.connection.db.collection('xeroconnections').createIndex(
        { tenantId: 1 },
        { unique: true }
      );
      
      await mongoose.connection.db.collection('xeroconnections').createIndex(
        { status: 1, expiresAt: 1 }
      );
      
      await mongoose.connection.db.collection('xeroconnections').createIndex(
        { lastSyncAt: -1 }
      );
      
      // User indexes (if not already created)
      await mongoose.connection.db.collection('users').createIndex(
        { email: 1 },
        { unique: true, sparse: true }
      );
      
      // Company indexes (if not already created)
      await mongoose.connection.db.collection('companies').createIndex(
        { ownerId: 1 }
      );
      
      // Add indexes for your existing collections as needed
      // Transaction indexes for matching performance
      await mongoose.connection.db.collection('transactions').createIndex({
        companyId: 1,
        transaction_number: 1,
        source: 1
      });
      
      await mongoose.connection.db.collection('transactions').createIndex({
        companyId: 1,
        amount: 1,
        issue_date: 1
      });
      
      await mongoose.connection.db.collection('transactions').createIndex({
        companyId: 1,
        contact_name: 'text',
        transaction_number: 'text',
        reference: 'text'
      });
      
      console.log('✅ Database indexes created');
      
    } catch (error) {
      console.warn('⚠️  Index creation warning:', error.message);
      // Don't fail the connection for index issues
    }
  }
  
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('📶 MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error.message);
    }
  }
  
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
  
  async getStats() {
    try {
      if (!this.isConnected) {
        return { error: 'Database not connected' };
      }
      
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      // Get collection stats
      const collections = await db.listCollections().toArray();
      const collectionStats = {};
      
      for (const collection of collections) {
        try {
          const collStats = await db.collection(collection.name).stats();
          collectionStats[collection.name] = {
            count: collStats.count,
            size: collStats.size,
            avgObjSize: collStats.avgObjSize,
            storageSize: collStats.storageSize,
            indexes: collStats.nindexes
          };
        } catch (error) {
          collectionStats[collection.name] = { error: error.message };
        }
      }
      
      return {
        database: {
          collections: stats.collections,
          objects: stats.objects,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize
        },
        collections: collectionStats
      };
      
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Initialize connection
dbManager.connect().catch(console.error);

module.exports = dbManager;