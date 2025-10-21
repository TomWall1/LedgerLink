import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Get connection string from environment variables
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink';

// Track connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

// Connect to MongoDB with retry logic
const connectDB = async () => {
  // If already connected, return existing connection
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    connectionAttempts++;
    console.log(`🔄 Attempting to connect to MongoDB (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS})...`);
    console.log('   Connection string:', connectionString.replace(/\/\/.+@/, '//****:****@'));  // Hide credentials in logs
    
    // Set connection options with robust settings
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds for server selection timeout
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      family: 4,  // Force IPv4 (can resolve certain connectivity issues)
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
    };

    const conn = await mongoose.connect(connectionString, options);

    isConnected = true;
    connectionAttempts = 0; // Reset counter on successful connection

    console.log('========================================');
    console.log('✅ MongoDB Connected Successfully');
    console.log('========================================');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState}`);
    console.log('========================================');

    // Set up connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Will attempt to reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });

    return conn;
  } catch (error) {
    isConnected = false;
    
    console.error('========================================');
    console.error('❌ MongoDB Connection Failed');
    console.error('========================================');
    
    // Check specific error types for better debugging
    if (error.name === 'MongoServerSelectionError') {
      console.error('❌ Could not connect to any MongoDB server.');
      console.error('   Please check:');
      console.error('   1. MongoDB service is running');
      console.error('   2. MONGODB_URI environment variable is set correctly');
      console.error('   3. No firewall is blocking the connection');
      console.error('   4. Database credentials are valid');
    } else if (error.name === 'MongoParseError') {
      console.error('❌ Invalid MongoDB connection string format');
      console.error('   Current format:', connectionString.replace(/\/\/.+@/, '//****:****@'));
    } else if (error.name === 'MongoNetworkError') {
      console.error('❌ Network error connecting to MongoDB.');
      console.error('   Please verify MongoDB is running and accessible.');
    } else {
      console.error('❌ Unexpected error:', error.name);
    }
    
    console.error('   Error message:', error.message);
    console.error('========================================');
    
    // Retry logic in production
    if (process.env.NODE_ENV === 'production' && connectionAttempts < MAX_RETRY_ATTEMPTS) {
      console.log(`⏳ Retrying connection in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(); // Recursive retry
    }
    
    // In production, don't exit the process - allow the server to run
    // Database-dependent routes will fail gracefully with appropriate error messages
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Server will continue running without database connection');
      console.error('⚠️  Database-dependent operations will fail until connection is established');
      return null;
    } else {
      // In development, exit to force developer attention
      console.error('💥 Exiting in development mode due to database connection failure');
      process.exit(1);
    }
  }
};

// Helper function to check if database is connected
export const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Helper function to get connection status
export const getDBStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    isConnected,
    readyState: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || 'not connected',
    name: mongoose.connection.name || 'not connected'
  };
};

export default connectDB;
