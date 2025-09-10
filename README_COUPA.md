# 🔗 LedgerLink + Coupa Integration

Direct API integration between LedgerLink and Coupa for automated invoice reconciliation.

## 🎯 Quick Start

1. **Get Coupa credentials** from your admin
2. **Install dependencies**: `npm install axios` (in backend folder)
3. **Configure environment** variables in `.env`
4. **Restart servers** and test connection
5. **Start fetching data** automatically!

## 📋 What's Included

### Backend Services
- `coupaAuth.js` - Handles Coupa authentication (API key or OAuth)
- `coupaService.js` - Fetches data from Coupa APIs
- `coupaTransformer.js` - Converts Coupa data to LedgerLink format
- `coupaIntegration.js` - API routes for frontend to call

### Frontend Components
- `CoupaConnection.js` - User interface for connecting to Coupa
- `CoupaDataPreview.js` - Preview and select data before importing

### Configuration
- `.env.example` - Template for environment variables
- `coupa.config.js` - Integration settings and mappings

## 🚀 Features

- ✅ **Direct API Connection** - No more CSV uploads
- ✅ **Real-time Data** - Always get the latest invoices and approvals
- ✅ **Data Preview** - See what you're importing before processing
- ✅ **Flexible Authentication** - Supports API keys and OAuth 2.0
- ✅ **Error Handling** - Comprehensive error messages and retry logic
- ✅ **Rate Limiting** - Respects Coupa's API limits
- ✅ **Data Transformation** - Automatically converts to LedgerLink format

## 📊 Supported Data Types

- **Invoices** - Invoice details, amounts, dates, vendors
- **Invoice Approvals** - Approval status, approvers, dates
- **Suppliers** - Vendor information and contact details

## 🛠️ Setup Guide

See the detailed setup guide: [COUPA_INTEGRATION_SETUP.md](docs/COUPA_INTEGRATION_SETUP.md)

## 🔒 Security

- Credentials stored in environment variables
- Read-only access to Coupa data
- No sensitive data logged
- HTTPS-only communication

## 📈 Benefits

- **Save Time** - No more manual CSV exports and uploads
- **Reduce Errors** - Direct API connection eliminates manual data entry
- **Stay Current** - Always working with the latest data
- **Better Insights** - More frequent reconciliation cycles

## 🆘 Support

If you need help:
1. Check the [Setup Guide](docs/COUPA_INTEGRATION_SETUP.md)
2. Look at browser console errors (F12)
3. Check backend server logs
4. Verify credentials with your Coupa admin

## 🔄 Workflow

1. **Connect** - Enter Coupa credentials and test connection
2. **Fetch** - Choose data type and date range
3. **Preview** - Review fetched data in table or card view
4. **Select** - Choose which records to import
5. **Import** - Process selected data for reconciliation
6. **Reconcile** - Use LedgerLink's normal reconciliation features

---

*This integration was designed for finance professionals - no coding experience required!* 💼