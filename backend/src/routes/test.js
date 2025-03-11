import express from 'express';
import multer from 'multer';

const router = express.Router();

// Set up multer for test uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simple test endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Test route is working' });
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