# Customer Invoice Matching Updates

## Overview

The customer invoice matching feature has been updated to match the implementation from the Ledger-Match repository, incorporating several improvements:

1. Simplified the interface to focus exclusively on customer invoice matching
2. Added CSV file upload functionality for matching against invoices
3. Enhanced UI with a clearer three-step process
4. Improved matching algorithm with confidence scores

## Changes Made

### Frontend Changes

1. **Simplified Navigation**
   - Removed the "Transaction Matching" dropdown menu
   - Renamed menu item to just "Invoice Matching"
   - Redirected all matching links to go to Customer Invoice Matching

2. **Enhanced CustomerTransactionMatcher Component**
   - Implemented a clear 3-panel layout:
     - Panel 1: Customer selection from Xero
     - Panel 2: CSV file upload with date format selection
     - Panel 3: Match review with approve/reject functionality
   - Added file upload interface with FileUpload component
   - Added date format selection for CSV parsing
   - Added "Include historical data" option

3. **Added Supporting Components**
   - FileUpload.jsx: Clean UI for uploading CSV files
   - DateFormatSelect.jsx: Dropdown for selecting CSV date formats

### Backend Changes

1. **CSV Processing**
   - Added fileController.js with:
     - File upload handling using multer
     - CSV parsing utilities
     - Date format conversion logic

2. **Updated Transaction Routes**
   - Added /match-customer-invoices endpoint for file upload and matching
   - Enhanced match confidence scoring algorithm
   - Added /approve-customer-match endpoint to approve matches

## Key Features

### Three-Step Matching Process

1. **Select a Customer**
   - Browse customers from your Xero account
   - View customer name and contact information
   - See outstanding invoices automatically loaded

2. **Upload CSV Data**
   - Upload a CSV file with transaction data
   - Select the appropriate date format
   - Option to include historical data

3. **Review Matches**
   - See all outstanding invoices for the selected customer
   - View potential matches with confidence scores
   - Approve or reject matches individually

### Improved Matching Algorithm

The matching algorithm now calculates a confidence score based on:

- **Amount matching** (50% of score): Exact match of invoice amounts
- **Date proximity** (30% of score): Dates within 7 days of each other
- **Reference matching** (20% of score): Invoice number appears in transaction reference

Matches with a confidence score of at least 50% are shown, with color-coded indicators:
- Green: High confidence (80-100%)
- Yellow: Medium confidence (60-79%)
- Red: Low confidence (50-59%)

## CSV Requirements

The CSV file should include headers with the following:

- **Required columns:**
  - transaction_number (or id, reference_number, reference)
  - amount (or value)
  - date (or transaction_date, invoice_date)

- **Optional columns:**
  - reference
  - description (or notes)
  - status

## Usage Instructions

1. Navigate to the "Invoice Matching" menu item
2. Select a customer from the left panel
3. Upload a CSV file in the middle panel
4. Click "Find Matches"
5. Review and approve/reject matches in the right panel

## Future Enhancements

- Add support for matching against other ERP systems beyond Xero
- Implement batch processing for multiple customers
- Add custom CSV column mapping
- Enhance reporting and export options for matched invoices