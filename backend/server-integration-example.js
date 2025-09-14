/**
 * Example server.js integration for Xero
 * Add these changes to your existing server.js file
 */

// Add to your imports section
const xeroRoutes = require('./routes/xero');
const xeroSyncJob = require('./jobs/xeroSyncJob');
const { handleXeroErrors } = require('./middleware/xeroAuth');

// Add to your routes section (after other route definitions)
app.use('/api/xero', xeroRoutes);

// Add Xero error handler before your general error handler
app.use(handleXeroErrors);

// Start Xero sync jobs in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_XERO_SYNC_JOBS === 'true') {
  xeroSyncJob.start();
  console.log('Xero sync jobs started');
}

// Graceful shutdown for sync jobs
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  xeroSyncJob.stop();
  // ... your other shutdown code
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  xeroSyncJob.stop();
  // ... your other shutdown code
});