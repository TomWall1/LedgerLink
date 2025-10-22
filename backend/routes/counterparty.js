/**
 * Counterparty API Routes
 * Handles counterparty linking and data access
 * Uses Prisma for database access (PostgreSQL)
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * @route   GET /api/counterparty/check-link
 * @desc    Check if a customer/supplier has a linked counterparty account
 * @access  Private
 * @query   name - Customer/supplier name from YOUR system
 * @query   ledgerType - 'AR' or 'AP'
 */
router.get('/check-link', auth, async (req, res) => {
  try {
    const { name, ledgerType } = req.query;
    const companyId = req.user.companyId;

    if (!name || !ledgerType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: name and ledgerType'
      });
    }

    console.log(`🔍 Checking counterparty link for: ${name} (${ledgerType})`);

    // Query CounterpartyLink table using Prisma
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        companyId: companyId,
        ourCustomerName: {
          equals: name,
          mode: 'insensitive' // Case-insensitive match
        },
        connectionStatus: 'LINKED', // Only return if fully linked
        isActive: true
      },
      select: {
        id: true,
        theirCompanyName: true,
        theirSystemType: true,
        theirContactEmail: true,
        theirContactName: true,
        connectionStatus: true,
        updatedAt: true
      }
    });

    if (link) {
      console.log(`✅ Found linked counterparty:`, link.theirCompanyName);
      return res.json({
        success: true,
        linked: true,
        counterparty: {
          id: link.id,
          companyName: link.theirCompanyName,
          erpType: link.theirSystemType,
          contactEmail: link.theirContactEmail,
          contactName: link.theirContactName,
          lastUpdated: link.updatedAt
        }
      });
    }

    console.log(`ℹ️ No linked counterparty found for ${name}`);
    return res.json({
      success: true,
      linked: false,
      counterparty: null
    });

  } catch (error) {
    console.error('❌ Error checking counterparty link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check counterparty link',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/counterparty/:linkId/invoices
 * @desc    Fetch invoices from a linked counterparty (NOT YET IMPLEMENTED)
 * @access  Private
 */
router.get('/:linkId/invoices', auth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const companyId = req.user.companyId;

    // Verify the link exists and belongs to this company
    const link = await prisma.counterpartyLink.findFirst({
      where: {
        id: linkId,
        companyId: companyId,
        connectionStatus: 'LINKED',
        isActive: true
      }
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Counterparty link not found or not accessible'
      });
    }

    // TODO: Implement actual invoice fetching from counterparty's system
    // This would require:
    // 1. Secure cross-account data access mechanism
    // 2. Permission system for counterparties to grant access
    // 3. Handling different ERP types on the counterparty side
    
    res.status(501).json({
      success: false,
      error: 'Invoice fetching from counterparties not yet implemented',
      message: 'This feature requires cross-account data access implementation'
    });

  } catch (error) {
    console.error('❌ Error fetching counterparty invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch counterparty invoices',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/counterparty/links
 * @desc    Get all counterparty links for the company
 * @access  Private
 */
router.get('/links', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const links = await prisma.counterpartyLink.findMany({
      where: {
        companyId: companyId,
        isActive: true
      },
      select: {
        id: true,
        ourCustomerName: true,
        theirCompanyName: true,
        theirSystemType: true,
        theirContactEmail: true,
        connectionStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      success: true,
      links: links,
      count: links.length
    });

  } catch (error) {
    console.error('❌ Error fetching counterparty links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch counterparty links',
      message: error.message
    });
  }
});

// Graceful shutdown - disconnect Prisma
process.on('SIGINT', async () => {
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

module.exports = router;
