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
    <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-[#1f7fe0]/20">
      <div 
        className="h-full bg-[#1f7fe0] transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 95)}%` }}
      />
      {loadingMessage && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#1f7fe0] bg-white/95 border border-[#cfe2fb] px-2 py-0.5 rounded shadow-sm dark:bg-[#0f172a]/95 dark:border-[#334155]">
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
        <div className="bg-[#1f7fe0] text-white text-xs font-medium py-1 px-3 text-center">
          {loadingMessage}
        </div>
      )}
      <div className="h-0.5 bg-[#1f7fe0]/30">
        <div 
          className="h-full bg-[#1f7fe0] transition-all duration-200 ease-out"
          style={{ width: `${Math.min(width, 95)}%` }}
        />
      </div>
    </div>
  );
}
