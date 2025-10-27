// Simple matching routes using the matching utility
import express from 'express';
import matchRecords from '../utils/matching.js';

const router = express.Router();

// For now, just export a basic router that can be expanded later
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Matching routes working',
    timestamp: new Date().toISOString()
  });
});

// Export as named export to match the import in server.js
export { router as matchingRoutes };
