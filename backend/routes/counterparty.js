/**
 * Counterparty API Routes
 * Handles counterparty linking and data access
 * Uses Prisma for database access (PostgreSQL)
 * 
 * UPDATED: Now uses file-based token store for Xero authentication
 * instead of MongoDB to match the OAuth flow implementation
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const path = require('path');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Dynamically import ES modules (tokenStore and XeroClient)
let tokenStore;
let XeroClient;

// Load ES modules
(async () => {
  try {
    // Import tokenStore from the file-based system
    const tokenStoreModule = await import(path.join(__dirname, '../src/utils/tokenStore.js'));
    tokenStore = tokenStoreModule.tokenStore;
    
    // Import XeroClient
    const xeroNodeModule = await import('xero-node');
    XeroClient = xeroNodeModule.XeroClient;
    
    console.log('✅ Successfully loaded tokenStore and XeroClient modules');
  } catch (error) {
    console.error('❌ Error loading ES modules:', error);
  }
})();

/**
 * Helper function to get Xero client instance
 */
function getXeroClient() {
  if (!XeroClient) {
    throw new Error('XeroClient not initialized');
  }
  
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback'],
    scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read']
  });
}

/**
 * @route   GET /api/counterparty/erp-contacts
 * @desc    Get all contacts (customers/vendors) from connected ERP systems with invitation status
 * @access  Private
 */
