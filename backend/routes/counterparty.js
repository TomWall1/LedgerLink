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
let modulesLoaded = false;
let moduleLoadError = null;

// Create a promise that resolves when modules are loaded
const modulesLoadingPromise = (async () => {
  try {
    console.log('🔄 Loading ES modules for counterparty routes...');
    
    // Import tokenStore from the file-based system
    const tokenStoreModule = await import(path.join(__dirname, '../src/utils/tokenStore.js'));
    tokenStore = tokenStoreModule.tokenStore;
    console.log('✅ TokenStore module loaded');
    
    // Import XeroClient
    const xeroNodeModule = await import('xero-node');
    XeroClient = xeroNodeModule.XeroClient;
    console.log('✅ XeroClient module loaded');
    
    modulesLoaded = true;
    console.log('✅ All counterparty route ES modules loaded successfully');
  } catch (error) {
    moduleLoadError = error;
    console.error('❌ Error loading ES modules for counterparty routes:', error);
    console.error('   Error details:', error.message);
    console.error('   Stack:', error.stack);
  }
})();

/**
 * Helper function to ensure modules are loaded
 */
async function ensureModulesLoaded() {
  if (!modulesLoaded) {
    console.log('⏳ Waiting for modules to load...');
    await modulesLoadingPromise;
    
    if (moduleLoadError) {
      throw new Error(`Failed to load required modules: ${moduleLoadError.message}`);
    }
  }
}

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
 * @route   GET /api/counterparty/diagnostic
 * @desc    Diagnostic endpoint to test Xero connection and see raw API response
 * @access  Private
 */
