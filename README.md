# LedgerLink - Automated Ledger Reconciliation

A comprehensive web application for automated invoice matching and ledger reconciliation between businesses and their counterparties.

## 🔗 Quick Access Links

- **GitHub Repository**: https://github.com/TomWall1/LedgerLink
- **Live Application**: https://ledgerlink.vercel.app/
- **Backend API**: https://ledgerlink.onrender.com
- **Project Owner**: TomWall1

## 🏗️ Architecture Overview

```
LedgerLink/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── contexts/      # React contexts (Toast, etc.)
│   │   └── styles/        # Global CSS and Tailwind
│   ├── dist/             # Build output
│   └── package.json
├── backend/          # Node.js + Express API
│   ├── src/
│   ├── routes/
│   └── package.json
└── vercel.json       # Deployment configuration
```

## 🚀 Deployment Information

- **Frontend**: Deployed on Vercel
  - Output directory: `frontend/build`
  - Build command: `cd frontend && find src -name '*.js' -delete && vite build`
  - Environment: Production

- **Backend**: Deployed on Render
  - URL: https://ledgerlink.onrender.com
  - API endpoints available at `/api/*`

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Components**: Custom component library

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: [To be documented]
- **Authentication**: [To be implemented]

## 📋 Key Features

- **Landing Page**: Professional marketing site with feature showcase
- **Authentication**: Login/signup flow with session management
- **Dashboard**: Overview of reconciliation metrics and recent activity
- **Invoice Matching**: CSV upload and intelligent matching algorithms
- **ERP Connections**: Integration with Xero, QuickBooks, Sage
- **Counterparty Management**: Invite system for customers/vendors
- **Reporting**: PDF/CSV export with detailed analytics
- **Settings**: User preferences and system configuration

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink

# Install dependencies
npm run install:all

# Start development servers
npm run dev:frontend  # Runs on localhost:3000
npm run dev:backend   # Runs on localhost:3002
```

## 📝 Important Configuration Files

- `vercel.json`: Vercel deployment configuration
- `frontend/vite.config.ts`: Vite build configuration
- `frontend/tsconfig.json`: TypeScript configuration
- `frontend/tailwind.config.js`: Tailwind CSS configuration

## 🎨 Design System

- **Logo**: Professional SVG logo with customizable colors
- **Colors**: Primary (#6366f1), with neutral grays
- **Typography**: Inter font family
- **Components**: Consistent UI library (Button, Card, Input, etc.)

## 🔐 Access Information for Development

- Repository access via GitHub OAuth or personal access tokens
- Vercel deployment triggers on main branch commits
- Render backend deploys automatically from main branch

---

*Last updated: January 2025*