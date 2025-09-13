import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/Toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      ...options,
      onDismiss: (toastId: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
      },
    };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success: (message: string, title?: string) => addToast({ 
      variant: 'success', 
      description: message, 
      title 
    }),
    error: (message: string, title?: string) => addToast({ 
      variant: 'error', 
      description: message, 
      title 
    }),
    warning: (message: string, title?: string) => addToast({ 
      variant: 'warning', 
      description: message, 
      title 
    }),
    info: (message: string, title?: string) => addToast({ 
      variant: 'default', 
      description: message, 
      title 
    }),
  };
};