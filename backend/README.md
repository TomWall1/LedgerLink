# LedgerLink Backend

🚀 **Backend API for LedgerLink** - The invoice matching platform with Xero integration.

## 🏗️ Architecture

### **Technology Stack**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens + bcrypt
- **Session Management**: MongoDB-backed sessions
- **File Upload**: Multer for CSV processing
- **CSV Parsing**: csv-parser with intelligent column detection
- **ERP Integration**: Xero API with OAuth 2.0
- **Date Processing**: Moment.js for multiple formats

## 📁 Directory Structure

```
backend/
├── index.js              # Express server entry point
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
├── routes/
│   ├── users.js          # User authentication routes
│   ├── xero.js           # Xero OAuth and data fetching
│   └── transactions.js   # CSV processing and matching
├── models/
│   └── User.js           # MongoDB user schema
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── controllers/
│   └── xeroController.js # Xero-specific business logic
└── uploads/              # Temporary file storage (auto-created)
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- MongoDB (local or Atlas)
- Xero Developer App credentials

### **Installation**
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Required
MONGODB_URI=mongodb://localhost:27017/ledgerlink
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://ledgerlink.onrender.com/api/xero/callback
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key
FRONTEND_URL=https://lledgerlink.vercel.app

# Optional
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

## 📚 API Endpoints

### **🔐 Authentication**
- `POST /api/users/register` - Create new user account
- `POST /api/users/login` - User login with JWT
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `DELETE /api/users/account` - Delete user account

### **🔗 Xero Integration**
- `GET /api/xero/connect` - Initiate OAuth 2.0 flow
- `GET /api/xero/callback` - OAuth callback handler
- `GET /api/xero/auth-status` - Check connection status
- `POST /api/xero/disconnect` - Disconnect from Xero
- `GET /api/xero/customers` - Fetch all customers
- `GET /api/xero/customers/:id/invoices` - Get customer invoices
- `GET /api/xero/organization` - Get organization details

### **📊 Transaction Processing**
- `POST /api/transactions/match-customer-invoices` - Upload CSV and find matches
- `POST /api/transactions/approve-customer-match` - Approve a match

### **🏥 System Health**
- `GET /` - API health check
- `GET /health` - Detailed system status

## 🧠 Smart Matching Algorithm

Our sophisticated matching engine uses **weighted confidence scoring**:

### **Confidence Components**
1. **Amount Matching (50% weight)**
   - Exact match: 50 points
   - Within 5% tolerance: 30 points
   - Within 10% tolerance: 15 points

2. **Date Proximity (30% weight)**
   - Within 7 days: 30 points
   - Within 14 days: 20 points
   - Within 30 days: 10 points

3. **Reference Matching (20% weight)**
   - Exact reference match: 20 points
   - Partial similarity >50%: 10 points

### **CSV Column Detection**
Automatically identifies columns using these mappings:
- **Amount**: `amount`, `value`, `total`, `payment_amount`, `sum`, `cost`, `price`
- **Date**: `date`, `transaction_date`, `invoice_date`, `payment_date`, `timestamp`
- **Reference**: `reference`, `transaction_number`, `id`, `invoice_number`, `ref`
- **Description**: `description`, `memo`, `note`, `particulars`, `details`

### **Supported Date Formats**
- `DD/MM/YYYY` (Australian standard)
- `MM/DD/YYYY` (American)
- `YYYY-MM-DD` (ISO standard)
- `DD-MM-YYYY`, `MM-DD-YYYY`, `DD.MM.YYYY`

## 🔒 Security Features

### **Authentication & Authorization**
- JWT tokens with 7-day expiration
- bcrypt password hashing with salt rounds
- Secure session management with MongoDB storage
- CORS protection for specific origins

### **Data Protection**
- Input validation on all endpoints
- File upload restrictions (CSV only, 10MB limit)
- Automatic temporary file cleanup
- Error handling without information leakage

### **Xero Integration Security**
- OAuth 2.0 with secure token refresh
- Session-based token storage
- Automatic token expiration handling
- Minimal permission scopes

## 🚀 Production Deployment

### **Render.com Setup**
1. Connect GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Configure environment variables
5. Deploy!

### **MongoDB Atlas**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ledgerlink?retryWrites=true&w=majority
```

### **Xero Developer Setup**
1. Create app at https://developer.xero.com/
2. Set redirect URI to your Render URL
3. Copy Client ID and Secret to environment

## 📊 Performance & Monitoring

### **Health Checks**
- Database connection status
- Memory usage monitoring
- Uptime tracking
- Request/response logging

### **Error Handling**
- Comprehensive error logging
- Graceful shutdown on SIGTERM/SIGINT
- Development vs production error responses
- Automatic file cleanup on errors

## 🔄 CSV Processing Flow

1. **File Upload** → Multer handles multipart/form-data
2. **Validation** → File type and size checks
3. **Column Detection** → Intelligent header mapping
4. **Data Parsing** → Extract transactions with date formatting
5. **Xero Data Fetch** → Get customer invoices via API
6. **Matching Algorithm** → Calculate confidence scores
7. **Result Sorting** → Highest confidence first
8. **Response** → JSON with matches and summary
9. **Cleanup** → Temporary file deletion

## 🐛 Troubleshooting

### **Common Issues**
- **MongoDB Connection**: Check URI format and network access
- **Xero OAuth**: Verify redirect URI matches exactly
- **File Upload**: Ensure CSV format and size limits
- **CORS Errors**: Check frontend URL in CORS configuration

### **Development Tools**
```bash
# Start with hot reload
npm run dev

# Check logs
tail -f logs/app.log

# Test endpoints
curl http://localhost:5000/health
```

## 📈 Scaling Considerations

- **Database**: MongoDB Atlas with replica sets
- **File Storage**: Consider AWS S3 for production file handling
- **Rate Limiting**: Implement for Xero API calls
- **Caching**: Redis for session storage at scale
- **Load Balancing**: Multiple Render instances

---

**Built with ❤️ for the Australian accounting community**