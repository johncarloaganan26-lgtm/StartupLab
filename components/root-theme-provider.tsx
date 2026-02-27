'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider } from './theme-provider';

interface RootThemeProviderProps {
    children: React.ReactNode;
}

export function RootThemeProvider({ children }: RootThemeProviderProps) {
    const pathname = usePathname();

    // Public pages that should always be light mode
    const isPublicArea = !pathname?.startsWith('/admin') && !pathname?.startsWith('/dashboard');

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            forcedTheme={isPublicArea ? 'light' : undefined}
        >
            {children}
        </ThemeProvider>
    );
}
