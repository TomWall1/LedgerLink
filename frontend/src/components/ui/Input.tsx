import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Input component with style guide specs
// Height: 40px, border 1px solid border, radius 6px
// Focus: 2px ring primary-300 + box-shadow
// Error: border error, small inline error text 12px
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    
    // Base input classes from style guide
    const baseClasses = 'w-full h-10 px-3 py-2 text-body font-sans bg-white border rounded-sm transition-all duration-short';
    const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500';
    const errorClasses = error ? 'border-error' : 'border-border';
    
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            baseClasses,
            focusClasses,
            errorClasses,
            {
              'pl-10': leftIcon,
              'pr-10': rightIcon
            },
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
