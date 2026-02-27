'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const navigation = [
  {
    group: 'DASHBOARD',
    groupIconName: 'home',
    items: [
      { href: '/dashboard', label: 'Overview', iconName: 'dashboard' },
    ]
  },
  {
    group: 'MY ACTIVITY',
    groupIconName: 'database',
    items: [
      { href: '/dashboard/registrations', label: 'My Registrations', iconName: 'ticket' },
      { href: '/dashboard/audit-logs', label: 'Audit Logs', iconName: 'clipboard' },
    ]
  },
  {
    group: 'DISCOVERY',
    groupIconName: 'compass',
    items: [
      { href: '/dashboard/events', label: 'Browse Events', iconName: 'calendar' },
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
      <div className="p-3 h-20 flex items-center justify-center border-b border-border">
        <Link href="/" className="block">
          {!isCollapsed && (
            <img 
              src={logoSrc} 
              alt="StartupLab" 
              className="h-[56px] w-[180px] max-w-none object-contain"
            />
          )}
          {isCollapsed && (
            <img 
              src={logoSrc} 
              alt="StartupLab" 
              className="h-10 w-10 object-contain rounded-lg"
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
                  <FlatIcon name={section.groupIconName} className="w-6 h-6 text-[#3A3A3A] dark:text-slate-200" />
                  <span className="sidebar-section-header text-[16px] text-black dark:text-slate-300">{section.group}</span>
                </div>
              </div>
            )}
            <div className={`${!isCollapsed ? 'ml-9 mr-2 space-y-1' : 'space-y-1'}`}>
              {section.items.map((item) => {
                const iconName = (item as any).iconName;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

                return (
                  <Link key={item.href} href={item.href} className="block group">
                    <div
                      className={`flex items-center min-h-12 rounded-lg ${isCollapsed ? 'justify-center p-3 mx-2 my-1' : 'px-3 py-3'} gap-3 transition-colors ${isActive
                        ? 'bg-slate-200 dark:bg-slate-800 text-[#1f2937] dark:text-white'
                        : 'text-[#3A3A3A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                    >
                      <FlatIcon
                        name={iconName}
                        className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} shrink-0 ${isActive ? 'text-[#1f2937] dark:text-white' : 'text-[#3A3A3A] dark:text-slate-200'}`}
                      />
                      {!isCollapsed && <span className={`sidebar-page-item text-[16px] ${isActive ? 'font-semibold text-[#1f2937] dark:text-white' : 'text-[#3A3A3A] dark:text-slate-200'}`}>{item.label}</span>}
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

function FlatIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="m12 3 9 8v10h-6v-6H9v6H3V11l9-8Z" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M4 5c0-1.657 3.582-3 8-3s8 1.343 8 3v14c0 1.657-3.582 3-8 3s-8-1.343-8-3V5Zm2 4.126V15c0 .54 2.385 1.7 6 1.7s6-1.16 6-1.7V9.126C15.91 9.7 13.834 10 12 10s-3.91-.3-6-.874ZM18 5c0-.54-2.385-1.7-6-1.7S6 4.46 6 5c0 .54 2.385 1.7 6 1.7S18 5.54 18 5Z" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="m10 4 9 5-5 3-9-5 5-3Zm-1 7 9 5-5 3-9-5 5-3Z" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M3 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm10 0a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V4ZM3 14a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Zm10 0a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4Z" />
        </svg>
      );
    case 'user':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2a5 5 0 0 1 5 5c0 2.8-2.24 5-5 5s-5-2.2-5-5a5 5 0 0 1 5-5Zm0 12c4.418 0 8 2.239 8 5v3H4v-3c0-2.761 3.582-5 8-5Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm13 6H4v12h16V8Z" />
        </svg>
      );
    case 'ticket':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V6Zm4 1h2v10H7V7Zm4 0h2v10h-2V7Z" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M9 3h6a2 2 0 0 1 2 2h2v16H5V5h2a2 2 0 0 1 2-2Zm0 2v1h6V5H9Zm0 6h6v2H9v-2Zm0 4h4v2H9v-2Z" />
        </svg>
      );
    default:
      return null;
  }
}
