import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// Animation keyframes
const slideInFromRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutToRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Styled components
const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: ${props => theme('spacing.sm')};
  pointer-events: none;
`;

const ToastItem = styled.div<{ variant: 'success' | 'error' | 'warning' | 'info'; isExiting: boolean }>`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  border-radius: ${props => theme('radii.md')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  box-shadow: ${props => theme('shadows.md')};
  pointer-events: auto;
  max-width: 400px;
  word-wrap: break-word;
  
  animation: ${props => props.isExiting ? slideOutToRight : slideInFromRight} 0.3s ease-out forwards;
  
  background: ${props => {
    switch (props.variant) {
      case 'success':
        return theme('colors.success');
      case 'error':
        return theme('colors.error');
      case 'warning':
        return theme('colors.warning');
      case 'info':
      default:
        return theme('colors.accent');
    }
  }};
  
  color: ${props => theme('colors.bg')};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success':
        return `${theme('colors.success')}CC`;
      case 'error':
        return `${theme('colors.error')}CC`;
      case 'warning':
        return `${theme('colors.warning')}CC`;
      case 'info':
      default:
        return `${theme('colors.accent')}CC`;
    }
  }};
`;

// Toast interface
export interface ToastMessage {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  const [exitingToasts, setExitingToasts] = useState<Set<string>>(new Set());
  
  const handleToastExit = (id: string) => {
    setExitingToasts(prev => new Set(prev).add(id));
    
    // Remove after animation completes
    setTimeout(() => {
      removeToast(id);
      setExitingToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };
  
  // Auto-remove toasts after their duration
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    toasts.forEach(toast => {
      if (!exitingToasts.has(toast.id)) {
        const timeout = setTimeout(() => {
          handleToastExit(toast.id);
        }, toast.duration);
        
        timeouts.push(timeout);
      }
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [toasts, exitingToasts]);
  
  if (toasts.length === 0) return null;
  
  return (
    <ToastContainer>
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          variant={toast.variant}
          isExiting={exitingToasts.has(toast.id)}
          onClick={() => handleToastExit(toast.id)}
        >
          {toast.message}
        </ToastItem>
      ))}
    </ToastContainer>
  );
}

// Toast Provider and hook
interface ToastContextType {
  showToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const showToast = (
    message: string, 
    variant: 'success' | 'error' | 'warning' | 'info' = 'info', 
    duration = 3000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { id, message, variant, duration };
    
    setToasts(prev => [...prev, newToast]);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}