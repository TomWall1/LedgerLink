import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'confidence';
  score?: number; // For confidence badges
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', score, children, ...props }, ref) => {
    const getConfidenceVariant = (score: number) => {
      if (score >= 90) return 'success';
      if (score >= 70) return 'default';
      return 'warning';
    };
    
    const actualVariant = variant === 'confidence' && score !== undefined 
      ? getConfidenceVariant(score) 
      : variant;
    
    const variantClasses = {
      default: 'bg-primary-100 text-primary-700 border-primary-200',
      success: 'bg-success-100 text-success-600 border-success-200',
      warning: 'bg-warning-100 text-warning-600 border-warning-200',
      error: 'bg-error-100 text-error-600 border-error-200',
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
          variantClasses[actualVariant],
          className
        )}
        {...props}
      >
        {children}
        {variant === 'confidence' && score !== undefined && (
          <span className="ml-1 font-mono">{score}%</span>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };