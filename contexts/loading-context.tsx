'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((message: string = 'Loading...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setIsLoading(loading);
    if (loading && message) {
      setLoadingMessage(message);
    } else if (!loading) {
      setLoadingMessage('');
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, startLoading, stopLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  // Return default values if used outside provider (for backwards compatibility)
  if (!context) {
    return {
      isLoading: false,
      loadingMessage: '',
      startLoading: () => {},
      stopLoading: () => {},
      setLoading: () => {},
    };
  }
  return context;
};

// Hook for easier loading state management during async operations
export const useActionLoading = () => {
  const { startLoading, stopLoading, setLoading } = useLoading();

  const withLoading = useCallback(async <T,>(
    action: () => Promise<T>,
    options?: { message?: string; onSuccess?: (result: T) => void; onError?: (error: Error) => void }
  ): Promise<T | undefined> => {
    const { message = 'Processing...', onSuccess, onError } = options || {};
    
    try {
      startLoading(message);
      const result = await action();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      return undefined;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return { withLoading, setLoading };
};
