# LedgerLink Frontend

A modern React application for AI-powered invoice reconciliation built with TypeScript, Vite, and Tailwind CSS.

## Features

- 🎯 **Modern Stack**: React 18, TypeScript, Vite
- 🎨 **Beautiful UI**: Tailwind CSS with custom design system
- 📱 **Responsive**: Mobile-first design approach
- ♿ **Accessible**: WCAG 2.1 compliant components
- 🚀 **Fast**: Optimized builds and code splitting
- 🔒 **Type Safe**: Full TypeScript coverage

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   └── layout/         # Layout components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── utils/              # Utility functions
├── data/               # Mock data and types
└── styles/             # Global styles
```

## Key Features

### Dashboard
- Real-time metrics and KPIs
- Recent activity feed
- Quick actions and shortcuts

### Connections
- ERP system integrations (Xero, QuickBooks, Sage, NetSuite)
- OAuth 2.0 authentication flows
- Counterparty link management

### Matches
- AI-powered invoice matching
- CSV upload functionality
- Detailed confidence scoring
- Manual review workflows

### Reports
- Multiple report templates
- PDF/CSV/Excel export
- Scheduled reporting
- Audit trails

### Settings
- User profile management
- Matching rule configuration
- Notification preferences
- Security settings

## Design System

### Colors
- **Primary**: Blue scale for main actions
- **Neutral**: Gray scale for text and backgrounds
- **Success**: Green for positive states
- **Warning**: Yellow for attention states
- **Error**: Red for error states

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Semantic sizing (h1-h6, body, small)
- **Weight**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Components
- Consistent spacing and sizing
- Focus states for accessibility
- Loading and error states
- Responsive behavior

## Performance

- Code splitting by route and vendor packages
- Image optimization and lazy loading
- Tree shaking for minimal bundle size
- Service worker ready for PWA

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add TypeScript types for all new code
3. Include tests for new components
4. Update documentation as needed

## Environment Variables

Create a `.env.local` file for local development:

```
VITE_API_URL=https://ledgerlink.onrender.com
VITE_APP_NAME=LedgerLink
VITE_APP_VERSION=1.0.0
```

## Build Configuration

- **Vite**: Fast build tool with HMR
- **TypeScript**: Type checking and compilation
- **ESLint**: Code linting and formatting
- **Tailwind CSS**: Utility-first styling
- **PostCSS**: CSS processing and optimization

## Deployment

The app is configured for deployment on Vercel:

```bash
# Deploy to Vercel
npm run build
vercel --prod
```

## License

MIT License - see LICENSE file for details