# LedgerLink 🚀

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TomWall1/LedgerLink)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Led9er?referralCode=bonus)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/TomWall1/LedgerLink)

[![Backend CI/CD](https://github.com/TomWall1/LedgerLink/actions/workflows/auto-setup.yml/badge.svg)](https://github.com/TomWall1/LedgerLink/actions/workflows/auto-setup.yml)
[![Production Health](https://github.com/TomWall1/LedgerLink/actions/workflows/health-check.yml/badge.svg)](https://github.com/TomWall1/LedgerLink/actions/workflows/health-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.1.6-blue)](https://www.typescriptlang.org/)

**AI-powered invoice reconciliation platform** that streamlines financial operations by automatically matching invoices across multiple ERP systems and counterparties.

---

## 🌐 **Live Application**

### **✅ Current Deployment:**
- **🎨 Frontend**: [https://ledgerlink.vercel.app](https://ledgerlink.vercel.app) *(Vercel)*
- **⚙️ Backend**: [https://ledgerlink.onrender.com](https://ledgerlink.onrender.com) *(Render)*
- **🏥 Health Check**: [https://ledgerlink.onrender.com/api/health](https://ledgerlink.onrender.com/api/health)
- **📚 API Docs**: [https://ledgerlink.onrender.com/api/docs](https://ledgerlink.onrender.com/api/docs)

### **🧪 Try the CSV Demo (No Authentication Required):**
```bash
curl -X POST https://ledgerlink.onrender.com/api/v1/matching/csv-demo \
  -F "file1=@your-invoices1.csv" \
  -F "file2=@your-invoices2.csv"
```

**Demo Accounts:**
- **Admin**: `admin@ledgerlink.com` / `admin123`
- **User**: `user@ledgerlink.com` / `user123`

---

## 🎯 **Additional Backend Deployments (Optional)**

Deploy additional backend instances to other platforms:

### **🟢 Render (Additional Instance)**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TomWall1/LedgerLink)

### **🚄 Railway (Fast Deploy)**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Led9er?referralCode=bonus)

### **🟣 Heroku (Classic)**
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/TomWall1/LedgerLink)

*All deployments automatically configure CORS for the existing frontend at https://ledgerlink.vercel.app*

---

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

---

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework**: React/Next.js (deployed on Vercel)
- **UI**: Modern responsive interface
- **State Management**: Context API / Redux
- **Authentication**: JWT integration

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

---

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

---

## 📁 **Project Structure**

```
LedgerLink/
├── 🎯 One-click Deploy Buttons (Backend only)
├── 🤖 GitHub Actions (Auto setup & deployment)
├── 📁 backend/
│   ├── 🔧 src/ (TypeScript source)
│   ├── 🗃️ prisma/ (Database schema & migrations)
│   ├── 📜 scripts/ (Automated setup scripts)
│   ├── 🐳 Dockerfile (Production container)
│   └── 📋 docker-compose.yml (Development)
├── ⚙️ Platform configs (render.yaml, railway.json, etc.)
├── 📚 Documentation (README, DEPLOYMENT guides)
└── 🎨 frontend/ (Deployed separately on Vercel)
```

---

## 🧪 **Testing the API**

### **1. Health Check**
```bash
curl https://ledgerlink.onrender.com/api/health
```

### **2. API Documentation**
Visit: [https://ledgerlink.onrender.com/api/docs](https://ledgerlink.onrender.com/api/docs)

### **3. Authentication Test**
```bash
curl -X POST https://ledgerlink.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ledgerlink.com","password":"admin123"}'
```

### **4. CSV Matching Demo**
No authentication required - perfect for testing!
```bash
curl -X POST https://ledgerlink.onrender.com/api/v1/matching/csv-demo \
  -F "file1=@invoices1.csv" \
  -F "file2=@invoices2.csv"
```

---

## 🔧 **For Developers (Optional Local Setup)**

If you want to develop locally:

```bash
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink/backend
npm run setup:docker  # One command setup
```

Or use the Makefile:
```bash
make quick-start
```

---

## 🎛️ **Environment Variables (Auto-configured)**

All deployment platforms automatically configure:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Authentication secret
- `CORS_ORIGIN` - Set to https://ledgerlink.vercel.app
- All other required variables

No manual configuration needed! 🎉

---

## 📊 **Monitoring & Health**

### **Automatic Health Monitoring**
GitHub Actions automatically monitors all deployments every 30 minutes:
- ✅ Health endpoint checks
- ⏱️ Performance monitoring  
- 🚨 Automatic alerts if issues detected
- 📈 Status badge updates

### **Health Endpoints**
- `/api/health` - Basic status
- `/api/health/detailed` - Full system status
- `/api/health/ready` - Kubernetes readiness
- `/api/health/live` - Kubernetes liveness

---

## 🔒 **Security Features**

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control
- **Rate Limiting**: Redis-based with customizable rules
- **Input Validation**: Joi schema validation
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: Helmet security headers
- **CORS**: Pre-configured for https://ledgerlink.vercel.app
- **File Upload**: Type and size validation
- **Password Security**: bcrypt with salt rounds
- **API Keys**: Secure key generation and validation

---

## 🎯 **Roadmap**

- [ ] **Frontend Enhancements** (React/Next.js improvements)
- [ ] **Advanced AI Matching** (ML models)
- [ ] **Mobile App** (React Native)
- [ ] **Additional ERP Integrations** (SAP, Oracle)
- [ ] **Advanced Analytics** (Dashboards & Insights)
- [ ] **API Rate Limiting Tiers** (Usage-based pricing)
- [ ] **Webhook Management UI** (Visual webhook builder)
- [ ] **Advanced Reporting** (Custom report builder)

---

## 🤝 **Contributing**

1. **Fork** the repository
2. **Deploy** your own backend instance using the buttons above
3. **Make** your changes
4. **Test** with the deployed API
5. **Submit** a Pull Request

### **Development Guidelines**
- All changes are automatically tested via GitHub Actions
- Use the deployed API for testing integrations
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed

---

## 📞 **Support**

- **Quick Deploy Issues**: [Deployment Help Template](.github/ISSUE_TEMPLATE/deployment-help.md)
- **General Issues**: [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)
- **Documentation**: [Deployment Guide](DEPLOYMENT.md)
- **Live API**: Use https://ledgerlink.onrender.com for testing

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⭐ **Star This Repository**

If LedgerLink helps you streamline your invoice reconciliation, please give it a star! ⭐

---

## 🔗 **Quick Links**

- 🎨 **Frontend**: https://ledgerlink.vercel.app
- ⚙️ **Backend API**: https://ledgerlink.onrender.com
- 🏥 **Health**: https://ledgerlink.onrender.com/api/health
- 📚 **Docs**: https://ledgerlink.onrender.com/api/docs
- 🧪 **CSV Demo**: https://ledgerlink.onrender.com/api/v1/matching/csv-demo

---

**🚀 Click any deploy button above to create additional backend instances!**

*Built with ❤️ for the future of financial operations.*