router.get('/diagnostic', auth, async (req, res) => {
  console.log('\n========== DIAGNOSTIC TEST REQUEST ==========');
  
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    rawResponse: null,
    error: null
  };

  try {
    // Step 1: Check modules
    diagnosticResults.steps.push({ step: 1, name: 'Module Loading', status: 'checking' });
    await ensureModulesLoaded();
    diagnosticResults.steps[0].status = 'success';
    diagnosticResults.steps[0].message = 'All required modules loaded';

    // Step 2: Check tokens
    diagnosticResults.steps.push({ step: 2, name: 'Token Check', status: 'checking' });
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      diagnosticResults.steps[1].status = 'failed';
      diagnosticResults.steps[1].message = 'No valid tokens found';
      diagnosticResults.error = 'No valid Xero authentication tokens. Please reconnect Xero.';
      return res.json(diagnosticResults);
    }
    
    diagnosticResults.steps[1].status = 'success';
    diagnosticResults.steps[1].message = 'Valid tokens found';
    diagnosticResults.steps[1].details = {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenExpiry: tokens.expires_in || 'unknown'
    };

    // Step 3: Create Xero client
    diagnosticResults.steps.push({ step: 3, name: 'Xero Client Creation', status: 'checking' });
    const xero = getXeroClient();
    await xero.setTokenSet(tokens);
    diagnosticResults.steps[2].status = 'success';
    diagnosticResults.steps[2].message = 'Xero client created successfully';

    // Step 4: Get tenants
    diagnosticResults.steps.push({ step: 4, name: 'Tenant Connection', status: 'checking' });
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      diagnosticResults.steps[3].status = 'failed';
      diagnosticResults.steps[3].message = 'No Xero tenants found';
      diagnosticResults.error = 'No Xero organizations connected. Please reconnect Xero.';
      return res.json(diagnosticResults);
    }
    
    diagnosticResults.steps[3].status = 'success';
    diagnosticResults.steps[3].message = `Found ${tenants.length} tenant(s)`;
    diagnosticResults.steps[3].details = tenants.map(t => ({
      id: t.tenantId,
      name: t.tenantName,
      type: t.tenantType
    }));

    // Step 5: Fetch contacts from first tenant
    diagnosticResults.steps.push({ step: 5, name: 'Fetch Contacts', status: 'checking' });
    const tenant = tenants[0];
    
    console.log(`🔍 Calling Xero API getContacts for tenant: ${tenant.tenantName} (${tenant.tenantId})`);
    const contactsResponse = await xero.accountingApi.getContacts(tenant.tenantId);
    
    // Store raw response details
    diagnosticResults.rawResponse = {
      statusCode: contactsResponse.response?.statusCode,
      statusMessage: contactsResponse.response?.statusMessage,
      hasBody: !!contactsResponse.body,
      hasContacts: !!contactsResponse.body?.Contacts,
      contactsCount: contactsResponse.body?.Contacts?.length || 0,
      // Include first 2 contacts as samples (no sensitive data)
      sampleContacts: (contactsResponse.body?.Contacts || []).slice(0, 2).map(c => ({
        name: c.Name,
        hasEmail: !!c.EmailAddress,
        isCustomer: c.IsCustomer,
        isSupplier: c.IsSupplier,
        contactStatus: c.ContactStatus
      }))
    };
    
    const contactCount = contactsResponse.body?.Contacts?.length || 0;
    
    diagnosticResults.steps[4].status = contactCount > 0 ? 'success' : 'warning';
    diagnosticResults.steps[4].message = `Retrieved ${contactCount} contacts from Xero API`;
    diagnosticResults.steps[4].details = {
      tenant: tenant.tenantName,
      contactCount: contactCount,
      apiEndpoint: 'getContacts',
      responseStatus: contactsResponse.response?.statusCode
    };

    diagnosticResults.success = true;
    diagnosticResults.summary = contactCount > 0 
      ? `Successfully connected to Xero and found ${contactCount} contacts`
      : 'Connected to Xero but no contacts found in your organization';

    console.log('✅ Diagnostic test completed successfully');
    console.log('========== DIAGNOSTIC TEST COMPLETE ==========\n');
    
    res.json(diagnosticResults);

  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    diagnosticResults.success = false;
    diagnosticResults.error = error.message;
    diagnosticResults.errorType = error.constructor.name;
    diagnosticResults.errorStack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
    res.status(500).json(diagnosticResults);
  }
});

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

    // Ensure modules are loaded before proceeding
    console.log('🔧 STEP 2: Ensuring modules are loaded...');
    try {
      await ensureModulesLoaded();
      console.log('✅ STEP 2: All required modules are loaded');
    } catch (error) {
      console.error('❌ STEP 2: Failed to load required modules');
      console.error('   Error:', error.message);
      return res.status(500).json({
        error: 'Server initialization error',
        message: 'Required modules failed to load. Please contact support.',
        details: error.message
      });
    }

    // Get valid tokens from file-based token store
    console.log('🔑 STEP 3: Attempting to get valid tokens...');
    const tokens = await tokenStore.getValidTokens();

    if (!tokens) {
      console.log('❌ STEP 3: No valid Xero tokens found in token store');
      console.log('   - Reason: User needs to connect Xero first');
      return res.json({
        contacts: [],
        erpConnections: []
      });
    }

    console.log('✅ STEP 3: Valid Xero tokens retrieved');
    console.log(`   - Has access token: ${!!tokens.access_token}`);
    console.log(`   - Has refresh token: ${!!tokens.refresh_token}`);

    // Create Xero client and set tokens
    console.log('🔧 STEP 4: Creating Xero client...');
    let xero;
    try {
      xero = getXeroClient();
      await xero.setTokenSet(tokens);
      console.log('✅ STEP 4: Xero client created and tokens set');
    } catch (error) {
      console.error('❌ STEP 4: Failed to create Xero client');
      console.error('   - Error:', error.message);
      throw error;
    }

    // Get available tenant connections
    console.log('🏢 STEP 5: Fetching Xero tenant connections...');
    let tenants;
    try {
      tenants = await xero.updateTenants();
      console.log('✅ STEP 5: Retrieved tenant connections');
      console.log(`   - Number of tenants: ${tenants ? tenants.length : 0}`);
      if (tenants && tenants.length > 0) {
        tenants.forEach((tenant, index) => {
          console.log(`   - Tenant ${index + 1}: ${tenant.tenantName} (ID: ${tenant.tenantId})`);
        });
      }
    } catch (error) {
      console.error('❌ STEP 5: Failed to retrieve tenants');
      console.error('   - Error:', error.message);
      throw error;
    }

    if (!tenants || tenants.length === 0) {
      console.log('⚠️ STEP 5: No Xero tenants found (user may need to reconnect)');
      return res.json({
        contacts: [],
        erpConnections: []
      });
    }

    // Get all existing counterparty links for status checking
    console.log('🔗 STEP 6: Fetching existing counterparty links...');
    let existingLinks;
    try {
      existingLinks = await prisma.counterpartyLink.findMany({
        where: {
          companyId: companyId,
          isActive: true
        }
      });
      console.log(`✅ STEP 6: Found ${existingLinks.length} existing counterparty links`);
    } catch (error) {
      console.error('❌ STEP 6: Failed to fetch counterparty links');
      console.error('   - Error:', error.message);
      // Continue without links - this is not critical
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

    // Fetch contacts from all Xero tenants
    const allContacts = [];
    const erpConnectionsInfo = [];

    console.log('\n👥 STEP 7: Fetching contacts from Xero tenants...');
    for (const tenant of tenants) {
      try {
        console.log(`\n   📍 Processing tenant: ${tenant.tenantName}`);
        console.log(`      Tenant ID: ${tenant.tenantId}`);

        // Get contacts from Xero API
        console.log('      🔄 Calling Xero API getContacts()...');
        const contactsResponse = await xero.accountingApi.getContacts(tenant.tenantId);
        
        console.log('      ✅ Xero API response received');
        console.log(`      Response status: ${contactsResponse.response?.statusCode || 'unknown'}`);
        console.log(`      Has body: ${!!contactsResponse.body}`);
        console.log(`      Has Contacts array: ${!!contactsResponse.body?.Contacts}`);
        
        // CRITICAL: Xero API returns properties in PascalCase in the body.Contacts array
        const xeroContacts = contactsResponse.body.Contacts || [];
        
        console.log(`      📊 Retrieved ${xeroContacts.length} contacts from ${tenant.tenantName}`);
        
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
            // IMPORTANT: Use PascalCase property names as returned by Xero API
            // Determine contact type based on Xero fields
            let contactType = 'both';
            if (contact.IsCustomer && !contact.IsSupplier) {
              contactType = 'customer';
            } else if (contact.IsSupplier && !contact.IsCustomer) {
              contactType = 'vendor';
            }

            // Check for invitation/link status
            const lookupKey = `${contact.Name.toLowerCase()}-${(contact.EmailAddress || '').toLowerCase()}`;
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
              erpContactId: contact.ContactID,
              name: contact.Name,
              email: contact.EmailAddress || '',
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
          id: tenant.tenantId,
          platform: 'Xero',
          name: tenant.tenantName,
          status: 'active'
        });

      } catch (tenantError) {
        console.error(`\n   ❌ Error fetching contacts from ${tenant.tenantName}:`);
        console.error(`      Error type: ${tenantError.constructor.name}`);
        console.error(`      Error message: ${tenantError.message}`);
        if (tenantError.response) {
          console.error(`      HTTP Status: ${tenantError.response.statusCode}`);
          console.error(`      Response body:`, tenantError.response.body);
        }
        console.error(`      Stack trace:`, tenantError.stack);
        // Continue with other tenants
      }
    }

    console.log('\n📦 STEP 8: Preparing response...');
    console.log(`   - Total contacts: ${allContacts.length}`);
    console.log(`   - Total connections: ${erpConnectionsInfo.length}`);

    if (allContacts.length === 0) {
      console.log('\n⚠️ WARNING: No contacts found!');
      console.log('   Possible reasons:');
      console.log('   1. Your Xero organization has no contacts yet');
      console.log('   2. The Xero API permissions are insufficient');
      console.log('   3. There was an error fetching contacts (check logs above)');
      console.log('\n   💡 Solution: Add some customers or suppliers in your Xero account');
    }

    console.log('✅ STEP 8: Response prepared successfully');
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