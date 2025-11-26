import express from 'express';
import CounterpartyInvite from '../models/CounterpartyInvite.js';
import CompanyLink from '../models/CompanyLink.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import ERPConnection from '../models/ERPConnection.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendInvitationEmail } from '../utils/emailService.js';
import { fetchXeroContacts } from '../services/xeroService.js';

const router = express.Router();

// =============================================================================
// NEW ENDPOINT: Get available ERP contacts for linking during invitation acceptance
// =============================================================================
router.get('/invite/:inviteCode/available-contacts', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    
    // Get the invitation details
    const invite = await CounterpartyInvite.findOne({ inviteCode })
      .populate('senderCompany');
    
    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer pending' });
    }
    
    if (!invite.isValid()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }
    
    // Get the user's company
    const user = await User.findById(req.user.id).populate('company');
    
    if (!user || !user.company) {
      return res.status(400).json({ 
        error: 'You must set up your company profile before accepting invitations',
        requiresCompanySetup: true
      });
    }
    
    // Get user's ERP connections
    const erpConnections = await ERPConnection.find({
      company: user.company._id,
      status: 'connected'
    });
    
    if (erpConnections.length === 0) {
      return res.status(400).json({
        error: 'You must connect an accounting system before accepting invitations',
        requiresErpConnection: true
      });
    }
    
    // Fetch contacts from all connected ERPs
    const allContacts = [];
    
    for (const connection of erpConnections) {
      if (connection.platform === 'Xero') {
        try {
          const xeroContacts = await fetchXeroContacts(connection._id);
          
          // Filter contacts based on invitation type
          // If sender invited you as a customer, you need to find them in your vendors
          // If sender invited you as a vendor, you need to find them in your customers
          const filteredContacts = xeroContacts.filter(contact => {
            if (invite.relationshipType === 'customer') {
              // Sender is your customer, so find them in your customers
              return contact.isCustomer;
            } else if (invite.relationshipType === 'vendor') {
              // Sender is your vendor, so find them in your vendors (suppliers)
              return contact.isSupplier;
            } else {
              // 'both' relationship - show all contacts
              return true;
            }
          });
          
          // Format contacts for response
          const formattedContacts = filteredContacts.map(contact => ({
            erpConnectionId: connection._id,
            erpType: 'xero',
            erpContactId: contact.contactID,
            name: contact.name,
            email: contact.emailAddress || '',
            type: contact.isCustomer && contact.isSupplier ? 'both' : 
                  contact.isCustomer ? 'customer' : 'vendor',
            contactNumber: contact.contactNumber || '',
            accountNumber: contact.accountNumber || '',
            metadata: {
              taxNumber: contact.taxNumber,
              bankAccountDetails: contact.bankAccountDetails
            }
          }));
          
          allContacts.push(...formattedContacts);
        } catch (error) {
          console.error('Error fetching Xero contacts:', error);
        }
      }
      
      // Add other ERP integrations here (QuickBooks, etc.)
    }
    
    res.json({
      success: true,
      invitation: {
        senderCompany: {
          name: invite.senderCompany.name,
          email: invite.senderCompany.email
        },
        relationshipType: invite.relationshipType,
        message: invite.message
      },
      availableContacts: allContacts,
      erpConnections: erpConnections.map(conn => ({
        id: conn._id,
        platform: conn.platform,
        name: conn.connectionName,
        status: conn.status
      })),
      hint: allContacts.length > 0 
        ? `Select which contact in your ${erpConnections[0].platform} represents "${invite.senderCompany.name}"`
        : 'No matching contacts found. You may need to add this company to your accounting system first.'
    });
  } catch (error) {
    console.error('Error fetching available contacts:', error);
    res.status(500).json({ error: 'Failed to fetch available contacts' });
  }
});

