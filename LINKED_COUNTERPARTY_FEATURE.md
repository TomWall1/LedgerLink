# Linked Counterparty Feature - Implementation Guide

## 🎉 What's New

The Matches page now **automatically detects and suggests linked counterparties**! When you load data for a customer in Step 2, the system checks if that customer has a linked counterparty account and offers to automatically load their data.

---

## 🔗 How It Works (Simple Explanation)

Think of it like your phone's contact list with linked accounts:
- You have "ABC Company" in your system
- They also use LedgerLink and have connected their Xero account
- When you select "ABC Company" as Data Source 1, we automatically detect they're linked
- **A special card appears** offering to load their data with one click!

---

## 📦 What Was Added

### 1. **New Component: LinkedCounterpartyCard**
   - **File**: `frontend/src/components/matching/workflow/LinkedCounterpartyCard.tsx`
   - **What it does**: Beautiful card that shows when a linked counterparty is found
   - **Features**:
     - 🔗 Link icon and "Linked Counterparty Found!" heading
     - Shows the customer name and linked counterparty name
     - Displays connection type (Xero, QuickBooks, etc.)
     - Lists benefits: Automatic loading, real-time matching, saves time
     - Two buttons: [Use Linked Account] [Choose Different Source]

### 2. **New Service: counterpartyService**
   - **File**: `frontend/src/services/counterpartyService.ts`
   - **What it does**: Handles API calls to check for linked counterparties
   - **Features**:
     - `getLinkedCounterparty()` - Check if customer has a linked account
     - `getLinkedCounterpartyWithFallback()` - Checks API, falls back to demo data
     - `getMockLinkedCounterparty()` - Demo mode (works before backend is ready)
     - Ready for future features: create links, remove links, search counterparties

### 3. **Updated: Matches Page**
   - **File**: `frontend/src/pages/Matches.tsx`
   - **What changed**:
     - Automatically checks for linked counterparties when Data Source 1 is loaded
     - Shows LinkedCounterpartyCard if found
     - Handles "Use Linked Account" button click
     - Handles "Choose Different Source" to bypass the suggestion
     - Falls back to normal workflow if no linked counterparty

---

## 🎯 User Flow

### **Scenario 1: With Linked Counterparty**

1. **User selects AR** (Accounts Receivable)
2. **Chooses "Xero" for Data Source 1**
3. **Selects "ABC Corporation"** from customer dropdown
4. **Clicks "Load Data"** → System loads 15 invoices
5. **✨ MAGIC HAPPENS**: System checks for linked counterparties
6. **Special card appears**:
   ```
   🔗 Linked Counterparty Found!
   
   ABC Corporation is linked with:
   ABC Corporation Supplier Portal (Xero Account) ✓ Connected
   
   Benefits:
   ✓ Automatic data loading from their system
   ✓ Real-time invoice matching
   ✓ Saves time - no CSV upload needed
   
   [Use Linked Account]  [Choose Different Source]
   ```
7. **User clicks "Use Linked Account"**
8. **System automatically loads** counterparty's invoices (12 invoices)
9. **"Ready to Match!" card appears**
10. **User clicks "Start Matching"** and gets results!

### **Scenario 2: No Linked Counterparty**

1-4. Same as above
5. **System checks** for linked counterparties
6. **No linked counterparty found**
7. **Normal dropdown appears**: "Choose counterparty data source"
8. User proceeds with manual selection (Xero or CSV)

### **Scenario 3: User Bypasses Linked Suggestion**

1-6. Same as Scenario 1 (card appears)
7. **User clicks "Choose Different Source"**
8. **Card disappears**, normal dropdown appears
9. User can choose any data source they want

---

## 🎨 Design Details

