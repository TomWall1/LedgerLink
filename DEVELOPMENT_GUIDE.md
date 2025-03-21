# LedgerLink Development Guide

This guide will help you understand and work with the LedgerLink application codebase, especially if you're not a developer but need to make changes or understand how things work.

## Project Structure

The project is divided into two main parts:

1. **Frontend**: React application that provides the user interface
2. **Backend**: Node.js/Express API server that handles data processing and connects to MongoDB

```
LedgerLink/
├── backend/           # Backend code
│   ├── data/          # Data storage for tokens and temporary files
│   ├── src/           # Source code
│   │   ├── config/    # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Express middleware
│   │   ├── models/    # Database models
│   │   ├── routes/    # API endpoints
│   │   └── utils/     # Utility functions
│   ├── .env           # Environment variables
│   ├── index.js       # Main server file
│   └── package.json   # Dependencies
├── frontend/         # Frontend React application
├── index.js          # Root project file (legacy)
└── package.json      # Root project file with scripts
```

## Database Models

The application uses these main data models:

1. **User**: Represents a user of the system
   - Email, name, password (hashed), company reference

2. **Company**: Represents a company in the system
   - Name, address, tax ID, etc.

3. **CompanyLink**: Represents a connection between two companies
   - References both companies and their relationship

4. **Transaction**: Represents financial transactions from ledgers
   - Invoice or payment data with amounts, dates, reference numbers

## Common Tasks

### 1. Running the Application Locally

For Windows users, use the convenience script:

```
cd backend
start-dev.bat
```

This script:
- Checks if MongoDB is running and starts it if needed
- Checks for port conflicts and resolves them
- Starts the backend server

Then in a separate terminal, start the frontend:

```
cd frontend
npm start
```

### 2. Checking MongoDB Connection

If you're having database issues:

1. Test the MongoDB connection at: http://localhost:3002/test/db
2. This endpoint will show you:
   - Connection state (Connected, Disconnected, etc.)
   - Database name and server information
   - Available collections

### 3. Changing Database Configuration

To change database settings, edit the `.env` file in the backend folder:

```
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ledgerlink
```

For cloud-hosted MongoDB like MongoDB Atlas, use a connection string like:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ledgerlink
```

### 4. Understanding the Authentication System

The application uses JWT (JSON Web Token) authentication:

1. Users register or log in via `/api/auth/register` or `/api/auth/login`
2. The server returns a JWT token
3. The frontend stores this token and sends it with requests
4. Protected routes check this token for authorization

JWT settings are in the `.env` file:

```
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
```

### 5. Company Linking Process

The company linking feature works as follows:

1. Company A sends a link request to Company B
2. Company B receives and can accept/reject the request
3. Once linked, both companies can share transaction data
4. The CompanyLink record stores the relationship details

## Testing the API

You can test the API endpoints using tools like Postman or using the browser:

1. **Basic server status**: http://localhost:3002/
2. **MongoDB test**: http://localhost:3002/test/db
3. **CORS test**: http://localhost:3002/test/cors-test

For protected API endpoints, you'll need to include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

## Common Issues and Solutions

### Port Conflicts

**Problem**: Error `EADDRINUSE: address already in use ::3002`

**Solution**: 
1. Find the process: `netstat -ano | findstr :3002`
2. Kill it: `taskkill /F /PID [PID]`

Or use the start-dev.bat script which does this automatically.

### MongoDB Connection Fails

**Problem**: Cannot connect to MongoDB

**Solution**:
1. Check MongoDB service is running in Windows Services
2. Verify connection string in `.env` file
3. Try the test endpoint: http://localhost:3002/test/db

### Changes Not Reflecting

**Problem**: Code changes don't seem to take effect

**Solution**:
1. Backend uses nodemon which should automatically reload on changes
2. If changes still don't appear, restart the server manually
3. Clear your browser cache (Ctrl+F5)

## Essential Files to Understand

If you need to make changes, these are the key files to understand:

- `backend/index.js` - Main server setup
- `backend/src/config/db.js` - Database connection
- `backend/src/models/` - Database schemas
- `backend/.env` - Environment configuration
- `backend/src/routes/` - API endpoints

## Making Changes to the Codebase

Even if you're not a developer, you can make basic changes:

1. **Configuration changes**: Edit `.env` files
2. **Text/label changes**: Find the text in the frontend code and modify it
3. **Adding basic routes**: Copy an existing route and modify it

Always test changes on a development environment before deploying to production.