// Get customers and vendors from connected ERPs
router.get('/erp-contacts', authenticateToken, async (req, res) => {
  try {
    const { erpConnectionId } = req.query;
    
    // Get the user's company
    const user = await User.findById(req.user.id).populate('company');
    if (!user || !user.company) {
      return res.status(400).json({ error: 'User company not found' });
    }
    
    // Get ERP connection
    const query = { company: user.company._id };
    if (erpConnectionId) {
      query._id = erpConnectionId;
    }
    
    const erpConnections = await ERPConnection.find(query);
    
    const allContacts = [];
    
    for (const connection of erpConnections) {
      if (connection.status !== 'connected') continue;
      
      if (connection.platform === 'Xero') {
        try {
          console.log('   [CounterpartyRoutes] Fetching Xero contacts using service...');
          const xeroContacts = await fetchXeroContacts();
          console.log('   [CounterpartyRoutes] ✅ Received', xeroContacts.length, 'contacts from service');
          
          // Check which contacts already have invites or links
          const existingInvites = await CounterpartyInvite.find({
            senderCompany: user.company._id,
            erpConnection: connection._id,
            status: { $in: ['pending', 'accepted'] }
          });
          
          const existingLinks = await CompanyLink.find({
            $or: [
              { requestingCompany: user.company._id },
              { targetCompany: user.company._id }
            ],
            erpConnection: connection._id,
            status: 'approved'
          });
          
          // Map contacts with their link status
          const contactsWithStatus = xeroContacts.map(contact => {
            const invite = existingInvites.find(inv => inv.erpContactId === contact.contactID);
            const link = existingLinks.find(lnk => lnk.erpContactId === contact.contactID);
            
            return {
              erpConnectionId: connection._id,
              erpType: 'xero',
              erpContactId: contact.contactID,
              name: contact.name,
              email: contact.emailAddress || '',
              type: contact.isCustomer && contact.isSupplier ? 'both' : 
                    contact.isCustomer ? 'customer' : 'vendor',
              contactNumber: contact.contactNumber || '',
              status: link ? 'linked' : invite ? invite.status : 'unlinked',
              inviteId: invite ? invite._id : null,
              linkId: link ? link._id : null,
              metadata: {
                accountNumber: contact.accountNumber,
                taxNumber: contact.taxNumber,
                bankAccountDetails: contact.bankAccountDetails
              }
            };
          });
          
          allContacts.push(...contactsWithStatus);
        } catch (error) {
          console.error('Error fetching Xero contacts:', error);
        }
      }
      
      // Add other ERP integrations here (QuickBooks, etc.)
    }
    
    res.json({
      success: true,
      contacts: allContacts,
      erpConnections: erpConnections.map(conn => ({
        id: conn._id,
        platform: conn.platform,
        name: conn.connectionName,
        status: conn.status
      }))
    });
  } catch (error) {
    console.error('Error fetching ERP contacts:', error);
    res.status(500).json({ error: 'Failed to fetch ERP contacts' });
  }
});

