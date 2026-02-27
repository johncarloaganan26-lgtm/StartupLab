import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
