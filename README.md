# 🔗 LedgerLink - Automated Financial Reconciliation

LedgerLink is an intelligent financial reconciliation platform that automates the matching process between Coupa invoice approvals and NetSuite AR ledger data. Built with advanced fuzzy matching algorithms and a modern React interface.

## ✨ Features

- **🤖 Intelligent Matching**: AI-powered algorithm with 95%+ accuracy
- **⚡ Lightning Fast**: Process thousands of records in seconds
- **📊 Comprehensive Analytics**: Detailed charts and variance analysis
- **📁 Multiple Formats**: Support for CSV, Excel (.xlsx, .xls) files
- **🔍 Fuzzy Matching**: Handles data inconsistencies and variations
- **📈 Real-time Dashboard**: Interactive UI with progress tracking
- **📋 Audit Ready**: Detailed reporting and export capabilities
- **🔒 Secure**: Bank-grade security for financial data

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 18 with React Router
- **UI Components**: Custom components with Lucide React icons
- **Styling**: Modern CSS with responsive design
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Axios for API communication

### Backend (Node.js/Express)
- **Runtime**: Node.js with Express framework
- **File Processing**: Multer for uploads, CSV-parser, SheetJS for Excel
- **Matching Engine**: Custom fuzzy matching algorithm
- **Data Export**: CSV and Excel export capabilities
- **API**: RESTful endpoints with comprehensive error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TomWall1/LedgerLink.git
   cd LedgerLink
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Create uploads directory**
   ```bash
   mkdir uploads
   mkdir temp
   ```

### 🏃‍♂️ Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev  # Development mode with nodemon
   # OR
   npm start    # Production mode
   ```
   The API will be available at `http://localhost:5000`

2. **Start the frontend application**
   ```bash
   cd frontend
   npm start
   ```
   The app will be available at `http://localhost:3000`

### 🧪 Testing the Application

1. **Health Check**: Visit `http://localhost:5000/api/health`
2. **Frontend**: Navigate to `http://localhost:3000`
3. **Upload Test Files**: Use the Coupa-NetSuite dashboard to upload sample CSV/Excel files

## 📁 File Format Requirements

### Coupa Invoice Approvals
Your Coupa file should contain these columns (case-insensitive):
- **Invoice Number** (required)
- **Amount** (required) 
- **Date**
- **Vendor**
- **Status**

### NetSuite AR Ledger
Your NetSuite file should contain these columns (case-insensitive):
- **Invoice Number** (required)
- **Amount** (required)
- **Date**
- **Vendor** 
- **AR Status**

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/coupa/upload` | Upload Coupa data file |
| POST | `/api/netsuite/upload` | Upload NetSuite data file |
| POST | `/api/match` | Execute matching algorithm |
| POST | `/api/export/csv` | Export results to CSV |
| POST | `/api/export/excel` | Export results to Excel |

## 🧠 Matching Algorithm

LedgerLink uses a sophisticated multi-stage matching process:

1. **Exact Matching**: Perfect invoice number matches
2. **Fuzzy Matching**: Similarity-based matching using:
   - Invoice number similarity (50% weight)
   - Amount similarity (30% weight)  
   - Vendor similarity (20% weight)
3. **Confidence Scoring**: Each match receives a confidence score (0-100%)
4. **Threshold Filtering**: Only matches above 70% confidence are accepted

## 📊 Dashboard Features

### Upload Tab
- Drag-and-drop file upload
- File validation and processing
- Real-time upload progress
- Data preview and statistics

### Review Tab
- Matched records with confidence scores
- Amount variance highlighting
- Unmatched record analysis
- Interactive data tables

### Results Tab
- Comprehensive analytics dashboard
- Visual charts and metrics
- Variance analysis
- Export options (CSV, Excel)
- Recommended next steps

## 🛠️ Development

### Project Structure
```
LedgerLink/
├── backend/
│   ├── app.js              # Main Express application
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Environment variables template
│   └── uploads/            # File upload directory
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js          # Main React application
│   │   └── index.js        # React entry point
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

### Development Commands

**Backend**
```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start production server
npm test        # Run tests
```

**Frontend**
```bash
npm start       # Start development server
npm run build   # Build for production
npm test        # Run tests
```

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Configure environment variables

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `build`

### Environment Variables for Production
```bash
# Backend (.env)
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Frontend
REACT_APP_API_URL=https://your-backend-domain.onrender.com
```

## 🔒 Security Features

- File type validation (CSV, Excel only)
- File size limits (10MB max)
- CORS configuration
- Input sanitization
- Temporary file cleanup
- Error handling and logging

## 🐛 Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check file format (CSV, .xlsx, .xls only)
   - Verify file size (max 10MB)
   - Ensure required columns are present

2. **No Matches Found**
   - Verify invoice number formats are similar
   - Check for leading/trailing spaces
   - Ensure amount fields contain numeric values

3. **Backend Connection Error**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Confirm API endpoints are accessible

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error messages.

## 📞 Support

- **Email**: support@ledgerlink.com
- **Documentation**: [GitHub Wiki](https://github.com/TomWall1/LedgerLink/wiki)
- **Issues**: [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- Built with React and Node.js
- Icons by Lucide React
- Styling inspired by modern financial applications
- Fuzzy matching algorithms based on Levenshtein distance

---

**Made with ❤️ for finance teams who deserve better tools**