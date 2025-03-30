# ERP Connections Implementation Guide

## Overview

This document provides a comprehensive guide for implementing the ERP Connection feature in LedgerLink, which allows users to connect to various ERP systems (Xero, QuickBooks, etc.) and synchronize transaction data.

## Backend Components

### Models

1. **ERPConnection Model** (`backend/src/models/ERPConnection.js`)
   - Stores connection details, status, and provider-specific data
   - Links to a specific user account
   - Tracks connection type (AR/AP) and synchronization status

### Controllers

1. **ERPConnectionController** (`backend/src/controllers/erpConnectionController.js`)
   - Handles CRUD operations for ERP connections
   - Manages link operations between ERPs and user accounts
   - Provides endpoints for retrieving connection status and data

### Routes

1. **ERPConnectionRoutes** (`backend/src/routes/erpConnectionRoutes.js`)
   - Defines API endpoints for managing ERP connections
   - Ensures all routes are protected by authentication
   - Maps HTTP methods to appropriate controller functions

### Integration with Main Application

In `backend/index.js`, the ERP connection routes must be imported and mounted:

```javascript
// Import the ERP connections routes
import erpConnectionRoutes from './src/routes/erpConnectionRoutes.js';

// Mount the ERP connections routes
app.use('/api/erp-connections', erpConnectionRoutes);
```

## Frontend Components

### API Utilities

1. **API Extensions** (`frontend/src/utils/api.extensions.js`)
   - Provides methods for interacting with ERP connection endpoints
   - Handles path variations (/api/erp-connections vs /erp-connections)
   - Implements consistent error handling

### React Components

1. **ERPConnectionManager** (`frontend/src/components/ERPConnectionManager.jsx`)
   - Main interface for managing ERP connections
   - Displays connection status and offers troubleshooting guidance
   - Handles connection creation, viewing, and deletion
   - Includes fallback "demo mode" for development environments

2. **XeroConnection** (existing component)
   - Integrates with the ERPConnectionManager
   - Handles Xero-specific authentication and data flow

## Implementation Steps

1. **Backend Setup**
   - Create or update the ERPConnection model
   - Implement controller functions for connection management
   - Ensure routes are properly mounted in index.js

2. **Frontend Integration**
   - Update the API utility with connection-specific methods
   - Enhance the ERPConnectionManager with error handling and mock mode
   - Integrate with existing Xero authentication flow

3. **Testing**
   - Verify connections can be created, viewed, and deleted
   - Test mock mode with the backend service unavailable
   - Validate error handling for various network conditions

## Mock Mode

The "mock mode" feature provides a graceful fallback when the backend ERP connection endpoint is unavailable:

- Automatically activates when backend endpoints return 404 errors
- Stores connection data in browser memory (lost on refresh)
- Displays a clear indicator that demo mode is active
- Handles all CRUD operations locally without API calls

This allows frontend development to proceed even if the backend implementation is incomplete.
