'use client';

import { useLoading } from '@/contexts/loading-context';
import { useEffect, useState } from 'react';

export function LoadingBar() {
  const { isLoading, loadingMessage } = useLoading();
  const [progress, setProgress] = useState(0);

  // Animate progress when loading
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slowly increase progress, but never reach 100% while loading
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-primary/20">
      <div 
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 95)}%` }}
      />
      {loadingMessage && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-medium text-primary bg-background/90 px-2 py-0.5 rounded shadow-sm">
          {loadingMessage}
        </div>
      )}
    </div>
  );
}

// Alternative: A line at the bottom
export function LoadingLine() {
  const { isLoading, loadingMessage } = useLoading();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setWidth(0);
      const interval = setInterval(() => {
        setWidth((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setWidth(0);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998]">
      {loadingMessage && (
        <div className="bg-primary/90 text-primary-foreground text-xs font-medium py-1 px-3 text-center">
          {loadingMessage}
        </div>
      )}
      <div className="h-0.5 bg-primary/30">
        <div 
          className="h-full bg-primary transition-all duration-200 ease-out"
          style={{ width: `${Math.min(width, 95)}%` }}
        />
      </div>
    </div>
  );
}
