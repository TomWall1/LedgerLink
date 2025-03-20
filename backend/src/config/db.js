import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Get connection string from environment variables
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(connectionString, {
      // Use new URL parser
      useNewUrlParser: true,
      // Use new server discovery and monitoring engine
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
