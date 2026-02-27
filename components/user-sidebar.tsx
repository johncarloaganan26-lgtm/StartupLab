'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  ScrollText,
  Home,
  Database,
  Compass,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const navigation = [
  {
    group: 'DASHBOARD',
    groupIcon: Home,
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ]
  },
  {
    group: 'MY ACTIVITY',
    groupIcon: Database,
    items: [
      { href: '/dashboard/registrations', label: 'My Registrations', icon: Ticket },
      { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ]
  },
  {
    group: 'DISCOVERY',
    groupIcon: Compass,
    items: [
      { href: '/dashboard/events', label: 'Browse Events', icon: Calendar },
    ]
  }
];

interface SidebarProps {
  isCollapsed?: boolean;
}

export function UserSidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && theme === 'dark' ? '/login-logo-tight.png?v=4' : '/admin-logo-dark-tight.png?v=4';

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-[260px] md:w-[300px]'} font-roboto border-r border-border bg-white dark:bg-black h-screen flex flex-col transition-all duration-300 z-40 relative p-2`}>
      <div className="p-2 h-16 flex items-center justify-center border-b border-border">
        <Link href="/" className="block">
          {!isCollapsed && (
            <img 
              src={logoSrc} 
              alt="StartupLab" 
              className="h-auto w-[112px] md:w-[124px] max-w-none object-contain"
            />
          )}
          {isCollapsed && (
            <img 
              src={logoSrc} 
              alt="StartupLab" 
              className="h-auto w-6 object-contain rounded-lg"
            />
          )}
        </Link>
      </div>

      <nav className="flex-1 pt-3 pb-1 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navigation.map((section) => (
          <div key={section.group} className="space-y-1">
            {!isCollapsed && (
              <div className="mx-2 my-1 px-3 py-3">
                <div className="flex items-center gap-3">
                  <section.groupIcon className="w-6 h-6 text-black dark:text-slate-300" />
                  <span className="sidebar-section-header text-[16px] text-black dark:text-slate-300">{section.group}</span>
                </div>
              </div>
            )}
            <div className={`${!isCollapsed ? 'ml-9 mr-2 space-y-1' : 'space-y-1'}`}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

                return (
                  <Link key={item.href} href={item.href} className="block group">
                    <div
                      className={`flex items-center min-h-12 rounded-lg ${isCollapsed ? 'justify-center p-3 mx-2 my-1' : 'px-3 py-3'} gap-3 transition-all ${isActive
                        ? 'bg-sky-600 text-white border-r-4 border-sky-400'
                        : 'text-black dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-900 hover:text-black dark:hover:text-white'
                        }`}
                    >
                      <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} shrink-0 ${isActive ? 'text-white' : 'text-black dark:text-slate-300'}`} />
                      {!isCollapsed && <span className={`sidebar-page-item text-[16px] ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
