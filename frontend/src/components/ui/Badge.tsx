import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'confidence';
  size?: 'sm' | 'md';
  score?: number;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  score,
  children,
  className
}) => {
  // Special handling for confidence scores
  if (variant === 'confidence' && typeof score === 'number') {
    const getConfidenceVariant = (score: number) => {
      if (score >= 90) return 'success';
      if (score >= 70) return 'warning';
      return 'error';
    };
    
    variant = getConfidenceVariant(score);
  }
  
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };
  
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error: 'bg-error-100 text-error-700'
  };
  
  return (
    <span
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};