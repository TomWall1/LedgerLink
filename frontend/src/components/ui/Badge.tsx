import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

// Badge component with style guide specs
// Small rounded rectangles, 12px-14px text
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    
    // Base badge classes from style guide
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-sm text-small font-medium';
    
    // Variant classes from style guide
    const variantClasses = {
      default: 'bg-neutral-200 text-neutral-700',
      success: 'bg-success-100 text-success-600',
      warning: 'bg-warning-100 text-warning-600',
      error: 'bg-error-100 text-error-600',
      info: 'bg-primary-300/20 text-primary-700',
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
