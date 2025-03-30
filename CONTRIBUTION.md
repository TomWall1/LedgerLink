# Contributing to LedgerLink's ERP Connections

## Overview

The ERP Connection feature allows users to connect LedgerLink with various ERP systems (like Xero, QuickBooks, etc.) to import transaction data. This document provides guidelines for developers who wish to contribute to this feature.

## Getting Started

1. Clone the repository
2. Install dependencies in both frontend and backend directories
3. Make sure MongoDB is running locally
4. Start the development servers

## Architecture

The ERP Connections feature follows a standard client-server architecture:

- **Backend**: NodeJS/Express API with MongoDB storage
- **Frontend**: React components with hooks for state management

The key components include:

1. **Backend**
   - Models: `ERPConnection` schema in MongoDB
   - Controllers: Business logic for managing connections
   - Routes: API endpoints for CRUD operations

2. **Frontend**
   - Components: UI elements for managing connections
   - Hooks: Data fetching and state management
   - API utilities: HTTP client wrapper for backend communication

## Development Guidelines

### Backend Development

1. **API Endpoints**: Follow RESTful conventions
   - GET `/api/erp-connections` - List all connections
   - POST `/api/erp-connections` - Create a new connection
   - GET `/api/erp-connections/:id` - Get a specific connection
   - PUT `/api/erp-connections/:id` - Update a connection
   - DELETE `/api/erp-connections/:id` - Delete a connection

2. **Error Handling**: Use consistent error responses
   ```javascript
   {
     success: false,
     error: 'Error message'
   }
   ```

3. **Authentication**: All ERP connection endpoints must be protected
   - Use the requireAuth middleware
   - Validate user ownership of connections

### Frontend Development

1. **Component Structure**
   - Use functional components with hooks
   - Separate UI from data fetching logic
   - Handle loading, error, and empty states

2. **State Management**
   - Use the `useERPConnections` hook for data operations
   - Handle API errors gracefully
   - Implement optimistic updates where possible

3. **Mock Mode**
   - Support development with mock data when backend is unavailable
   - Clearly indicate when mock mode is active
   - Make mock behavior match real API behavior

## Testing

1. **Backend Tests**
   - Write unit tests for controllers
   - Write integration tests for API endpoints
   - Test authentication and authorization

2. **Frontend Tests**
   - Test components with React Testing Library
   - Test hooks with React Hooks Testing Library
   - Mock API responses for predictable testing

## Adding New ERP Providers

To add support for a new ERP provider:

1. Update the `provider` enum in the `ERPConnection` model
2. Create provider-specific utilities in `utils/erpProviders/{providerName}.js`
3. Add provider-specific UI components as needed
4. Update documentation and tests

## Common Issues and Solutions

### CORS Issues

If encountering CORS errors during development:

1. Ensure the backend has proper CORS configuration
2. Check the frontend is using the correct API URL
3. Verify the API request includes the proper headers

### Authentication Problems

If connections cannot be fetched due to auth issues:

1. Verify the token is being properly sent in requests
2. Check token expiration and refresh functionality
3. Ensure the user has the correct permissions

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Xero API Documentation](https://developer.xero.com/documentation/)

## Questions and Support

For questions about contributing to the ERP Connections feature, please contact the project maintainers or open an issue in the repository.
