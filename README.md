# LedgerLink - Invoice Matching Platform

🚀 **LedgerLink** is a sophisticated invoice matching platform that automates the reconciliation of CSV transaction data with ERP systems like Xero.

## ✨ Features

### 🎯 **Core Functionality**
- **Smart CSV Processing**: Upload and parse CSV files with automatic column detection
- **Xero Integration**: Secure OAuth 2.0 connection to import customers and invoices
- **Intelligent Matching**: AI-powered matching algorithm with confidence scoring
- **3-Panel Workflow**: Streamlined customer → upload → review process
- **User Authentication**: Secure account management with JWT tokens

### 📊 **Matching Algorithm**
Our sophisticated matching engine uses weighted confidence scoring:
- **Amount Matching (50%)**: Exact or near-exact invoice amounts
- **Date Proximity (30%)**: Transaction dates within 7-30 days of invoice dates
- **Reference Matching (20%)**: Invoice numbers in transaction references

### 🎨 **User Experience**
- **Modern Interface**: Clean, responsive design with Tailwind CSS
- **Australian Focus**: DD/MM/YYYY date formats and AUD currency by default
- **Drag & Drop**: Easy file uploads with format validation
- **Color-Coded Results**: Green/Yellow/Red confidence indicators

## 🏗️ **Architecture**

### **Frontend** (React + Vercel)
- React 18 with hooks and context
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Deployed on Vercel

### **Backend** (Node.js + Render)
- Express.js server
- MongoDB with Mongoose
- Xero API integration
- JWT authentication
- Session management
- Deployed on Render

## 🚦 **Getting Started**

### **Prerequisites**
- Node.js 18+
- MongoDB (local or Atlas)
- Xero Developer Account

### **Environment Setup**
```bash
# Clone the repository
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink

# Backend setup
cp .env.example .env
# Edit .env with your configuration

npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm start
```

### **Required Environment Variables**
```env
MONGODB_URI=your-mongodb-connection-string
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

## 📁 **CSV File Requirements**

Your CSV files should include these columns:

### **Required Columns**
- **Amount**: `amount`, `value`, `total`, `payment_amount`
- **Date**: `date`, `transaction_date`, `invoice_date`, `payment_date`
- **Reference**: `reference`, `transaction_number`, `id`, `invoice_number`

### **Optional Columns**
- **Description**: `description`, `memo`, `note`, `particulars`
- **Status**: `status`, `state`

### **Supported Date Formats**
- DD/MM/YYYY (Australian)
- MM/DD/YYYY (American)
- YYYY-MM-DD (ISO)
- DD-MM-YYYY, MM-DD-YYYY, DD.MM.YYYY

## 🔐 **Security Features**

- **OAuth 2.0**: Secure Xero API integration
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: MongoDB-backed sessions
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Comprehensive data sanitization

## 🌐 **API Endpoints**

### **Authentication**
- `POST /api/users/register` - Create new account
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user

### **Xero Integration**
- `GET /api/xero/connect` - Initiate OAuth flow
- `GET /api/xero/callback` - OAuth callback
- `GET /api/xero/customers` - Fetch Xero customers
- `GET /api/xero/customers/:id/invoices` - Get customer invoices

### **Transaction Processing**
- `POST /api/transactions/match-customer-invoices` - Upload and match CSV
- `POST /api/transactions/approve-customer-match` - Approve matches

## 📊 **Live Deployment**

- **Frontend**: https://lledgerlink.vercel.app/
- **Backend**: https://ledgerlink.onrender.com/
- **Repository**: https://github.com/TomWall1/LedgerLink

## 🛠️ **Technology Stack**

### **Frontend Technologies**
- React 18, React Router, Tailwind CSS
- Axios, Context API, Custom Hooks

### **Backend Technologies**
- Node.js, Express.js, MongoDB, Mongoose
- JWT, bcrypt, xero-node, multer, csv-parser

### **DevOps & Deployment**
- Vercel (Frontend), Render (Backend)
- MongoDB Atlas, GitHub Actions ready

## 🎯 **Use Cases**

### **For Accounting Firms**
- Automate client invoice reconciliation
- Reduce manual data entry errors
- Process multiple client files efficiently

### **For Businesses**
- Match bank statements with Xero invoices
- Streamline accounts receivable processes
- Improve cash flow visibility

### **For Bookkeepers**
- Bulk process transaction matching
- Generate reconciliation reports
- Maintain audit trails

## 📈 **Roadmap**

- [ ] **Multi-ERP Support**: QuickBooks, MYOB, SAP integrations
- [ ] **Advanced Analytics**: Matching success rate dashboards
- [ ] **Bulk Operations**: Process multiple customers simultaneously
- [ ] **API Rate Limiting**: Enterprise-grade performance
- [ ] **Audit Logging**: Comprehensive activity tracking
- [ ] **White-label Options**: Custom branding capabilities

## 🤝 **Contributing**

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📜 **License**

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the Australian accounting community**