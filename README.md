# LedgerLink

[![Backend CI/CD](https://github.com/TomWall1/LedgerLink/actions/workflows/ci.yml/badge.svg)](https://github.com/TomWall1/LedgerLink/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.1.6-blue)](https://www.typescriptlang.org/)

**AI-powered invoice reconciliation platform** that streamlines financial operations by automatically matching invoices across multiple ERP systems and counterparties.

## 🚀 **Quick Start**

### **Option 1: Docker (Recommended)**
```bash
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink/backend
npm run setup:docker
```

### **Option 2: Manual Setup**
```bash
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink/backend
npm run setup:dev
```

### **Option 3: Basic Setup**
```bash
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink/backend
npm run setup
npm run setup:db
npm run dev
```

🌐 **Your API will be running at:** `http://localhost:3001`

## ✨ **Features**

### 🔐 **Authentication & Security**
- JWT-based authentication with refresh tokens
- Role-based authorization (User, Admin, Super Admin)
- Advanced rate limiting with Redis
- Input validation and sanitization
- API key management

### 🔌 **ERP Integrations**
- **Xero** - Complete OAuth 2.0 integration
- **QuickBooks Online** - Full API support
- **Sage** - Framework ready
- **NetSuite** - Framework ready
- Real-time webhooks for data sync

### 🤖 **AI-Powered Matching**
- Smart invoice matching algorithms
- Confidence scoring and manual review
- Bulk operations and automated workflows
- CSV file processing and validation
- **Demo endpoint** (no authentication required)

### 📊 **Advanced Reporting**
- PDF and CSV report generation
- Scheduled reports with templates
- Real-time analytics and dashboards
- Audit trails and compliance reports

### 🏢 **Multi-Tenant Architecture**
- Company-based data isolation
- Counterparty linking system
- User management with granular permissions
- Customizable settings and workflows

## 🛠️ **Tech Stack**

### **Backend**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for performance optimization
- **Authentication**: JWT with refresh token rotation
- **File Processing**: Multer with CSV parsing
- **PDF Generation**: PDFKit for reports
- **Email**: Nodemailer with SMTP support
- **Testing**: Jest with database setup
- **Deployment**: Docker & Docker Compose

### **Infrastructure**
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Container**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston logging with health checks

## 📁 **Project Structure**

```
LedgerLink/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── app.ts         # Express app configuration
│   │   └── server.ts      # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   ├── migrations/    # Database migrations
│   │   └── seed.ts        # Database seeding
│   ├── scripts/           # Setup and utility scripts
│   ├── docker-compose.yml # Docker services
│   └── Dockerfile        # Production Docker image
└── frontend/             # (Coming soon)
```

## 🔗 **API Endpoints**

### **Authentication** (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User authentication
- `POST /refresh` - Refresh access token
- `GET /verify-email/:token` - Email verification

### **Integrations** (`/api/v1/integrations`)
- `GET /erp-connections` - List ERP connections
- `GET /xero/auth` - Initiate Xero OAuth flow
- `GET /quickbooks/auth` - Initiate QuickBooks OAuth flow
- `POST /counterparty-links` - Create counterparty links

### **Matching** (`/api/v1/matching`)
- `POST /csv-demo` - **Demo CSV matching (no auth required)**
- `GET /sessions` - List matching sessions
- `POST /sessions` - Create matching session
- `POST /sessions/:id/start` - Start matching process

### **Reports** (`/api/v1/reports`)
- `GET /` - List generated reports
- `POST /` - Generate new report
- `GET /:id/download` - Download report file
- `GET /quick/reconciliation-summary` - Quick summary

### **Webhooks** (`/api/webhooks`)
- `POST /xero` - Xero webhook handler
- `POST /quickbooks` - QuickBooks webhook handler
- `POST /stripe` - Payment webhook handler

## 🧪 **Testing**

Run the comprehensive test suite:

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Setup test environment
npm run setup:test
```

## 🐳 **Docker Deployment**

### **Development**
```bash
docker-compose up -d
```

### **Production**
```bash
docker build -t ledgerlink-backend .
docker run -p 3001:3001 ledgerlink-backend
```

### **Services Included**
- **Backend API**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **pgAdmin** (optional): `http://localhost:5050`

## 🔧 **Environment Configuration**

Key environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ledgerlink"

# Cache
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-secure-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# ERP Integrations
XERO_CLIENT_ID="your-xero-client-id"
XERO_CLIENT_SECRET="your-xero-client-secret"

QUICKBOOKS_CLIENT_ID="your-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-client-secret"
```

See [`.env.example`](backend/.env.example) for all configuration options.

## 👥 **Demo Accounts**

After running the database seed:

- **Admin**: `admin@ledgerlink.com` / `admin123`
- **User**: `user@ledgerlink.com` / `user123`

## 🌐 **Live Demo**

- **Backend API**: https://ledgerlink.onrender.com
- **Frontend**: https://lledgerlink.vercel.app
- **Health Check**: https://ledgerlink.onrender.com/api/health
- **API Docs**: https://ledgerlink.onrender.com/api/docs

## 📋 **Development Workflow**

1. **Setup**: `npm run setup:dev`
2. **Development**: `npm run dev`
3. **Testing**: `npm test`
4. **Linting**: `npm run lint:fix`
5. **Building**: `npm run build`
6. **Database**: `npm run db:studio`

## 🚀 **Deployment**

### **Render (Current)**
- Automatic deployments from `main` branch
- PostgreSQL database included
- Redis add-on for caching

### **Railway/Heroku Alternative**
```bash
# Build for production
npm run build

# Start production server
npm start
```

### **Self-Hosted**
```bash
# Use Docker
docker-compose -f docker-compose.prod.yml up -d

# Or manual deployment
npm run build
PORT=3001 npm start
```

## 📊 **Performance & Monitoring**

### **Health Checks**
- `/api/health` - Basic health status
- `/api/health/detailed` - Full system status
- `/api/health/ready` - Kubernetes readiness
- `/api/health/live` - Kubernetes liveness

### **Monitoring Features**
- Structured logging with Winston
- Request/response logging
- Error tracking and alerting
- Performance metrics
- Database connection monitoring

## 🔒 **Security Features**

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control
- **Rate Limiting**: Redis-based with customizable rules
- **Input Validation**: Joi schema validation
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: Helmet security headers
- **CORS**: Configurable cross-origin policies
- **File Upload**: Type and size validation
- **Password Security**: bcrypt with salt rounds
- **API Keys**: Secure key generation and validation

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- **Documentation**: [Backend README](backend/README.md)
- **Issues**: [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TomWall1/LedgerLink/discussions)

## 🎯 **Roadmap**

- [ ] **Frontend Implementation** (React/Next.js)
- [ ] **Advanced AI Matching** (ML models)
- [ ] **Mobile App** (React Native)
- [ ] **Additional ERP Integrations** (SAP, Oracle)
- [ ] **Advanced Analytics** (Dashboards & Insights)
- [ ] **API Rate Limiting Tiers** (Usage-based pricing)
- [ ] **Webhook Management UI** (Visual webhook builder)
- [ ] **Advanced Reporting** (Custom report builder)

---

**Built with ❤️ by the LedgerLink Team**

*Streamline your financial operations with AI-powered invoice reconciliation.*