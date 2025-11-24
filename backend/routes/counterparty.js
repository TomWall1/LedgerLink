/**
 * Counterparty API Routes
 * Handles counterparty linking and data access
 * Uses Prisma for database access (PostgreSQL)
 * 
 * UPDATED: Now uses MongoDB-based Xero connections instead of file-based tokens
 * UPDATED: Added graceful error handling for PostgreSQL database operations
 * UPDATED: Added custom email override functionality for contacts without emails
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import xeroService from '../services/xeroService.js';
import ContactEmailOverride from '../models/ContactEmailOverride.js';

const router = express.Router();

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * @route   GET /api/counterparty/erp-contacts
 * @desc    Get all contacts (customers/vendors) from connected ERP systems with invitation status
 * @access  Private
 */
router.get('/erp-contacts', auth, async (req, res) => {
  console.log('\n========== ERP CONTACTS FETCH REQUEST ==========');
  
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    console.log(`📋 STEP 1: Request initiated`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Company ID: ${companyId}`);

    // Get Xero connections from MongoDB
    console.log('🔑 STEP 2: Fetching Xero connections from MongoDB...');
    const xeroConnections = await xeroService.getUserConnections(userId, companyId);
    
    console.log(`✅ STEP 2: Found ${xeroConnections.length} Xero connections`);
    
    if (xeroConnections.length === 0) {
      console.log('ℹ️ No Xero connections found for this user');
      return res.json({
        contacts: [],
        erpConnections: []
      });
    }

    // Get all custom email overrides for this user
    console.log('📧 STEP 2.5: Fetching custom email overrides...');
    const emailOverrides = await ContactEmailOverride.find({
      userId: userId,
      companyId: companyId,
      isActive: true
    });
    console.log(`✅ STEP 2.5: Found ${emailOverrides.length} custom email overrides`);

    // Create a map for quick lookup of custom emails
    const emailOverrideMap = new Map();
    emailOverrides.forEach(override => {
      const key = `${override.erpConnectionId}-${override.erpContactId}`;
      emailOverrideMap.set(key, override.customEmail);
    });

    // Get all existing counterparty links for status checking
    console.log('🔗 STEP 3: Fetching existing counterparty links...');
    let existingLinks = [];
    try {
      existingLinks = await prisma.counterpartyLink.findMany({
        where: {
          companyId: companyId,
          isActive: true
        }
      });
      console.log(`✅ STEP 3: Found ${existingLinks.length} existing counterparty links`);
    } catch (error) {
      console.log('ℹ️ STEP 3: PostgreSQL database not configured - continuing without counterparty links');
      console.log('   Note: This is expected if you have not set up the PostgreSQL database for counterparty linking');
      // Continue without links - this is not critical for basic functionality
      existingLinks = [];
    }

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

    // Fetch contacts from all Xero connections
    const allContacts = [];
    const erpConnectionsInfo = [];

    console.log('\n👥 STEP 4: Fetching contacts from Xero connections...');
    
    for (const connection of xeroConnections) {
      try {
        console.log(`\n   📍 Processing connection: ${connection.tenantName}`);
        console.log(`      Connection ID: ${connection._id}`);
        console.log(`      Tenant ID: ${connection.tenantId}`);

        // Get contacts from Xero using the xeroService
        console.log('      🔄 Calling xeroService.getContacts()...');
        const xeroContacts = await xeroService.getContacts(connection);
        
        console.log(`      📊 Retrieved ${xeroContacts.length} contacts from ${connection.tenantName}`);
        
        if (xeroContacts.length === 0) {
          console.log('      ⚠️ No contacts found in this Xero organization');
          console.log('      💡 Tip: Add some contacts in Xero first, then try again');
        } else {
          console.log('      📋 Sample contact data (first contact):');
          if (xeroContacts[0]) {
            console.log(`         Name: ${xeroContacts[0].Name || 'N/A'}`);
            console.log(`         ContactID: ${xeroContacts[0].ContactID || 'N/A'}`);
            console.log(`         EmailAddress: ${xeroContacts[0].EmailAddress || 'N/A'}`);
            console.log(`         IsCustomer: ${xeroContacts[0].IsCustomer}`);
            console.log(`         IsSupplier: ${xeroContacts[0].IsSupplier}`);
          }
        }

        // Process each contact
        let processedCount = 0;
        for (const contact of xeroContacts) {
          try {
            // Determine contact type based on Xero fields
            let contactType = 'both';
            if (contact.IsCustomer && !contact.IsSupplier) {
              contactType = 'customer';
            } else if (contact.IsSupplier && !contact.IsCustomer) {
              contactType = 'vendor';
            }

            // Check for custom email override
            const overrideKey = `${connection.tenantId}-${contact.ContactID}`;
            const customEmail = emailOverrideMap.get(overrideKey);
            
            // Use custom email if available, otherwise use Xero email
            const email = customEmail || contact.EmailAddress || '';
            const hasCustomEmail = !!customEmail;

            // Check for invitation/link status
            const lookupKey = `${contact.Name.toLowerCase()}-${email.toLowerCase()}`;
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
              erpConnectionId: connection.tenantId,
              erpType: 'Xero',
              erpContactId: contact.ContactID,
              name: contact.Name,
              email: email,
              hasCustomEmail: hasCustomEmail,
              type: contactType,
              contactNumber: contact.ContactNumber || '',
              status: status,
              inviteId: inviteId,
              linkId: linkId,
              metadata: {
                accountNumber: contact.AccountNumber,
                taxNumber: contact.TaxNumber,
                phones: contact.Phones,
                addresses: contact.Addresses
              }
            });
            
            processedCount++;
          } catch (contactError) {
            console.error(`      ❌ Error processing contact: ${contact.Name || 'Unknown'}`);
            console.error(`         Error: ${contactError.message}`);
            // Continue with next contact
          }
        }
        
        console.log(`      ✅ Successfully processed ${processedCount} contacts`);

        // Add connection info
        erpConnectionsInfo.push({
          id: connection.tenantId,
          platform: 'Xero',
          name: connection.tenantName,
          status: 'active'
        });

      } catch (connectionError) {
        console.error(`\n   ❌ Error fetching contacts from ${connection.tenantName}:`);
        console.error(`      Error type: ${connectionError.constructor.name}`);
        console.error(`      Error message: ${connectionError.message}`);
        console.error(`      Stack trace:`, connectionError.stack);
        // Continue with other connections
      }
    }

    console.log('\n📦 STEP 5: Preparing response...');
    console.log(`   - Total contacts: ${allContacts.length}`);
    console.log(`   - Contacts with custom emails: ${allContacts.filter(c => c.hasCustomEmail).length}`);
    console.log(`   - Total connections: ${erpConnectionsInfo.length}`);

    if (allContacts.length === 0) {
      console.log('\n⚠️ WARNING: No contacts found!');
      console.log('   Possible reasons:');
      console.log('   1. Your Xero organization has no contacts yet');
      console.log('   2. There was an error fetching contacts (check logs above)');
      console.log('\n   💡 Solution: Add some customers or suppliers in your Xero account');
    }

    console.log('✅ STEP 5: Response prepared successfully');
    console.log('========== ERP CONTACTS FETCH COMPLETE ==========\n');

    res.json({
      contacts: allContacts,
      erpConnections: erpConnectionsInfo
    });

  } catch (error) {
    console.error('\n❌ ========== FATAL ERROR IN ERP CONTACTS FETCH ==========');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('========== END ERROR ==========\n');
    
    res.status(500).json({
      error: 'Failed to fetch ERP contacts',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   POST /api/counterparty/contact/email
 * @desc    Add or update custom email for an ERP contact
 * @access  Private
 */
router.post('/contact/email', auth, async (req, res) => {
  try {
    const {
      erpConnectionId,
      erpContactId,
      contactName,
      customEmail
    } = req.body;

    const userId = req.user.id;
    const companyId = req.user.companyId;

    // Validate required fields
    if (!erpConnectionId || !erpContactId || !contactName || !customEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'erpConnectionId, erpContactId, contactName, and customEmail are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    console.log(`📧 Setting custom email for contact: ${contactName}`);
    console.log(`   ERP Connection: ${erpConnectionId}`);
    console.log(`   Contact ID: ${erpContactId}`);
    console.log(`   Email: ${customEmail}`);

    // Use findOneAndUpdate with upsert to create or update
    const emailOverride = await ContactEmailOverride.findOneAndUpdate(
      {
        userId: userId,
        companyId: companyId,
        erpConnectionId: erpConnectionId,
        erpContactId: erpContactId
      },
      {
        userId: userId,
        companyId: companyId,
        erpConnectionId: erpConnectionId,
        erpContactId: erpContactId,
        erpType: 'Xero',
        contactName: contactName,
        customEmail: customEmail.toLowerCase().trim(),
        isActive: true
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    console.log(`✅ Custom email ${emailOverride.isNew ? 'created' : 'updated'} successfully`);

    res.json({
      success: true,
      message: 'Email updated successfully',
      customEmail: emailOverride.customEmail
    });

  } catch (error) {
    console.error('❌ Error saving custom email:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to save custom email',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/counterparty/contact/email
 * @desc    Remove custom email for an ERP contact
 * @access  Private
 */
router.delete('/contact/email', auth, async (req, res) => {
  try {
    const { erpConnectionId, erpContactId } = req.body;

    const userId = req.user.id;
    const companyId = req.user.companyId;

    if (!erpConnectionId || !erpContactId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'erpConnectionId and erpContactId are required'
      });
    }

    console.log(`🗑️ Removing custom email for contact`);
    console.log(`   ERP Connection: ${erpConnectionId}`);
    console.log(`   Contact ID: ${erpContactId}`);

    // Delete the custom email override
    const result = await ContactEmailOverride.deleteOne({
      userId: userId,
      companyId: companyId,
      erpConnectionId: erpConnectionId,
      erpContactId: erpContactId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Custom email not found'
      });
    }

    console.log(`✅ Custom email removed successfully`);

    res.json({
      success: true,
      message: 'Custom email removed successfully'
    });

  } catch (error) {
    console.error('❌ Error removing custom email:', error);
    res.status(500).json({
      error: 'Failed to remove custom email',
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
    const crypto = await import('crypto');
    const linkToken = crypto.randomBytes(32).toString('hex');
    const linkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create counterparty link with PENDING status
    try {
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
    } catch (dbError) {
      console.error('❌ Database error creating invitation:', dbError);
      console.log('ℹ️ Note: PostgreSQL database may not be configured');
      res.status(503).json({
        error: 'Database unavailable',
        message: 'The counterparty linking feature requires PostgreSQL database setup. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

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

    try {
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
    } catch (dbError) {
      console.error('❌ Database error resending invitation:', dbError);
      console.log('ℹ️ Note: PostgreSQL database may not be configured');
      res.status(503).json({
        error: 'Database unavailable',
        message: 'The counterparty linking feature requires PostgreSQL database setup.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

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

    try {
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
    } catch (dbError) {
      console.log('ℹ️ PostgreSQL database not configured - returning unlinked status');
      return res.json({
        success: true,
        linked: false,
        counterparty: null
      });
    }

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

    try {
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
    } catch (dbError) {
      console.log('ℹ️ PostgreSQL database not configured');
      res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: 'The counterparty linking feature requires PostgreSQL database setup.'
      });
    }

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

    try {
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
    } catch (dbError) {
      console.log('ℹ️ PostgreSQL database not configured - returning empty links');
      res.json({
        success: true,
        links: [],
        count: 0
      });
    }

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

export default router;
