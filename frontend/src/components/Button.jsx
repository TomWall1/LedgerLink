import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'btn';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    ghost: 'btn-ghost',
    destructive: 'btn-destructive'
  };
  
  const sizes = {
    small: 'px-3 py-1.5 text-small h-8',
    default: 'px-4 py-2 text-base h-10',
    large: 'px-6 py-3 text-large h-12'
  };
  
  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.default,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;