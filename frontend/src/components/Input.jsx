import React from 'react';

const Input = ({ 
  label,
  error,
  helperText,
  className = '',
  id,
  required = false,
  ...props 
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        className={`input ${error ? 'error' : ''}`}
        {...props}
      />
      
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-small text-neutral-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;