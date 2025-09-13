# LedgerLink - Automated Account Reconciliation

LedgerLink is a comprehensive solution for automating invoice matching and account reconciliation between businesses and their customers/vendors.

## 🚀 Features

- **Automated Matching**: AI-powered invoice matching with confidence scoring
- **ERP Integration**: Connect with Xero, QuickBooks, Sage, and other accounting systems
- **CSV Upload**: Manual data upload for immediate matching without system integration
- **Counterparty Collaboration**: Invite customers/vendors to link their systems
- **Comprehensive Reporting**: Export detailed reconciliation reports in PDF and CSV
- **Real-time Dashboard**: Monitor matching progress and system health

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router
- **State Management**: React Hooks
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with OAuth 2.0 for ERP integrations
- **Security**: Helmet, CORS, Rate limiting
- **Deployment**: Render

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TomWall1/LedgerLink.git
   cd LedgerLink
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002
   - Health check: http://localhost:3002/health

## 🌐 Deployment

### Production URLs
- **Frontend**: https://ledgerlink.vercel.app/
- **Backend API**: https://ledgerlink.onrender.com

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ledgerlink

# Server
PORT=3002
NODE_ENV=production
FRONTEND_URL=https://ledgerlink.vercel.app

# Security
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# ERP Integrations
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=https://ledgerlink.onrender.com
VITE_API_BASE_URL=https://ledgerlink.onrender.com/api

# App Configuration
VITE_APP_NAME=LedgerLink
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
LedgerLink/
├── backend/
│   ├── index.js              # Express server setup
│   ├── package.json          # Backend dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Base UI components (Button, Input, etc.)
│   │   │   └── layout/      # Layout components (TopNav, Sidebar)
│   │   ├── pages/           # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── Connections.tsx
│   │   │   ├── Counterparties.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Login.tsx
│   │   ├── styles/          # Global styles
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # App entry point
│   ├── public/
│   ├── index.html
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite build configuration
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563eb) - Main brand color for CTAs and navigation
- **Success**: Green (#16a34a) - Successful matches and positive states
- **Warning**: Amber (#d97706) - Partial matches and caution states
- **Error**: Red (#dc2626) - Unmatched items and error states
- **Neutral**: Grays (#404040 to #fafafa) - Text and background colors

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: h1, h2, h3, body-lg, body, small, tiny
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Components
All UI components follow a consistent design system with:
- Consistent spacing (4px base unit)
- Smooth transitions (120ms/240ms durations)
- Focus states for accessibility
- Hover states for interactive elements
- Loading and error states

## 🔧 Key Features

### 1. Invoice Matching Engine
- Fuzzy matching algorithms for invoice numbers
- Amount tolerance configuration
- Date range matching
- Confidence scoring (0-100%)
- Manual review for partial matches

### 2. ERP Integrations
- OAuth 2.0 secure authentication
- Real-time data synchronization
- Support for multiple accounting systems:
  - Xero
  - QuickBooks Online
  - Sage 50cloud
  - NetSuite (planned)
  - SAP (planned)
  - Microsoft Dynamics (planned)

### 3. Counterparty Management
- Secure invitation system
- Read-only data sharing
- Real-time reconciliation status
- Communication history tracking

### 4. Reporting & Analytics
- Reconciliation summary reports
- Detailed matching analysis
- Discrepancy identification
- Audit trail generation
- Export to PDF and CSV

## 🔒 Security

- **Authentication**: JWT tokens with secure session management
- **Authorization**: Role-based access control
- **Data Encryption**: TLS 1.3 for data in transit
- **API Security**: Rate limiting, CORS, Helmet.js
- **Database Security**: MongoDB connection encryption
- **Audit Trail**: Complete activity logging

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test        # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Backend Testing
```bash
cd backend
npm test           # Run test suite
npm run test:watch # Watch mode
npm run test:integration # Integration tests
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect GitHub repository to Render
2. Configure environment variables
3. Set build command: `npm install`
4. Set start command: `npm start`

## 📊 Monitoring

- **Health Checks**: `/health` and `/test/db` endpoints
- **Error Logging**: Console and file-based logging
- **Performance**: Response time monitoring
- **Uptime**: Service availability tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: [Coming Soon]
- **Email**: support@ledgerlink.com
- **Issues**: GitHub Issues tab

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core matching engine
- ✅ Basic ERP integrations (Xero)
- ✅ CSV upload functionality
- ✅ User management
- ✅ Basic reporting

### Phase 2 (Q2 2024)
- 🔄 Additional ERP integrations (QuickBooks, Sage)
- 🔄 Advanced matching algorithms
- 🔄 Mobile application
- 🔄 API for third-party integrations

### Phase 3 (Q3 2024)
- 📋 Machine learning for matching improvement
- 📋 Automated reconciliation workflows
- 📋 Multi-currency support
- 📋 Advanced analytics dashboard

### Phase 4 (Q4 2024)
- 📋 Enterprise features
- 📋 White-label solution
- 📋 Advanced audit and compliance tools
- 📋 Integration marketplace

---

**Built with ❤️ by the LedgerLink team**

For questions or support, reach out to us at [support@ledgerlink.com](mailto:support@ledgerlink.com)