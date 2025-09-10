# 🚀 LedgerLink Complete Setup Guide

## 🏁 Final Integration Steps

Your Coupa-NetSuite integration is now complete! Follow these final steps to get everything running.

---

## 🛠️ 1. Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install
```

**New packages added:**
- `multer` - File upload handling
- `csv-parser` - CSV file processing
- `csv-writer` - CSV export functionality
- `xlsx` - Excel file processing
- `dotenv` - Environment variable management

### Frontend Dependencies  
```bash
cd frontend
npm install
```

**New packages added:**
- `axios` - HTTP client for API calls
- `lucide-react` - Modern icon library
- `react-router-dom` - Frontend routing

---

## 📁 2. Create Required Directories

```bash
# In the backend folder
cd backend
mkdir uploads
mkdir temp
mkdir logs
```

**Directory purposes:**
- `uploads/` - Temporary file storage for processing
- `temp/` - Export file generation
- `logs/` - Application logs (optional)

---

## 🔧 3. Environment Configuration

### Backend Environment Setup
```bash
cd backend
cp .env.example .env
```

**Edit your `.env` file:**
```bash
# Required settings
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File upload limits
MAX_FILE_SIZE=10485760
UPLOADS_DIR=./uploads

# Matching algorithm settings
MATCH_CONFIDENCE_THRESHOLD=0.7
FUZZY_MATCH_THRESHOLD=0.6
```

---

## 🏃‍♂️ 4. Start the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

**Expected output:**
```
LedgerLink API server running on port 5000
Health check: http://localhost:5000/api/health
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

---

## 🧪 5. Test the Integration

### Health Check
1. **Backend API**: Visit `http://localhost:5000/api/health`
   - Should return: `{"status":"OK","message":"LedgerLink API is running"}`

2. **Frontend**: Visit `http://localhost:3000`
   - Should show the LedgerLink homepage

### Test File Upload
1. Navigate to **Coupa-NetSuite** in the navigation
2. Prepare test files with these columns:

**Coupa Test File (CSV/Excel):**
```
Invoice Number,Amount,Date,Vendor,Status
INV-001,1000.00,2024-01-15,Acme Corp,Approved
INV-002,2500.50,2024-01-16,Beta Inc,Approved
INV-003,750.25,2024-01-17,Gamma LLC,Approved
```

**NetSuite Test File (CSV/Excel):**
```
Invoice Number,Amount,Date,Vendor,AR Status
INV-001,1000.00,2024-01-15,Acme Corp,Posted
INV-002,2500.50,2024-01-16,Beta Inc,Posted
INV-004,1200.00,2024-01-18,Delta Co,Posted
```

3. Upload both files and run the matching process
4. Review results in the **Review Data** and **Results & Export** tabs

---

## 📊 6. Understanding the Results

### Match Types
- **Perfect Matches**: Exact invoice number and amount matches
- **Amount Variances**: Same invoice number, different amounts
- **Unmatched Records**: Records that couldn't be paired

### Confidence Scores
- **90-100%**: High confidence (exact or near-exact matches)
- **70-89%**: Medium confidence (fuzzy matches)
- **Below 70%**: Low confidence (not shown, filtered out)

### Export Options
- **CSV**: Complete data export with all matched/unmatched records
- **Excel**: Multi-sheet workbook with summary and detailed breakdowns

---

## 🚀 7. Deployment Setup

### Backend Deployment (Render)

1. **Create Render Account** at render.com
2. **Connect GitHub Repository**
3. **Configure Build Settings:**
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node.js

4. **Set Environment Variables:**
   ```
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   MAX_FILE_SIZE=10485760
   MATCH_CONFIDENCE_THRESHOLD=0.7
   ```

### Frontend Deployment (Vercel)

1. **Create Vercel Account** at vercel.com
2. **Connect GitHub Repository**
3. **Configure Project Settings:**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Set Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

---

## 🔍 8. Troubleshooting Guide

### Common Issues & Solutions

#### ❌ "Cannot upload file" Error
**Possible causes:**
- File too large (>10MB)
- Wrong file format (only CSV, .xlsx, .xls allowed)
- Backend not running

**Solutions:**
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check file size
ls -lh your-file.csv

# Verify file format
file your-file.xlsx
```

#### ❌ "No matches found" Issue
**Possible causes:**
- Invoice number formats don't match
- Required columns missing
- Data encoding issues

**Solutions:**
- Ensure both files have "Invoice Number" and "Amount" columns
- Check for leading/trailing spaces in invoice numbers
- Verify amounts are numeric (no currency symbols in data)

#### ❌ Frontend Can't Connect to Backend
**Possible causes:**
- Backend not running on port 5000
- CORS configuration issues
- Firewall blocking connections

**Solutions:**
```bash
# Check if backend is running
netstat -an | grep 5000

# Test API directly
curl -X GET http://localhost:5000/api/health

# Check CORS settings in backend/.env
CORS_ORIGIN=http://localhost:3000
```

---

## 📈 9. Performance Optimization

### For Large Files (10,000+ records)

1. **Increase Memory Limit** (if needed):
   ```bash
   # In package.json start script
   "start": "node --max-old-space-size=4096 app.js"
   ```

2. **Batch Processing** - The algorithm automatically handles large datasets efficiently

3. **Monitor Memory Usage**:
   ```bash
   # Add to your .env
   LOG_LEVEL=debug
   ```

### Database Integration (Future Enhancement)
For production use with thousands of daily reconciliations:
- Add PostgreSQL or MongoDB for data persistence
- Implement user authentication
- Add reconciliation history tracking

---

## 🔐 10. Security Checklist

### Development
- ✅ File type validation implemented
- ✅ File size limits enforced
- ✅ CORS properly configured
- ✅ Input sanitization in place
- ✅ Temporary file cleanup

### Production
- [ ] Add HTTPS/SSL certificates
- [ ] Implement rate limiting
- [ ] Add user authentication
- [ ] Set up logging and monitoring
- [ ] Configure backup procedures

---

## 📞 11. Support & Next Steps

### Getting Help
- **Documentation**: Check the README.md for detailed information
- **Issues**: Report bugs on GitHub Issues
- **Email**: support@ledgerlink.com (if available)

### Enhancements to Consider
- **User Authentication**: Add login/logout functionality
- **Data Persistence**: Store reconciliation history
- **API Integrations**: Direct connections to Coupa/NetSuite APIs
- **Advanced Analytics**: Trend analysis and reporting
- **Email Notifications**: Automated reconciliation reports

### File Templates
Create standardized templates for your team:

**Coupa Template:**
| Invoice Number | Amount | Date | Vendor | Status |
|---------------|--------|------|--------|--------|
| (Required) | (Required) | (Optional) | (Optional) | (Optional) |

**NetSuite Template:**
| Invoice Number | Amount | Date | Vendor | AR Status |
|---------------|--------|------|--------|----------|
| (Required) | (Required) | (Optional) | (Optional) | (Optional) |

---

## ✅ Completion Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables configured
- [ ] Required directories created
- [ ] Backend server starts successfully
- [ ] Frontend application loads
- [ ] Health check endpoint responds
- [ ] File upload functionality tested
- [ ] Matching algorithm tested with sample data
- [ ] Export functionality verified
- [ ] Deployment configuration completed (if needed)

---

**🎉 Congratulations! Your Coupa-NetSuite integration is now complete and ready for use.**

The system will intelligently match your invoice approvals with AR ledger data, providing detailed analytics and comprehensive reporting to streamline your financial reconciliation process.