The LinkedCounterpartyCard features:
- **Gradient background**: Primary blue gradient (#f0f7ff to #e0efff)
- **Big link icon**: 🔗 in a blue circle
- **Clear sections**:
  - Header with "Linked Counterparty Found!" title
  - White card showing the relationship
  - Benefits list with green checkmarks
  - Two action buttons (primary and secondary)
- **Connection badge**: "Connected" badge for Xero accounts
- **Loading states**: Spinner appears while loading data

---

## 🔧 Technical Details

### **How Detection Works**

```typescript
// When Data Source 1 is loaded:
useEffect(() => {
  if (dataSource1 && dataSource1.customerId) {
    // Check for linked counterparty
    const linked = await counterpartyService.getLinkedCounterpartyWithFallback(
      dataSource1.customerId,
      dataSource1.customerName
    );
    
    if (linked) {
      setLinkedCounterparty(linked);  // Show the card
    }
  }
}, [dataSource1]);
```

### **Demo Mode (Before Backend is Ready)**

The service includes mock data for testing:
- If you select "ABC Corporation", it finds a mock linked counterparty
- If you select "XYZ Ltd", it finds another mock linked counterparty
- Other customers show no linked counterparty (normal workflow)

This lets you test the UI immediately, even before the backend API is built!

### **Backend API Endpoints (To Be Implemented)**

The frontend is ready for these endpoints:

```
GET  /api/counterparties/linked/:contactId
     - Check if a customer has a linked counterparty
     - Returns: LinkedCounterparty object or null

GET  /api/counterparties/relationships
     - Get all counterparty relationships for current user
     - Returns: Array of relationships

POST /api/counterparties/link
     - Create a new counterparty link
     - Body: { customerId, customerName, counterpartyId, counterpartyName, relationshipType }

DELETE /api/counterparties/link/:relationshipId
     - Remove a counterparty link

GET /api/counterparties/search?query=abc
     - Search for potential counterparties
     - Returns: Array of LinkedCounterparty objects
```

---

## 📊 Data Structure

### LinkedCounterparty Interface

```typescript
interface LinkedCounterparty {
  id: string;                    // Unique ID
  name: string;                  // Display name
  organizationName?: string;     // Company name
  connectionType: 'xero' | 'quickbooks' | 'manual';
  email?: string;                // Contact email
  xeroContactId?: string;        // Xero ID if connected
  quickbooksCustomerId?: string; // QuickBooks ID if connected
  lastSyncDate?: string;         // Last sync timestamp
  status: 'active' | 'inactive' | 'pending';
}
```

---

## 🧪 Testing the Feature

### **Test Now (With Demo Data)**

1. Go to Matches page
2. Select "AR"
3. Choose "Xero" for Data Source 1
4. Look for customers named:
   - **"ABC Corporation"** ← Has mock linked counterparty
   - **"XYZ Ltd"** ← Has mock linked counterparty
5. Load data for one of these
6. Watch the special card appear!
7. Click "Use Linked Account" to see it auto-load
8. Or click "Choose Different Source" to use manual selection

### **Test Later (With Real Backend)**

Once you implement the backend API:
1. The service will automatically use the real API
2. Mock data will be ignored
3. Real counterparty relationships will be detected
4. Everything else works the same!

---

## 🚀 Future Enhancements

The infrastructure is ready for:

1. **Manage Counterparties Page**
   - View all linked counterparties
   - Add new links manually
   - Remove existing links
   - Invite counterparties to link their accounts

2. **Bidirectional Linking**
   - Customer sends invite to supplier
   - Supplier accepts and links their account
   - Both sides can now auto-match

3. **QuickBooks Support**
   - Same workflow for QuickBooks connections
   - Just need to add QuickBooks integration

4. **Manual Links**
   - Link counterparties who aren't on LedgerLink yet
   - Store their details for future use

---

## ⚙️ Configuration

### **Enable/Disable Feature**

To temporarily disable linked counterparty detection:

```typescript
// In Matches.tsx, comment out this useEffect:
useEffect(() => {
  // checkLinkedCounterparty...
}, [dataSource1]);
```

### **Change Demo Data**

To add more mock linked counterparties:

```typescript
// In counterpartyService.ts, add to this object:
const mockLinkedCounterparties: Record<string, LinkedCounterparty> = {
  'Your Customer Name': {
    id: 'mock-cp-3',
    name: 'Their Company Name',
    organizationName: 'Their Org Ltd',
    connectionType: 'xero',
    email: 'finance@example.com',
    xeroContactId: 'xero-id-123',
    status: 'active',
  },
};
```

---

## 🎓 For Developers

### **Adding Backend Support**

When you're ready to implement the backend:

1. Create routes in `backend/src/routes/counterpartyRoutes.js`
2. Add controller logic for checking links
3. Store relationships in MongoDB
4. The frontend will automatically use the real API!

### **Adding More Connection Types**

To support QuickBooks or other ERPs:

1. Update `LinkedCounterparty` interface:
   ```typescript
   connectionType: 'xero' | 'quickbooks' | 'sap' | 'manual';
   ```

2. Update `LinkedCounterpartyCard` to show appropriate icons

3. Add fetching logic in the service

---

## ✅ Summary

**What You Can Do Now:**
- ✅ Automatically detect linked counterparties (with demo data)
- ✅ Show beautiful suggestion card
- ✅ One-click load linked account data
- ✅ Option to bypass and choose manually
- ✅ Smooth integration with existing workflow

**What's Next:**
- 🔨 Implement backend API endpoints
- 🔨 Build Counterparties management page
- 🔨 Add invite/accept workflow
- 🔨 Support bidirectional linking

**Impact:**
- ⚡ **Faster matching** - No need to manually find counterparty data
- 🎯 **Better UX** - Smart suggestions guide the user
- 🤝 **Network effects** - More linked accounts = more value
- 💪 **Future-proof** - Infrastructure ready for growth

---

## 🎉 It's Live!

Visit **https://ledgerlink.vercel.app/** and try it out! Select a customer named "ABC Corporation" or "XYZ Ltd" to see the linked counterparty suggestion in action.
