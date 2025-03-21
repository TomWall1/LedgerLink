# LedgerLink

A system that helps companies compare, reconcile, and link their accounts receivable and payable ledgers, identifying discrepancies and mismatches automatically.

## Features

- Upload AR/AP ledger data via CSV
- Connect directly with accounting systems like Xero
- Account linking for persistent reconciliation
- User authentication and company profiles
- Company linking between counterparties
- Automatically identify:
  - Missing invoices and credit notes
  - Mismatched invoice dates
  - Mismatched due dates
  - Payment allocation discrepancies
- Export reconciliation results

## Requirements

- Node.js v16 or higher
- MongoDB database
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink
```

2. Install dependencies:
```bash
npm run install:all
```
This will install dependencies for both frontend and backend.

3. Set up MongoDB:
   - Install MongoDB Community Edition for Windows: [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/)
   - Make sure MongoDB is running as a Windows service
   - The default connection string is: `mongodb://localhost:27017/ledgerlink`

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend folder
   - Update the values in `.env` with your configuration

5. Start the development servers:

Using the convenience script (Windows):
```bash
cd backend
start-dev.bat
```

Or manually start both servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

## MongoDB Connection Troubleshooting

If you encounter MongoDB connection issues:

1. Verify MongoDB service is running:
   - Open Services (services.msc)
   - Look for "MongoDB" service and ensure it's "Running"
   - If not, start it manually

2. Check port conflicts:
   - Run `netstat -ano | findstr :3002` to check if the port is in use
   - Kill any process using the port: `taskkill /F /PID [PID]`

3. Test MongoDB connection:
   - In your browser, visit: http://localhost:3002/test/db
   - This will show MongoDB connection details and status

## CSV Format

The system expects CSV files in the following format:

```csv
transaction_number,transaction_type,amount,issue_date,due_date,status,reference
INV001,INVOICE,1000.00,2024-01-01,2024-01-31,open,PO12345
```

## Configuration Options

- Date tolerance: Set acceptable date differences
- Amount tolerance: Set acceptable amount differences
- Transaction type rules: Configure matching rules per transaction type
- Account linking: Link accounts across systems for persistent reconciliation

## Deployment

- Frontend: Deployed on Vercel at https://lledgerlink.vercel.app/
- Backend: Deployed on Render at https://ledgerlink.onrender.com

## License

[Your chosen license]

## Support

[Contact information or where to get help]
