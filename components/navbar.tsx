'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useApp } from '@/contexts/app-context';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, authLoading } = useApp();
  const dashboardHref = user?.role === 'admin' ? '/admin' : '/dashboard';
  const isHome = pathname === '/';
  const isMarketingPage = isHome || pathname === '/contact' || pathname.startsWith('/events');
  const navPositionClass = isHome ? 'fixed' : 'sticky';
  const headerHeightClass = isMarketingPage ? 'h-12' : 'h-16';
  const logoClass = isMarketingPage ? 'w-[150px] h-auto' : 'w-[210px] h-auto';
  const navGapClass = isMarketingPage ? 'gap-5' : 'gap-6';
  const logoSrc = '/Dark-e1735336357773.png';
  const headerPillClass = `rounded-full bg-white ${isMarketingPage ? 'px-3 py-1.5' : 'px-4 py-2'} shadow-md ring-1 ring-black/5`;
  const navLinkClass =
    "relative pb-1 text-sm md:text-base text-slate-900/70 hover:text-slate-900 transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:bg-sky-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100";
  const buttonSize = isHome ? 'default' : 'sm';
  const navLinks = [
    { href: isHome ? '#hero' : '/#hero', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className={`${navPositionClass} top-0 left-0 right-0 z-50 bg-transparent`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center ${headerHeightClass}`}>
          <div className="w-full flex justify-center">
            <div className={`w-full ${isMarketingPage ? 'max-w-2xl' : 'max-w-4xl'} flex items-center justify-between gap-4 ${headerPillClass}`}>
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src={logoSrc}
                  alt="Startup Lab"
                  width={220}
                  height={60}
                  className={logoClass}
                />
              </Link>

              <div className={`hidden md:flex items-center ${navGapClass}`}>
                {navLinks.map((item) =>
                  item.href.startsWith('#') ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className={navLinkClass}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={navLinkClass}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>

              <div className="flex items-center gap-4">
                {!authLoading && (
                  isAuthenticated ? (
                    <Link href={dashboardHref}>
                      <Button
                        size={buttonSize as any}
                        variant="outline"
                        className="group relative overflow-hidden bg-transparent text-slate-900 border-slate-200 hover:bg-transparent hover:text-white"
                      >
                        <span
                          aria-hidden
                          className="absolute inset-0 translate-y-full bg-sky-500 transition-transform duration-300 ease-out group-hover:translate-y-0"
                        />
                        <span className="relative z-10">Dashboard</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Sign in"
                            className="text-slate-900 transition-colors hover:bg-sky-500 hover:text-white"
                          >
                            <User className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={8}>
                          Sign in
                        </TooltipContent>
                      </Tooltip>
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
