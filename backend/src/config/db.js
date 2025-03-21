import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Get connection string from environment variables
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink';

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB at:', connectionString);
    
    // Remove deprecation warnings settings as they're no longer needed in newer versions
    const conn = await mongoose.connect(connectionString);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
