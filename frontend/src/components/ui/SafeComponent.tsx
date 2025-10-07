/**
 * Safe Component Wrapper
 * 
 * Wraps a component in an error boundary to prevent crashes
 */

import React from 'react';
import { Card, CardContent } from './Card';

interface SafeComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SafeComponentState {
  hasError: boolean;
  error?: Error;
}

export class SafeComponent extends React.Component<SafeComponentProps, SafeComponentState> {
  constructor(props: SafeComponentProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeComponentState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SafeComponent caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">This section is temporarily unavailable</h3>
            <p className="text-neutral-600">
              Don't worry - your other features still work perfectly!
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SafeComponent;
