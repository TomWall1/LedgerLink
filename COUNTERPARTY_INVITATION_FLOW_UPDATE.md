# Counterparty Invitation Flow - Updated

## Summary of Changes

The counterparty invitation system has been completely redesigned to properly connect invitations with specific customers and vendors from your accounting system (ERP). This ensures that when a counterparty accepts an invitation, LedgerLink knows exactly which business relationship to reconcile.

---

## What Changed

### **Before (Old Flow)**
1. Click "Invite Counterparty"
2. Manually enter name and email
3. ❌ **Problem**: Invitation wasn't linked to anyone in your accounting system
4. ❌ **Problem**: No actual emails were being sent

### **After (New Flow)**
1. System automatically fetches all customers and vendors from connected accounting systems
2. You see a complete list with their current status (Not Invited, Invited, or Linked)
3. Click "Invite" next to the specific contact you want to connect with
4. Their details (name, email, type) are pre-filled from your accounting system
5. Add an optional personal message
6. Send invitation
7. ✅ **Fixed**: Invitation is now properly linked to that specific customer/vendor in your ERP
8. ⚠️ **Note**: Email sending still needs configuration (addressed separately)

---

## New Features

### 1. **ERP Contact Integration**
- Automatically fetches customers and vendors from all connected accounting systems
- Shows which system each contact comes from (Xero, QuickBooks, etc.)
- Updates in real-time when you connect new accounting systems

### 2. **Status Tracking**
The system now shows four clear statuses for each contact:
- **Not Invited**: Contact from your ERP that hasn't been invited yet
- **Invited**: Invitation sent, waiting for them to accept
- **Linked**: Counterparty has accepted and connected their system
- **No Email**: Contact exists in ERP but has no email address

### 3. **Smart Filtering**
- Search by name or email
- Filter by type (Customer, Vendor, or Both)
- Filter by status (All, Not Invited, Invited, Linked)
- Refresh button to reload contacts from accounting system

### 4. **Better Stats Dashboard**
Four cards showing:
- Total Contacts (all customers/vendors from your ERP)
- Linked (successfully connected counterparties)
- Invited (pending invitations)
- Not Invited (contacts you haven't reached out to yet)

---

## How It Works for Multiple ERPs

The system is designed to work with any accounting system you connect:

### **Current Support**
- ✅ Xero (fully integrated)

### **Future Support (built-in architecture)**
When you connect additional systems like:
- QuickBooks Online
- Sage Business Cloud
- NetSuite
- MYOB
- Any other ERP

The contacts from these systems will automatically appear in the same list, with a badge showing which system they're from.

### **Technical Architecture**
```
User connects ERP → Backend fetches contacts → Contacts appear in list
                  ↓
                Multiple ERPs can be connected simultaneously
                  ↓
All contacts from all systems shown in one unified view
```

---

## User Experience Flow

### **First Time User (No ERP Connected)**
1. Opens Counterparties page
2. Sees message: "Connect Your Accounting System"
3. Clicks button to go to Integrations page
4. Connects Xero (or other ERP)
5. Returns to Counterparties - now sees all their customers/vendors

### **Regular Use**
1. Opens Counterparties page
2. Sees list of all customers/vendors from accounting system
3. Uses search/filters to find specific contacts
4. Clicks "Invite" next to contact name
5. Reviews pre-filled information
6. Adds optional personal message
7. Sends invitation
8. Contact receives email with secure invitation code
9. Status updates to "Invited"
10. When they accept, status updates to "Linked"

---

## API Endpoints Used

### **GET** `/api/counterparty/erp-contacts`
Fetches all customers and vendors from connected ERPs
- Returns contact details (name, email, type)
- Includes current invitation/link status
- Shows which ERP each contact is from

### **POST** `/api/counterparty/invite`
Sends invitation to specific ERP contact
- Requires: `erpConnectionId`, `erpContactId`, `recipientEmail`
- Creates invitation record linked to ERP contact
- Triggers email to recipient (once email service is configured)

### **POST** `/api/counterparty/invite/resend`
Resends invitation reminder to contact
- Updates reminder tracking
- Sends follow-up email

---

## Database Structure

Each invitation is now properly linked:
```
Invitation
├── senderCompany (your company)
├── recipientEmail (counterparty email)
├── erpConnection (which accounting system)
├── erpContactId (specific customer/vendor ID in that system)
└── erpContactDetails (name, email, type cached from ERP)
```

This means when the invitation is accepted, LedgerLink knows:
- Which company sent the invitation
- Which company accepted it
- Which accounting systems to match
- Which specific customer/vendor relationship to reconcile

---

## Next Steps

### ✅ **Completed**
- ERP contact fetching and display
- Proper invitation linking to ERP contacts
- Multi-ERP architecture
- Status tracking and filtering

### ⚠️ **Still To Do**
- **Email Service Configuration**: Currently emails are logged but not sent
  - Need to configure SendGrid or similar service
  - Add email templates
  - Test email delivery

### 🔮 **Future Enhancements**
- Bulk invite multiple contacts at once
- Import contacts from CSV for non-ERP users
- Invitation expiry and automatic reminders
- Contact sync scheduling

---

## Testing the New Flow

1. **Make sure you have Xero connected**
   - Go to Integrations page
   - Connect your Xero account
   - Authorize read-only access

2. **Visit Counterparties page**
   - Should see all your Xero customers and vendors
   - Stats should show correct counts

3. **Invite a contact**
   - Find a contact with an email address
   - Click "Invite" button
   - Review pre-filled details
   - Add optional message
   - Click "Send Invitation"

4. **Check status**
   - Contact status should update to "Invited"
   - Can resend invitation if needed
   - Email will be sent once email service is configured

---

## Benefits of This Approach

### **For Users**
- ✅ No manual data entry
- ✅ Always in sync with accounting system
- ✅ Clear visibility of invitation status
- ✅ Can't accidentally invite wrong person

### **For System**
- ✅ Proper data linkage for reconciliation
- ✅ Scalable to multiple ERPs
- ✅ Maintains referential integrity
- ✅ Supports future features (bulk actions, automation, etc.)

### **For Business**
- ✅ Faster onboarding of counterparties
- ✅ Reduced errors in reconciliation
- ✅ Better tracking and reporting
- ✅ Professional user experience
