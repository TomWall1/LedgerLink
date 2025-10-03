import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    // Base button classes from style guide
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-short';
    
    // Variant classes from style guide
    const variantClasses = {
      primary: 'bg-primary-500 text-white hover:bg-primary-700 hover:-translate-y-px active:translate-y-0 shadow-[0_6px_18px_rgba(42,143,230,0.12)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      secondary: 'bg-white text-primary-700 border border-border hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed',
      destructive: 'bg-error text-white hover:bg-error-600 disabled:opacity-50 disabled:cursor-not-allowed',
    };
    
    // Size classes from style guide (height 40px for normal)
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
    };
    
    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
