import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeVariants = {
  default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  error: 'bg-error-100 text-error-800 border-error-200',
};

const badgeSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1.5 text-sm',
  lg: 'px-3 py-2 text-base',
};

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className 
}) => {
  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export { Badge };