// Send invitation to counterparty
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const {
      erpConnectionId,
      erpContactId,
      recipientEmail,
      relationshipType,
      message,
      contactDetails
    } = req.body;
    
    // Get user and company
    const user = await User.findById(req.user.id).populate('company');
    if (!user || !user.company) {
      return res.status(400).json({ error: 'User company not found' });
    }
    
    // Verify ERP connection belongs to user's company
    const erpConnection = await ERPConnection.findOne({
      _id: erpConnectionId,
      company: user.company._id
    });
    
    if (!erpConnection) {
      return res.status(404).json({ error: 'ERP connection not found' });
    }
    
    // Check if invitation already exists
    const existingInvite = await CounterpartyInvite.findOne({
      senderCompany: user.company._id,
      erpConnection: erpConnectionId,
      erpContactId,
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingInvite) {
      return res.status(400).json({ 
        error: 'An invitation already exists for this contact',
        invite: existingInvite
      });
    }
    
    // Create invitation
    const invite = new CounterpartyInvite({
      senderCompany: user.company._id,
      senderUser: user._id,
      erpConnection: erpConnectionId,
      erpType: erpConnection.platform.toLowerCase(),
      erpContactId,
      erpContactDetails: contactDetails,
      recipientEmail,
      relationshipType,
      message
    });
    
    await invite.save();
    
    // Send invitation email
    try {
      await sendInvitationEmail({
        to: recipientEmail,
        senderCompanyName: user.company.name,
        contactName: contactDetails.name,
        inviteCode: invite.inviteCode,
        message
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the whole request if email fails
    }
    
    res.json({
      success: true,
      invite: {
        id: invite._id,
        inviteCode: invite.inviteCode,
        status: invite.status,
        recipientEmail: invite.recipientEmail,
        erpContactDetails: invite.erpContactDetails
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get sent invitations
router.get('/invites/sent', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    if (!user || !user.company) {
      return res.status(400).json({ error: 'User company not found' });
    }
    
    const invites = await CounterpartyInvite.find({
      senderCompany: user.company._id
    })
    .populate('erpConnection')
    .sort({ sentAt: -1 });
    
    res.json({
      success: true,
      invites
    });
  } catch (error) {
    console.error('Error fetching sent invites:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Get received invitations
router.get('/invites/received', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Find invites by email or company
    const query = {
      status: 'pending',
      $or: [
        { recipientEmail: user.email }
      ]
    };
    
    if (user.company) {
      query.$or.push({ recipientCompany: user.company });
    }
    
    const invites = await CounterpartyInvite.find(query)
      .populate('senderCompany')
      .populate('erpConnection')
      .sort({ sentAt: -1 });
    
    res.json({
      success: true,
      invites
    });
  } catch (error) {
    console.error('Error fetching received invites:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// =============================================================================
// UPDATED: Accept invitation - NOW REQUIRES RECIPIENT ERP CONTACT INFO
// =============================================================================
router.post('/invite/accept', authenticateToken, async (req, res) => {
  try {
    const { 
      inviteCode, 
      recipientErpConnectionId,  // NEW: Required
      recipientErpContactId      // NEW: Required
    } = req.body;
    
    // Validate required fields
    if (!recipientErpConnectionId || !recipientErpContactId) {
      return res.status(400).json({ 
        error: 'You must select which contact in your accounting system represents the sender',
        requiresErpContact: true
      });
    }
    
    const user = await User.findById(req.user.id).populate('company');
    
    // Find the invitation
    const invite = await CounterpartyInvite.findOne({
      inviteCode,
      status: 'pending'
    });
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }
    
    // Check if user's email matches or if they're part of the recipient company
    if (invite.recipientEmail !== user.email && 
        (!invite.recipientCompany || invite.recipientCompany.toString() !== user.company?._id?.toString())) {
      return res.status(403).json({ error: 'This invitation is for a different recipient' });
    }
    
    // If user doesn't have a company yet, they need to create one first
    if (!user.company) {
      return res.status(400).json({ 
        error: 'Please set up your company profile before accepting invitations',
        requiresCompanySetup: true
      });
    }
    
    // Verify the recipient's ERP connection belongs to their company
    const recipientErpConnection = await ERPConnection.findOne({
      _id: recipientErpConnectionId,
      company: user.company._id,
      status: 'connected'
    });
    
    if (!recipientErpConnection) {
      return res.status(400).json({ 
        error: 'Invalid ERP connection. Please ensure your accounting system is properly connected.' 
      });
    }
    
    // Get recipient's ERP contact details (optional but recommended)
    let recipientErpContactDetails = {};
    try {
      if (recipientErpConnection.platform === 'Xero') {
        const xeroContacts = await fetchXeroContacts(recipientErpConnectionId);
        const matchingContact = xeroContacts.find(c => c.contactID === recipientErpContactId);
        if (matchingContact) {
          recipientErpContactDetails = {
            name: matchingContact.name,
            email: matchingContact.emailAddress || '',
            type: matchingContact.isCustomer && matchingContact.isSupplier ? 'both' : 
                  matchingContact.isCustomer ? 'customer' : 'vendor',
            contactNumber: matchingContact.contactNumber || '',
            metadata: {
              accountNumber: matchingContact.accountNumber,
              taxNumber: matchingContact.taxNumber
            }
          };
        }
      }
    } catch (error) {
      console.warn('Could not fetch recipient ERP contact details:', error);
      // Continue anyway - details are optional
    }
    
    // Accept the invitation with recipient's ERP contact info
    await invite.accept({
      recipientCompanyId: user.company._id,
      recipientErpConnectionId,
      recipientErpContactId,
      recipientErpContactDetails
    });
    
    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      link: await CompanyLink.findOne({
        requestingCompany: invite.senderCompany,
        targetCompany: user.company._id,
        erpConnection: invite.erpConnection,
        erpContactId: invite.erpContactId
      }).populate(['requestingCompany', 'targetCompany'])
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
});

// Reject invitation
router.post('/invite/reject', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    const user = await User.findById(req.user.id);
    
    const invite = await CounterpartyInvite.findOne({
      inviteCode,
      recipientEmail: user.email,
      status: 'pending'
    });
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }
    
    await invite.reject();
    
    res.json({
      success: true,
      message: 'Invitation rejected'
    });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
});

// Cancel invitation (by sender)
router.post('/invite/cancel', authenticateToken, async (req, res) => {
  try {
    const { inviteId } = req.body;
    
    const user = await User.findById(req.user.id).populate('company');
    
    const invite = await CounterpartyInvite.findOne({
      _id: inviteId,
      senderCompany: user.company._id,
      status: 'pending'
    });
    
    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    await invite.cancel();
    
    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

// Get linked counterparties
router.get('/linked', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    if (!user || !user.company) {
      return res.status(400).json({ error: 'User company not found' });
    }
    
    const links = await CompanyLink.find({
      $or: [
        { requestingCompany: user.company._id },
        { targetCompany: user.company._id }
      ],
      status: 'approved'
    })
    .populate(['requestingCompany', 'targetCompany', 'erpConnection', 'targetErpConnection'])
    .sort({ approvedAt: -1 });
    
    // Format the links with counterparty info
    const formattedLinks = links.map(link => {
      const isRequester = link.requestingCompany._id.toString() === user.company._id.toString();
      const counterparty = isRequester ? link.targetCompany : link.requestingCompany;
      
      // Get ERP info for both sides
      const myErpInfo = link.getErpContactForCompany(user.company._id);
      const counterpartyErpInfo = link.getCounterpartyErpContact(user.company._id);
      
      return {
        id: link._id,
        counterparty: {
          id: counterparty._id,
          name: counterparty.name,
          email: counterparty.email
        },
        relationshipType: link.relationshipType,
        myErpConnection: myErpInfo?.erpConnection,
        myErpContactId: myErpInfo?.erpContactId,
        myErpContactDetails: myErpInfo?.erpContactDetails,
        counterpartyErpConnection: counterpartyErpInfo?.erpConnection,
        counterpartyErpContactId: counterpartyErpInfo?.erpContactId,
        counterpartyErpContactDetails: counterpartyErpInfo?.erpContactDetails,
        isFullyLinked: link.isFullyLinked,
        status: link.status,
        permissions: link.permissions,
        stats: link.stats,
        approvedAt: link.approvedAt
      };
    });
    
    res.json({
      success: true,
      links: formattedLinks
    });
  } catch (error) {
    console.error('Error fetching linked counterparties:', error);
    res.status(500).json({ error: 'Failed to fetch linked counterparties' });
  }
});

// Resend invitation email
router.post('/invite/resend', authenticateToken, async (req, res) => {
  try {
    const { inviteId } = req.body;
    
    const user = await User.findById(req.user.id).populate('company');
    
    const invite = await CounterpartyInvite.findOne({
      _id: inviteId,
      senderCompany: user.company._id,
      status: 'pending'
    });
    
    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    // Update reminder tracking
    invite.remindersSent += 1;
    invite.lastReminderAt = new Date();
    await invite.save();
    
    // Send reminder email
    try {
      await sendInvitationEmail({
        to: invite.recipientEmail,
        senderCompanyName: user.company.name,
        contactName: invite.erpContactDetails.name,
        inviteCode: invite.inviteCode,
        message: invite.message,
        isReminder: true
      });
    } catch (emailError) {
      console.error('Error sending reminder email:', emailError);
      return res.status(500).json({ error: 'Failed to send reminder email' });
    }
    
    res.json({
      success: true,
      message: 'Invitation reminder sent'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

export default router;
