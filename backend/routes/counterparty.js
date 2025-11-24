/**
 * Counterparty API Routes
 * Handles counterparty linking and data access
 * 
 * UPDATED: Now uses MongoDB for ALL data storage (Xero connections, invitations, email overrides)
 * UPDATED: Removed PostgreSQL/Prisma dependency
 * UPDATED: Added custom email override functionality for contacts without emails
 * UPDATED: Added fallback to use userId as companyId when companyId is not in user object
 * UPDATED: Fixed Xero connection lookup to only filter by userId
 */

import express from 'express';
import auth from '../middleware/auth.js';
import xeroService from '../services/xeroService.js';
import ContactEmailOverride from '../models/ContactEmailOverride.js';
import CounterpartyInvitation from '../models/CounterpartyInvitation.js';

const router = express.Router();

/**
 * @route   GET /api/counterparty/erp-contacts
 * @desc    Get all contacts (customers/vendors) from connected ERP systems with invitation status
 * @access  Private
 */
router.get('/erp-contacts', auth, async (req, res) => {
  console.log('\n========== ERP CONTACTS FETCH REQUEST ==========');
  
  try {
    const userId = req.user.id || req.user._id?.toString();
    const companyId = req.user.companyId || userId; // Fallback to userId if companyId not set

    console.log(`📋 STEP 1: Request initiated`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Company ID: ${companyId}`);

    // Get Xero connections from MongoDB
    // Note: Only filter by userId, not companyId, because Xero connections
    // are stored per user, not per company
    console.log('🔑 STEP 2: Fetching Xero connections from MongoDB...');
    const xeroConnections = await xeroService.getUserConnections(userId);
    
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

    // Get all existing counterparty invitations for status checking
    console.log('🔗 STEP 3: Fetching existing counterparty invitations from MongoDB...');
    const existingInvitations = await CounterpartyInvitation.find({
      companyId: companyId,
      isActive: true
    });
    console.log(`✅ STEP 3: Found ${existingInvitations.length} existing invitations`);

    // Create a map for quick lookup of invitation status
    const invitationStatusMap = new Map();
    existingInvitations.forEach(invitation => {
      const key = `${invitation.ourCustomerName.toLowerCase()}-${invitation.theirContactEmail.toLowerCase()}`;
      invitationStatusMap.set(key, {
        status: invitation.connectionStatus,
        inviteId: invitation._id.toString(),
        linkId: invitation._id.toString()
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

            // Check for invitation status
            const lookupKey = `${contact.Name.toLowerCase()}-${email.toLowerCase()}`;
            const invitationInfo = invitationStatusMap.get(lookupKey);

            // Map status to our system
            let status = 'unlinked';
            let inviteId = null;
            let linkId = null;

            if (invitationInfo) {
              inviteId = invitationInfo.inviteId;
              linkId = invitationInfo.linkId;
              
              switch (invitationInfo.status) {
                case 'LINKED':
                  status = 'linked';
                  break;
                case 'PENDING':
                case 'ACCEPTED':
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

// ... rest of the routes remain the same ...

export default router;