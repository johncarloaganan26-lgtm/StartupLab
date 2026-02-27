'use client';

import { useLoading } from '@/contexts/loading-context';
import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 p-8 bg-card border border-border rounded-lg shadow-xl">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        {loadingMessage && (
          <p className="text-sm font-medium text-foreground animate-pulse">
            {loadingMessage}
          </p>
        )}
      </div>
    </div>
  );
}

// Inline loading spinner for buttons and smaller areas
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  isLoading, 
  loadingText, 
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button 
      disabled={disabled || isLoading} 
      className={`relative ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText || children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
