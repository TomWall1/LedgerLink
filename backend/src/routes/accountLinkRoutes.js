import express from 'express';

export const router = express.Router();

/**
 * Account linking routes for LedgerLink
 * These APIs allow users to create persistent connections between accounts
 * across different systems for ongoing reconciliation.
 */

// Get all account links for a company
router.get('/accounts', (req, res) => {
  // This would typically involve database queries
  // For the MVP, we'll return mock data
  res.json({
    links: [
      {
        id: 'link1',
        source: {
          system: 'xero',
          accountId: 'acc-123',
          accountName: 'Accounts Receivable',
          companyName: 'ABC Corp'
        },
        target: {
          system: 'quickbooks',
          accountId: 'qb-456',
          accountName: 'Accounts Payable',
          companyName: 'XYZ Supplier'
        },
        status: 'active',
        created: '2025-02-01T12:00:00Z',
        lastReconciled: '2025-03-01T15:30:00Z'
      },
      {
        id: 'link2',
        source: {
          system: 'xero',
          accountId: 'acc-789',
          accountName: 'Accounts Receivable',
          companyName: 'ABC Corp'
        },
        target: {
          system: 'csv',
          accountId: 'csv-file',
          accountName: 'Vendor Statement',
          companyName: 'PDQ Services'
        },
        status: 'pending',
        created: '2025-03-05T09:00:00Z',
        lastReconciled: null
      }
    ]
  });
});

// Create a new account link
router.post('/accounts', (req, res) => {
  // In a full implementation, this would validate the link data and save to database
  const linkData = req.body;
  console.log('Creating new account link:', linkData);
  
  // Return a success response with mock data
  res.status(201).json({
    id: 'new-link-' + Date.now(),
    ...linkData,
    status: 'pending',
    created: new Date().toISOString(),
    lastReconciled: null
  });
});

// Get a specific account link by ID
router.get('/accounts/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock response - in production this would fetch from database
  if (id === 'link1') {
    res.json({
      id: 'link1',
      source: {
        system: 'xero',
        accountId: 'acc-123',
        accountName: 'Accounts Receivable',
        companyName: 'ABC Corp'
      },
      target: {
        system: 'quickbooks',
        accountId: 'qb-456',
        accountName: 'Accounts Payable',
        companyName: 'XYZ Supplier'
      },
      status: 'active',
      created: '2025-02-01T12:00:00Z',
      lastReconciled: '2025-03-01T15:30:00Z',
      reconciliationHistory: [
        {
          date: '2025-03-01T15:30:00Z',
          status: 'completed',
          matchedCount: 42,
          unmatchedCount: 3,
          totalAmount: 125750.00
        },
        {
          date: '2025-02-15T10:15:00Z',
          status: 'completed',
          matchedCount: 38,
          unmatchedCount: 5,
          totalAmount: 115200.00
        }
      ]
    });
  } else if (id === 'link2') {
    res.json({
      id: 'link2',
      source: {
        system: 'xero',
        accountId: 'acc-789',
        accountName: 'Accounts Receivable',
        companyName: 'ABC Corp'
      },
      target: {
        system: 'csv',
        accountId: 'csv-file',
        accountName: 'Vendor Statement',
        companyName: 'PDQ Services'
      },
      status: 'pending',
      created: '2025-03-05T09:00:00Z',
      lastReconciled: null,
      reconciliationHistory: []
    });
  } else {
    res.status(404).json({ error: 'Account link not found' });
  }
});

// Update an existing account link
router.put('/accounts/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  console.log(`Updating account link ${id}:`, updateData);
  
  // Mock success response
  res.json({
    id,
    ...updateData,
    updated: new Date().toISOString()
  });
});

// Delete an account link
router.delete('/accounts/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`Deleting account link ${id}`);
  
  // Mock success response
  res.status(204).send();
});

// Run a reconciliation for a linked account
router.post('/accounts/:id/reconcile', (req, res) => {
  const { id } = req.params;
  const options = req.body;
  
  console.log(`Running reconciliation for account link ${id} with options:`, options);
  
  // Mock a reconciliation process
  // In real implementation, this might be a longer-running job
  setTimeout(() => {
    res.json({
      id,
      reconciliationId: 'recon-' + Date.now(),
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 5000).toISOString(),
      results: {
        matchedCount: Math.floor(Math.random() * 50) + 20,
        unmatchedCount: Math.floor(Math.random() * 10),
        totalAmount: Math.floor(Math.random() * 100000) + 50000
      }
    });
  }, 1000);
});

// Get reconciliation history for an account link
router.get('/accounts/:id/history', (req, res) => {
  const { id } = req.params;
  
  // Generate mock history data
  const historyEntries = [];
  const now = Date.now();
  
  // Create 5 mock history entries
  for (let i = 0; i < 5; i++) {
    const date = new Date(now - (i * 15 * 24 * 60 * 60 * 1000)); // Every 15 days back
    historyEntries.push({
      id: `recon-${date.getTime()}`,
      date: date.toISOString(),
      status: 'completed',
      matchedCount: Math.floor(Math.random() * 50) + 20,
      unmatchedCount: Math.floor(Math.random() * 10),
      totalAmount: Math.floor(Math.random() * 100000) + 50000
    });
  }
  
  res.json({
    accountLinkId: id,
    history: historyEntries
  });
});

export default router;