router.get('/erp-contacts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    console.log(`📋 Fetching ERP contacts for user ${userId}, company ${companyId}`);

    // Check if modules are loaded
    if (!tokenStore) {
      console.error('❌ TokenStore not initialized');
      return res.status(500).json({
        error: 'Token store not initialized',
        message: 'Server is still starting up, please try again in a moment'
      });
    }

    // Get valid tokens from file-based token store
    const tokens = await tokenStore.getValidTokens();

    if (!tokens) {
      console.log('ℹ️ No valid Xero tokens found in token store');
      return res.json({
        contacts: [],
        erpConnections: []
      });
    }

    console.log('✅ Found valid Xero tokens');

    // Create Xero client and set tokens
    const xero = getXeroClient();
    await xero.setTokenSet(tokens);

    // Get available tenant connections
    const tenants = await xero.updateTenants();

    if (!tenants || tenants.length === 0) {
      console.log('ℹ️ No Xero tenants found');
      return res.json({
        contacts: [],
        erpConnections: []
      });
    }

    console.log(`Found ${tenants.length} Xero tenant(s)`);

    // Get all existing counterparty links for status checking
    const existingLinks = await prisma.counterpartyLink.findMany({
      where: {
        companyId: companyId,
        isActive: true
      }
    });

    // Create a map for quick lookup of link status
    const linkStatusMap = new Map();
    existingLinks.forEach(link => {
      const key = `${link.ourCustomerName.toLowerCase()}-${link.theirContactEmail.toLowerCase()}`;
      linkStatusMap.set(key, {
        status: link.connectionStatus,
        inviteId: link.id,
        linkId: link.id
      });
    });

    // Fetch contacts from all Xero tenants
    const allContacts = [];
    const erpConnectionsInfo = [];

    for (const tenant of tenants) {
      try {
        console.log(`Fetching contacts from Xero tenant: ${tenant.tenantName}`);

        // Get contacts from Xero API
        const contactsResponse = await xero.accountingApi.getContacts(tenant.tenantId);
        const xeroContacts = contactsResponse.body.contacts || [];

        console.log(`Retrieved ${xeroContacts.length} contacts from ${tenant.tenantName}`);

        // Process each contact
        for (const contact of xeroContacts) {
          // Determine contact type based on Xero fields
          let contactType = 'both';
          if (contact.isCustomer && !contact.isSupplier) {
            contactType = 'customer';
          } else if (contact.isSupplier && !contact.isCustomer) {
            contactType = 'vendor';
          }

          // Check for invitation/link status
          const lookupKey = `${contact.name.toLowerCase()}-${(contact.emailAddress || '').toLowerCase()}`;
          const linkInfo = linkStatusMap.get(lookupKey);

          // Map status to our system
          let status = 'unlinked';
          let inviteId = null;
          let linkId = null;

          if (linkInfo) {
            inviteId = linkInfo.inviteId;
            linkId = linkInfo.linkId;
            
            switch (linkInfo.status) {
              case 'LINKED':
                status = 'linked';
                break;
              case 'PENDING':
              case 'INVITED':
                status = 'pending';
                break;
              default:
                status = 'unlinked';
            }
          }

          allContacts.push({
            erpConnectionId: tenant.tenantId,
            erpType: 'Xero',
            erpContactId: contact.contactID,
            name: contact.name,
            email: contact.emailAddress || '',
            type: contactType,
            contactNumber: contact.contactNumber || '',
            status: status,
            inviteId: inviteId,
            linkId: linkId,
            metadata: {
              accountNumber: contact.accountNumber,
              taxNumber: contact.taxNumber,
              phones: contact.phones,
              addresses: contact.addresses
            }
          });
        }

        // Add connection info
        erpConnectionsInfo.push({
          id: tenant.tenantId,
          platform: 'Xero',
          name: tenant.tenantName,
          status: 'active'
        });

      } catch (tenantError) {
        console.error(`Error fetching contacts from ${tenant.tenantName}:`, tenantError);
        // Continue with other tenants
      }
    }

    console.log(`✅ Returning ${allContacts.length} total contacts from ${erpConnectionsInfo.length} connections`);

    res.json({
      contacts: allContacts,
      erpConnections: erpConnectionsInfo
    });

  } catch (error) {
    console.error('❌ Error fetching ERP contacts:', error);
    res.status(500).json({
      error: 'Failed to fetch ERP contacts',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/counterparty/invite
 * @desc    Send invitation to a counterparty to connect their accounting system
 * @access  Private
 */
router.post('/invite', auth, async (req, res) => {
  try {
    const {
      erpConnectionId,
      erpContactId,
      recipientEmail,
      relationshipType,
      message,
      contactDetails
    } = req.body;

    const companyId = req.user.companyId;
    const userId = req.user.id;

    console.log(`📧 Creating invitation for ${contactDetails.name} (${recipientEmail})`);

    // Generate a unique invitation token
    const crypto = require('crypto');
    const linkToken = crypto.randomBytes(32).toString('hex');
    const linkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create counterparty link with PENDING status
    const counterpartyLink = await prisma.counterpartyLink.create({
      data: {
        companyId: companyId,
        ourCustomerName: contactDetails.name,
        theirCompanyName: contactDetails.name, // They'll update this when they accept
        theirSystemType: 'UNKNOWN', // They'll specify when they accept
        theirContactEmail: recipientEmail,
        theirContactName: contactDetails.name,
        connectionStatus: 'PENDING',
        linkToken: linkToken,
        linkExpiresAt: linkExpiresAt,
        matchingRules: {},
        isActive: true
      }
    });

    // TODO: Send invitation email
    // This would typically use a service like SendGrid, AWS SES, etc.
    console.log(`✅ Created invitation with ID: ${counterpartyLink.id}`);
    console.log(`Invitation link: ${process.env.FRONTEND_URL}/accept-invite/${linkToken}`);

    // For now, log the invitation details
    console.log('Invitation details:', {
      to: recipientEmail,
      from: req.user.email,
      message: message,
      inviteUrl: `${process.env.FRONTEND_URL}/accept-invite/${linkToken}`
    });

    res.json({
      success: true,
      inviteId: counterpartyLink.id,
      message: 'Invitation created successfully'
    });

  } catch (error) {
    console.error('❌ Error sending invitation:', error);
    res.status(500).json({
      error: 'Failed to send invitation',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/counterparty/invite/resend
 * @desc    Resend invitation to a counterparty
 * @access  Private
 */
router.post('/invite/resend', auth, async (req, res) => {
  try {
    const { inviteId } = req.body;
    const companyId = req.user.companyId;

    console.log(`🔄 Resending invitation ${inviteId}`);

    // Get the invitation
    const invite = await prisma.counterpartyLink.findFirst({
      where: {
        id: inviteId,
        companyId: companyId,
        connectionStatus: 'PENDING',
        isActive: true
      }
    });

    if (!invite) {
      return res.status(404).json({
        error: 'Invitation not found or already accepted'
      });
    }

    // Update the expiry date
    await prisma.counterpartyLink.update({
      where: { id: inviteId },
      data: {
        linkExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend by 30 days
        updatedAt: new Date()
      }
    });

    // TODO: Resend invitation email
    console.log(`✅ Invitation ${inviteId} reminder sent to ${invite.theirContactEmail}`);

    res.json({
      success: true,
      message: 'Invitation reminder sent successfully'
    });

  } catch (error) {
    console.error('❌ Error resending invitation:', error);
    res.status(500).json({
      error: 'Failed to resend invitation',
      message: error.message
    });
  }
});

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
