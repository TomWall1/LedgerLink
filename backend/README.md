# LedgerLink Backend

AI-powered invoice reconciliation platform backend built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **ERP Integrations**: OAuth flows for Xero, QuickBooks, Sage, NetSuite
- **Invoice Matching**: AI-powered invoice matching algorithms
- **File Processing**: CSV upload and parsing with validation
- **Report Generation**: PDF and CSV report generation
- **Real-time Updates**: Webhook support for ERP systems
- **Rate Limiting**: Advanced rate limiting with Redis
- **Monitoring**: Comprehensive logging and health checks
- **Security**: Helmet, CORS, input validation, and encryption

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for caching and rate limiting
- **Authentication**: JWT with refresh tokens
- **File Upload**: Multer with validation
- **Email**: Nodemailer with SMTP support
- **PDF Generation**: PDFKit
- **CSV Processing**: Fast-CSV and CSV-Parser
- **Validation**: Joi schema validation
- **Logging**: Winston with structured logging

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Redis 6+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TomWall1/LedgerLink.git
   cd LedgerLink/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`.

### Environment Configuration

Key environment variables to configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ledgerlink"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate secure secrets for production)
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# ERP Integration (optional for development)
XERO_CLIENT_ID="your-xero-client-id"
XERO_CLIENT_SECRET="your-xero-client-secret"
```

See `.env.example` for all available options.

## API Documentation

Once running, visit:
- Health Check: `http://localhost:3001/api/health`
- API Info: `http://localhost:3001/api/docs`
- Full API: `http://localhost:3001/api/v1/`

### API Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /verify-email/:token` - Verify email address

#### Users (`/api/v1/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings
- `GET /notifications` - Get user notifications

#### Integrations (`/api/v1/integrations`)
- `GET /erp-connections` - List ERP connections
- `POST /erp-connections` - Create ERP connection
- `GET /xero/auth` - Initiate Xero OAuth
- `GET /quickbooks/auth` - Initiate QuickBooks OAuth
- `POST /counterparty-links` - Create counterparty link

#### Matching (`/api/v1/matching`)
- `POST /csv-demo` - Demo CSV matching (no auth required)
- `GET /sessions` - List matching sessions
- `POST /sessions` - Create matching session
- `POST /sessions/:id/start` - Start matching process
- `GET /sessions/:id/results` - Get match results

#### Reports (`/api/v1/reports`)
- `GET /` - List reports
- `POST /` - Generate report
- `GET /:id/download` - Download report
- `GET /quick/reconciliation-summary` - Quick summary

#### Webhooks (`/api/webhooks`)
- `POST /xero` - Xero webhook endpoint
- `POST /quickbooks` - QuickBooks webhook endpoint
- `POST /stripe` - Stripe webhook endpoint

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models:

- **Users**: Authentication and user management
- **Companies**: Multi-tenant company structure
- **ERPConnections**: ERP system integrations
- **Invoices**: Invoice data from various sources
- **MatchingSessions**: Matching process management
- **MatchResults**: AI matching results
- **Reports**: Generated reports and templates
- **CounterpartyLinks**: Inter-company connections

## Development

### Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run migrate      # Run database migrations
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # ESLint checks
npm run lint:fix     # Fix ESLint issues
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── app.ts          # Express app configuration
└── server.ts       # Server entry point

prisma/
├── schema.prisma   # Database schema
└── migrations/     # Database migrations
```

## Testing

Run the test suite:

```bash
npm test
```

For development with auto-reload:

```bash
npm run test:watch
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure environment variables
4. Run database migrations
5. Start the application

### Health Checks

The application provides several health check endpoints:

- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed health with database/Redis status
- `/api/health/ready` - Kubernetes readiness probe
- `/api/health/live` - Kubernetes liveness probe

## Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting with Redis
- Input validation with Joi schemas
- CORS configuration
- Helmet security headers
- File upload validation
- SQL injection prevention with Prisma

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
