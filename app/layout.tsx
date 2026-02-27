import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/contexts/app-context'
import { LoadingProvider } from '@/contexts/loading-context'
import { LoadingOverlay } from '@/components/loading-overlay'
import { LoadingBar } from '@/components/loading-bar'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'StartupLab Event Registration',
  description: 'Innovate. Connect. Build. Join exclusive startup events and workshops.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/stb.webp',
        type: 'image/webp',
      },
    ],
    apple: '/stb.webp',
  },
}

import { RootThemeProvider } from '@/components/root-theme-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_inter.className} font-sans antialiased`}>
        <LoadingProvider>
          <AppProvider>
            <RootThemeProvider>
              {children}
              <LoadingOverlay />
              <LoadingBar />
            </RootThemeProvider>
            <Toaster />
          </AppProvider>
        </LoadingProvider>
        <Analytics />
      </body>
    </html>
  )
}
