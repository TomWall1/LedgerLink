import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Show animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  // Auto dismiss
  useEffect(() => {
    if (duration <= 0) return;
    
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(id);
    }, 240); // Match animation duration
  };
  
  const variantClasses = {
    default: 'bg-white border-neutral-200 text-neutral-900',
    success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    error: 'bg-error-50 border-error-200 text-error-800',
  };
  
  const iconClasses = {
    default: 'text-primary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    error: 'text-error-500',
  };
  
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <div
      className={cn(
        'flex items-start p-4 rounded-lg border shadow-md max-w-md transition-all duration-240 ease-smooth transform',
        variantClasses[variant],
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isLeaving && '-translate-x-full opacity-0'
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className={cn('flex-shrink-0', iconClasses[variant])}>
        {getIcon()}
      </div>
      
      <div className="ml-3 flex-1">
        {title && (
          <p className="text-sm font-medium">
            {title}
          </p>
        )}
        {description && (
          <p className={cn('text-sm', title ? 'mt-1' : '')}>
            {description}
          </p>
        )}
      </div>
      
      <button
        type="button"
        className="ml-4 flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors duration-120"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  
  const container = (
    <div className="fixed top-4 right-4 z-toast space-y-3">
      {toasts.slice(0, 4).map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
  
  return createPortal(container, document.body);
};

export { Toast, ToastContainer };