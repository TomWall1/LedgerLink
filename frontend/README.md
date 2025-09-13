# LedgerLink Frontend

A modern React application for AI-powered invoice reconciliation.

## Features

- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Component Library**: Reusable UI components with consistent design
- **Mock Data**: Comprehensive demo data for testing and development
- **Toast Notifications**: User-friendly feedback system
- **Accessibility**: WCAG compliant design patterns

## Tech Stack

- **React 18** - UI library with hooks and modern patterns
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **ESLint** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

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

# Run linting
npm run lint

# Run tests
npm run test
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── ui/             # Basic UI components (Button, Card, etc.)
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── data/               # Mock data and types
└── styles/             # Global styles and Tailwind config
```

## Key Components

### Pages
- **Dashboard** - Overview of reconciliation metrics and recent activity
- **Connections** - ERP system integrations and counterparty links
- **Matches** - Invoice matching interface with CSV upload and results
- **Reports** - Generate and download reconciliation reports
- **Settings** - User preferences and system configuration

### UI Components
- **Button** - Various button styles and states
- **Card** - Content containers with headers
- **Input** - Form inputs with validation states
- **Table** - Data tables with sorting and expansion
- **Badge** - Status indicators and labels
- **Modal** - Dialog windows and overlays

### Features
- **Authentication** - Login/logout with user state management
- **Navigation** - Responsive sidebar with page routing
- **Toast System** - Global notification system
- **Mock Data** - Realistic demo data for all features

## Design System

The application uses a consistent design system based on:

- **Colors**: Primary (blue), Success (green), Warning (yellow), Error (red), Neutral (gray)
- **Typography**: Hierarchical text styles (h1-h6, body, small)
- **Spacing**: Consistent padding and margin using Tailwind's spacing scale
- **Components**: Reusable patterns with prop-based customization

## Development Guidelines

### Code Style
- Use TypeScript for all components and utilities
- Follow React hooks patterns for state management
- Use Tailwind classes for styling (avoid custom CSS when possible)
- Implement proper prop types and interfaces
- Add loading and error states for user interactions

### Component Guidelines
- Keep components small and focused on single responsibilities
- Use composition over inheritance
- Implement proper accessibility (ARIA labels, keyboard navigation)
- Add prop documentation with TypeScript interfaces
- Handle edge cases (empty states, errors, loading)

### Testing
- Write unit tests for utility functions
- Test component rendering and user interactions
- Mock external dependencies and API calls
- Test accessibility requirements

## Deployment

The frontend is configured for deployment on Vercel:

1. Build the application: `npm run build`
2. Deploy to Vercel: Connect repository and auto-deploy on push
3. Environment variables are configured in Vercel dashboard

## Performance

- Uses Vite for fast development and optimized production builds
- Components are designed for efficient re-rendering
- Images and assets are optimized for web delivery
- Bundle splitting for optimal loading performance

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the established code style and component patterns
2. Add TypeScript types for all new interfaces
3. Test components in different screen sizes
4. Update documentation for new features
5. Ensure accessibility compliance

## License

MIT License - see LICENSE file for details
