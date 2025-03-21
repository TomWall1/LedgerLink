import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Get connection string from environment variables
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink';

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB at:', connectionString.replace(/\/\/.+@/, '//****:****@'));  // Hide credentials in logs
    
    // Set connection options with more robust settings
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds for server selection timeout
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      family: 4  // Force IPv4 (can resolve certain connectivity issues)
    };

    const conn = await mongoose.connect(connectionString, options);

    console.log(`MongoDB Connected successfully to: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:');
    
    // Check specific error types for better debugging
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server. Please check:');
      console.error('1. MongoDB service is running (check Windows Services)');
      console.error('2. MongoDB connection string is correct');
      console.error('3. No firewall is blocking the connection');
    } else if (error.name === 'MongoParseError') {
      console.error('Invalid MongoDB connection string format');
    } else if (error.name === 'MongoNetworkError') {
      console.error('Network error connecting to MongoDB. Please verify MongoDB is running.');
    }
    
    console.error('Original error:', error.message);
    
    // Exit process with failure if this is not in development mode
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    } else {
      console.error('Application continuing in development mode despite MongoDB connection failure');
      return null; // Return null connection in development for more graceful handling
    }
  }
};

export default connectDB;
