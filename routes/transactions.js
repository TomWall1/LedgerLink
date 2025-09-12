const express = require('express');
const router = express.Router();
const { upload, matchCustomerInvoices, approveCustomerMatch } = require('../controllers/fileController');
const { requireXeroAuth } = require('../middleware/xeroAuth');

// Match customer invoices with uploaded CSV
router.post('/match-customer-invoices', 
  requireXeroAuth,
  upload.single('file'),
  matchCustomerInvoices
);

// Approve a customer invoice match
router.post('/approve-customer-match', 
  requireXeroAuth,
  approveCustomerMatch
);

module.exports = router;