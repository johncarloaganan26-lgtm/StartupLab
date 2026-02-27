'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type RevealProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
  once?: boolean;
  delayMs?: number;
};

export function Reveal<T extends React.ElementType = 'div'>({
  as,
  className,
  children,
  once = true,
  delayMs = 0,
}: RevealProps<T>) {
  const Comp = (as ?? 'div') as React.ElementType;
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== 'undefined') {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (reduceMotion) {
        setVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Comp
      ref={ref as any}
      className={cn(
        'will-change-transform will-change-opacity',
        !visible && 'opacity-0 translate-y-4',
        visible && 'animate-in fade-in-0 slide-in-from-bottom-4 duration-700',
        className
      )}
      style={delayMs ? ({ animationDelay: `${delayMs}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Comp>
  );
}

