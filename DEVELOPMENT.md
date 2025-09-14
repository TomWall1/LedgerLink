# LedgerLink Development Guide

## 🔗 Repository Access Information

### GitHub Repository
- **URL**: https://github.com/TomWall1/LedgerLink
- **Owner**: TomWall1
- **Branch**: main
- **Access**: Public repository

### Development URLs
- **Frontend Dev**: http://localhost:3000
- **Backend Dev**: http://localhost:3002
- **Production Frontend**: https://ledgerlink.vercel.app/
- **Production Backend**: https://ledgerlink.onrender.com

## 🛠️ GitHub Tools Integration

The AI assistant has access to these GitHub operations:
- `github:get_file_contents` - Read files from repository
- `github:push_files` - Update multiple files in single commit
- `github:create_or_update_file` - Individual file operations
- `github:search_repositories` - Find repositories
- `github:create_repository` - Create new repositories
- `github:create_issue` - Track bugs and features
- `github:create_pull_request` - Code review workflow
- `github:fork_repository` - Fork for contributions
- `github:create_branch` - Branch management

## 🏗️ Project Structure

```
LedgerLink/
├── frontend/                    # React TypeScript Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Base UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── LedgerLinkLogo.tsx
│   │   │   └── layout/         # Layout components
│   │   │       ├── TopNav.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Layout.tsx
│   │   ├── pages/              # Main application pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── Connections.tsx
│   │   │   ├── Counterparties.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── contexts/           # React contexts
│   │   │   └── ToastContext.tsx
│   │   ├── styles/             # Global styles
│   │   │   └── global.css
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   ├── public/                # Static assets
│   ├── build/                 # Production build output
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite build configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── index.html            # HTML template
├── backend/                    # Node.js Express API
├── vercel.json                # Vercel deployment config
├── .gitignore                 # Git ignore rules
├── .vercelignore             # Vercel ignore rules
├── README.md                  # Project documentation
├── DEVELOPMENT.md            # This file
├── package.json              # Root package.json
└── cleanup.js                # Build cleanup script
```

## 🚀 Deployment Configuration

### Vercel (Frontend)
- **Build Command**: `cd frontend && find src -name '*.js' -delete && npm ci --legacy-peer-deps && vite build`
- **Output Directory**: `frontend/build`
- **Framework**: Vite
- **Environment Variables**:
  - `VITE_API_URL`: https://ledgerlink.onrender.com
  - `VITE_API_BASE_URL`: https://ledgerlink.onrender.com/api

### Render (Backend)
- **Build Command**: [To be configured]
- **Start Command**: [To be configured]
- **Environment**: Production

## 🔧 Common Development Tasks

### File Operations
```bash
# Read specific files
github:get_file_contents owner=TomWall1 repo=LedgerLink path=frontend/src/App.tsx

# Update multiple files at once
github:push_files owner=TomWall1 repo=LedgerLink branch=main files=[...] message="Description"
```

### Build and Deploy
```bash
# Local development
cd frontend && npm run dev
cd backend && npm run dev

# Production build
cd frontend && npm run build
```

### Troubleshooting Common Issues
1. **TypeScript Errors**: Check `tsconfig.json` configuration
2. **Build Failures**: Ensure no conflicting `.js` files in src/
3. **Deploy Issues**: Verify `vercel.json` output directory matches Vite config

## 📋 Development Checklist

- [ ] Repository access confirmed
- [ ] Local environment setup complete
- [ ] Can read/write files via GitHub tools
- [ ] Frontend builds successfully
- [ ] Backend API accessible
- [ ] Deployment pipeline working

---

*This document provides all necessary information for AI assistants and developers to quickly access and work with the LedgerLink project.*