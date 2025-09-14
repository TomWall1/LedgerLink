# Xero API Integration Documentation

This document provides comprehensive information about the Xero API integration in LedgerLink.

## Overview

The Xero integration provides OAuth 2.0 authentication and data synchronization with Xero accounting software. It allows users to:

- Connect their Xero organizations to LedgerLink
- Automatically sync invoices and contacts
- Match transactions between systems
- Maintain real-time data consistency

## Architecture

### Components

1. **XeroService** (`services/xeroService.js`)
   - Main service class handling all Xero API interactions
   - OAuth flow management
   - Token refresh and management
   - Rate limiting compliance

2. **XeroConnection Model** (`models/XeroConnection.js`)
   - MongoDB schema for storing connection details
   - Encrypted token storage
   - Connection health tracking

3. **Xero Routes** (`routes/xero.js`)
   - RESTful API endpoints
   - Authentication middleware integration
   - Error handling

4. **Xero Sync Jobs** (`jobs/xeroSyncJob.js`)
   - Background data synchronization
   - Cron-based scheduling
   - Error recovery

### Data Flow

```
User → Frontend → Backend Routes → XeroService → Xero API
                     ↓
              XeroConnection Model → MongoDB
                     ↓
               Background Sync Jobs
```

## Authentication Flow

### OAuth 2.0 Authorization Code Flow

1. **Initiate Connection**
   ```
   GET /api/xero/auth?companyId={id}
   ```
   - Generates authorization URL with state parameter
   - State includes user ID, company ID, and CSRF token

2. **User Authorization**
   - User redirected to Xero login
   - User approves app access
   - Xero redirects back with authorization code

3. **Token Exchange**
   ```
   GET /api/xero/callback?code={code}&state={state}
   ```
   - Validates state parameter
   - Exchanges code for access/refresh tokens
   - Stores encrypted tokens in database

4. **Connection Storage**
   - Creates XeroConnection record
   - Fetches organization details
   - Sets up for data synchronization

### Token Management

- **Access Tokens**: Valid for 30 minutes
- **Refresh Tokens**: Valid for 60 days
- **Automatic Refresh**: Handled transparently before API calls
- **Encryption**: All tokens encrypted at rest

## API Endpoints

### Authentication Endpoints

#### `GET /api/xero/auth`
Initiate OAuth flow

**Parameters:**
- `companyId` (required): Company ID to associate connection

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://login.xero.com/identity/connect/authorize?...",
    "state": "encoded_state_parameter"
  }
}
```

#### `GET /api/xero/callback`
OAuth callback handler (public endpoint)

**Parameters:**
- `code`: Authorization code from Xero
- `state`: State parameter for CSRF protection

**Response:**
Redirects to frontend with success/error parameters

### Connection Management

#### `GET /api/xero/connections`
List user's Xero connections

**Query Parameters:**
- `companyId` (optional): Filter by company

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "connection_id",
      "tenantId": "xero_tenant_id",
      "tenantName": "Organization Name",
      "status": "active",
      "lastSyncAt": "2023-12-01T10:00:00Z",
      "settings": {
        "baseCurrency": "USD",
        "countryCode": "US"
      }
    }
  ]
}
```

#### `DELETE /api/xero/connections/:id`
Disconnect Xero connection

**Response:**
```json
{
  "success": true,
  "message": "Xero connection disconnected successfully"
}
```

#### `GET /api/xero/health/:id`
Check connection health

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionId": "connection_id",
    "tenantName": "Organization Name",
    "status": "active",
    "isExpired": false,
    "lastSyncAt": "2023-12-01T10:00:00Z",
    "apiConnectivity": "ok"
  }
}
```

### Data Access Endpoints

#### `GET /api/xero/invoices`
Fetch invoices from Xero

**Query Parameters:**
- `connectionId` (required): Xero connection ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)
- `dateFrom` (optional): Filter from date (YYYY-MM-DD)
- `dateTo` (optional): Filter to date (YYYY-MM-DD)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "transaction_number": "INV-001",
        "transaction_type": "ACCREC",
        "amount": 1000.00,
        "issue_date": "2023-12-01T00:00:00Z",
        "due_date": "2023-12-31T00:00:00Z",
        "status": "open",
        "contact_name": "Customer Name",
        "xero_id": "xero_invoice_id",
        "source": "xero"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 1
    }
  }
}
```

#### `GET /api/xero/contacts`
Fetch contacts from Xero

