import React from 'react';

const Badge = ({ 
  children, 
  variant = 'neutral',
  className = '',
  ...props 
}) => {
  const baseClasses = 'badge';
  
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    neutral: 'badge-neutral'
  };
  
  const classes = [
    baseClasses,
    variants[variant] || variants.neutral,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

// Confidence Badge for LedgerLink reconciliation
export const ConfidenceBadge = ({ score, className = '', ...props }) => {
  const getVariant = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'neutral'; 
    if (score >= 50) return 'warning';
    return 'error';
  };
  
  const getLabel = (score) => {
    if (score >= 90) return 'High Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Low Match';
    return 'No Match';
  };
  
  return (
    <Badge 
      variant={getVariant(score)} 
      className={className}
      {...props}
    >
      {score}% {getLabel(score)}
    </Badge>
  );
};

export default Badge;