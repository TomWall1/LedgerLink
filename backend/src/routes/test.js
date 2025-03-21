import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';

const router = express.Router();

// Set up multer for test uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simple test endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Test route is working' });
});

// MongoDB connection test
router.get('/db', async (req, res) => {
  try {
    // Check if mongoose is connected
    const connectionState = mongoose.connection.readyState;
    let stateText = '';
    
    switch (connectionState) {
      case 0:
        stateText = 'Disconnected';
        break;
      case 1:
        stateText = 'Connected';
        break;
      case 2:
        stateText = 'Connecting';
        break;
      case 3:
        stateText = 'Disconnecting';
        break;
      default:
        stateText = 'Unknown state';
    }
    
    // If connected, try to perform a simple operation
    let dbDetails = {};
    if (connectionState === 1) {
      // Get connection information
      dbDetails = {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        collections: (await mongoose.connection.db.listCollections().toArray()).map(c => c.name)
      };
    }
    
    res.json({
      status: 'OK',
      connection: {
        state: connectionState,
        stateText,
        uri: process.env.MONGODB_URI?.replace(/\/\/.+@/, '//****:****@'), // Hide credentials
        ...dbDetails
      }
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Test file upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Test file uploaded:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Return success response
    res.json({
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error in test upload:', error);
    res.status(500).json({ error: 'Error uploading file: ' + error.message });
  }
});

// Test CORS endpoint
router.options('/cors-test', (req, res) => {
  res.status(200).end();
});

router.get('/cors-test', (req, res) => {
  res.json({ message: 'CORS test successful' });
});

export default router;