**Query Parameters:**
- `connectionId` (required): Xero connection ID
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "ContactID": "xero_contact_id",
        "Name": "Customer Name",
        "EmailAddress": "customer@example.com",
        "ContactStatus": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 1
    }
  }
}
```

#### `POST /api/xero/sync`
Trigger manual synchronization

**Request Body:**
```json
{
  "connectionId": "connection_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "data": {
    "lastSyncAt": "2023-12-01T10:00:00Z",
    "status": "success"
  }
}
```

## Background Jobs

The system includes automated background jobs for data synchronization:

### Invoice Sync Job
- **Frequency**: Every 5 minutes
- **Purpose**: Sync recent invoice changes
- **Batch Size**: 100 invoices per request

### Contact Sync Job
- **Frequency**: Every hour
- **Purpose**: Sync contact updates
- **Full Sync**: Downloads all contacts

### Organization Settings Job
- **Frequency**: Daily at 6 AM
- **Purpose**: Update organization details
- **Data**: Currency, timezone, country code

### Token Refresh Job
- **Frequency**: Every 30 minutes
- **Purpose**: Refresh tokens before expiry
- **Threshold**: Tokens expiring within 1 hour

## Error Handling

### Common Error Scenarios

1. **Authentication Errors (401)**
   - Invalid or expired tokens
   - User revoked app access
   - **Response**: Prompt for reconnection

2. **Rate Limit Errors (429)**
   - Exceeded Xero's 60 requests/minute limit
   - **Response**: Automatic retry with backoff

3. **Connection Errors**
   - Network issues
   - Xero API downtime
   - **Response**: Mark connection as error state

4. **Data Validation Errors**
   - Malformed responses from Xero
   - Missing required fields
   - **Response**: Log error, continue processing

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "data": {
    "error": "Technical error details",
    "reconnectRequired": true,
    "retryAfter": 60
  }
}
```

## Security Considerations

### Token Security
- All OAuth tokens encrypted using AES-256
- Encryption key stored in environment variables
- Tokens never logged or exposed in responses

### State Parameter Protection
- CSRF protection via state parameter
- State includes timestamp to prevent replay attacks
- State expires after 5 minutes

### API Security
- All endpoints require user authentication
- Connection ownership validation
- Rate limiting at application level

### Data Protection
- Sensitive data sanitized in logs
- Connection details isolated by user
- Automatic token cleanup on disconnection

## Rate Limiting

Xero enforces a rate limit of 60 API calls per minute per tenant. The integration includes:

- **Request Tracking**: Monitors API calls per tenant
- **Automatic Throttling**: Delays requests when approaching limits
- **Queue Management**: Processes requests in optimal batches
- **Retry Logic**: Handles temporary rate limit errors

## Monitoring and Logging

### API Usage Logging
```json
{
  "timestamp": "2023-12-01T10:00:00Z",
  "userId": "user_id",
  "tenantId": "xero_tenant_id",
  "endpoint": "/Invoices",
  "method": "GET",
  "statusCode": 200,
  "duration": 250
}
```

### Connection Health Monitoring
- Regular health checks for active connections
- Automatic error detection and alerting
- Performance metrics tracking

### Sync Job Monitoring
- Job execution statistics
- Error tracking and reporting
- Performance optimization metrics

## Configuration

### Environment Variables

```bash
# Required
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_REDIRECT_URI=https://yourapp.com/api/xero/callback
ENCRYPTION_KEY=32_byte_hex_key

# Optional
XERO_AUTHORIZE_URL=https://login.xero.com/identity/connect/authorize
XERO_TOKEN_URL=https://identity.xero.com/connect/token
XERO_API_BASE_URL=https://api.xero.com/api.xro/2.0

# Feature Flags
ENABLE_XERO_SYNC_JOBS=true
ENABLE_API_LOGGING=true
```

### Database Configuration

The integration uses MongoDB with the following collections:
- `xeroconnections`: Connection details and tokens
- `users`: User authentication (existing)
- `companies`: Company information (existing)

## Testing

The integration includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end OAuth flow
- **API Tests**: Endpoint validation
- **Mock Tests**: Xero API simulation

**Run Tests:**
```bash
npm test -- xero.test.js
```

## Troubleshooting

### Debug Mode
Enable detailed logging:
```bash
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

### Common Issues

1. **Connection failures**: Check network connectivity
2. **Token errors**: Verify encryption key consistency
3. **Rate limits**: Monitor API usage patterns
4. **Data sync issues**: Check job execution logs

### Support Resources

- [Xero Developer Documentation](https://developer.xero.com/documentation/)
- [OAuth 2.0 Troubleshooting](https://developer.xero.com/documentation/guides/oauth2/troubleshooting/)
- [API Reference](https://developer.xero.com/documentation/api/accounting/overview)

---

**Last Updated**: December 2024  
**Version**: 1.0.0