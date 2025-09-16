# LedgerLink

**Streamline your ledger reconciliation with automated matching and ERP integrations**

LedgerLink is a modern web application that helps businesses automate their ledger reconciliation process by connecting with popular ERP systems like Xero, QuickBooks, and NetSuite.

## 🚀 Features

### Core Functionality
- **Automated Transaction Matching**: Intelligent algorithms to match transactions across different systems
- **CSV Import/Export**: Import transaction data from various sources
- **Real-time Reconciliation**: Live matching and reconciliation status
- **Multi-Company Support**: Manage reconciliation for multiple business entities

### ERP Integrations
- **Xero Integration**: Full OAuth 2.0 integration with automatic data sync
- **QuickBooks**: Coming soon
- **NetSuite**: Coming soon
- **Custom APIs**: Extensible integration framework

### User Experience
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Updates**: Live status updates and notifications
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessible**: WCAG 2.1 AA compliant interface

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hooks** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Redis** for caching and rate limiting
- **JWT** for authentication
- **OAuth 2.0** for ERP integrations

### Infrastructure
- **Docker** for containerization
- **Vercel** for frontend hosting
- **Render** for backend hosting
- **MongoDB Atlas** for database
- **Redis Cloud** for caching

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance
- Redis instance (optional, for caching)
- Xero Developer Account (for Xero integration)

### Quick Start

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
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your API URL
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002

### Docker Setup

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **With development tools**
   ```bash
   docker-compose --profile tools up -d
   ```

This will start:
- MongoDB with MongoDB Express (http://localhost:8081)
- Redis with Redis Commander (http://localhost:8082)
- Backend API (http://localhost:3002)
- Frontend (http://localhost:3000)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Application
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ledgerlink
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Xero Integration
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3002/api/xero/callback
```

#### Frontend (.env.local)
```bash
REACT_APP_API_URL=http://localhost:3002/api
```

### Xero Integration Setup

1. **Create Xero App**
   - Visit [Xero Developer Portal](https://developer.xero.com/app/manage)
   - Create a new "Custom Connection" app
   - Set redirect URI to your backend callback endpoint

2. **Configure OAuth**
   - Copy Client ID and Client Secret to your .env file
   - Set redirect URI: `{BACKEND_URL}/api/xero/callback`
   - Configure scopes: `accounting.transactions`, `accounting.contacts`

## 📊 API Documentation

### Authentication
```bash
# Login (replace with your auth endpoint)
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### Xero Integration
```bash
# Initiate Xero connection
GET /api/xero/auth?companyId={companyId}

# Get connections
GET /api/xero/connections
Authorization: Bearer {token}

# Get invoices
GET /api/xero/invoices?connectionId={connectionId}
Authorization: Bearer {token}

# Sync data
POST /api/xero/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "connectionId": "connection_id"
}
```

### Health Checks
```bash
# Basic health
GET /health

# Detailed health
GET /health/detailed
Authorization: Bearer {token}

# Xero integration health
GET /health/xero
Authorization: Bearer {token}
```

## 🔒 Security

- **Token Encryption**: All OAuth tokens encrypted at rest using AES-256
- **Rate Limiting**: API endpoints protected with configurable rate limits
- **HTTPS Only**: Production deployment requires HTTPS
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: All API inputs validated and sanitized
- **Error Handling**: Secure error messages without sensitive data exposure

## 🚀 Deployment

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions including:
- Docker production setup
- Nginx configuration
- SSL certificate setup
- Database optimization
- Monitoring and logging

### Quick Deploy Links

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TomWall1/LedgerLink&project-name=ledgerlink-frontend&repository-name=LedgerLink)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TomWall1/LedgerLink)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Tests
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

## 📈 Monitoring

### Health Checks
- `/health` - Basic application health
- `/health/detailed` - Comprehensive system status
- `/health/database` - Database connectivity and performance
- `/health/xero` - Xero integration status

### Metrics
- Application performance metrics
- Database connection pooling stats
- Xero API usage and rate limiting
- Error rates and response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow semantic commit messages
- Ensure all CI checks pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Getting Help
- 📧 Email: support@ledgerlink.com
- 💬 Discord: [LedgerLink Community](https://discord.gg/ledgerlink)
- 📖 Documentation: [docs.ledgerlink.com](https://docs.ledgerlink.com)
- 🐛 Issues: [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core reconciliation engine
- ✅ Xero integration
- ✅ Modern React UI
- ✅ Docker deployment

### Phase 2 (Q2 2025)
- 🔄 QuickBooks integration
- 🔄 Advanced matching algorithms
- 🔄 Bulk operations
- 🔄 Export/reporting features

### Phase 3 (Q3 2025)
- 🔄 NetSuite integration
- 🔄 Advanced analytics dashboard
- 🔄 Workflow automation
- 🔄 Multi-currency support

### Phase 4 (Q4 2025)
- 🔄 Machine learning matching
- 🔄 Mobile app
- 🔄 Advanced reporting
- 🔄 Enterprise features

---

**Built with ❤️ by the LedgerLink Team**

Made for businesses who want to streamline their financial reconciliation processes with modern, reliable technology.