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
      { href: '/admin', label: 'Overview', iconName: 'dashboard' },
    ]
  },
  {
    group: 'RECORDS',
    groupIconName: 'database',
    items: [
      { href: '/admin/users', label: 'Users', iconName: 'user' },
      { href: '/admin/events', label: 'Events', iconName: 'calendar' },
      { href: '/admin/registrations', label: 'Registrations', iconName: 'ticket' },
    ]
  },
  {
    group: 'MAINTENANCE',
    groupIconName: 'settings',
    items: [
      { href: '/admin/reports', label: 'Analytics', iconName: 'analytics' },
      { href: '/admin/archive', label: 'Archive', iconName: 'archive' },
      { href: '/admin/audit-logs', label: 'Audit Trail', iconName: 'clipboard' },
      { href: '/admin/settings', label: 'Settings', iconName: 'sliders' },
    ]
  }
];

interface SidebarProps {
  isCollapsed?: boolean;
}

const ADMIN_SIDEBAR_GROUPS_KEY = 'admin-sidebar-open-groups';

function FlatIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
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
    case 'analytics':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M4 20v-8h3v8H4Zm6 0V4h3v16h-3Zm6 0v-5h3v5h-3Z" />
        </svg>
      );
    case 'archive':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M3 4h18v4H3V4Zm2 6h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8Zm4 2v2h6v-2H9Z" />
        </svg>
      );
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
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M10.325 4.317a1.5 1.5 0 0 1 3.35 0l.187.93a1.5 1.5 0 0 0 1.095 1.146l.93.248a1.5 1.5 0 0 1 .987 1.898l-.31.92a1.5 1.5 0 0 0 .366 1.52l.67.67a1.5 1.5 0 0 1 0 2.122l-.67.67a1.5 1.5 0 0 0-.366 1.52l.31.92a1.5 1.5 0 0 1-.987 1.898l-.93.248a1.5 1.5 0 0 0-1.095 1.146l-.187.93a1.5 1.5 0 0 1-3.35 0l-.187-.93a1.5 1.5 0 0 0-1.095-1.146l-.93-.248a1.5 1.5 0 0 1-.987-1.898l.31-.92a1.5 1.5 0 0 0-.366-1.52l-.67-.67a1.5 1.5 0 0 1 0-2.122l.67-.67a1.5 1.5 0 0 0 .366-1.52l-.31-.92a1.5 1.5 0 0 1 .987-1.898l.93-.248a1.5 1.5 0 0 0 1.095-1.146l.187-.93ZM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M9 3h6a2 2 0 0 1 2 2h2v16H5V5h2a2 2 0 0 1 2-2Zm0 2v1h6V5H9Zm0 6h6v2H9v-2Zm0 4h4v2H9v-2Z" />
        </svg>
      );
    case 'sliders':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M5 4h4v3h2v3H9v2h2v3H9v3H5v-3H3v-3h2v-2H3V7h2V4Zm14 0v3h2v3h-2v2h2v3h-2v3h-4v-3h-2v-3h2v-2h-2V7h2V4h4Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminSidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={`${isCollapsed ? 'w-16' : 'w-[230px] md:w-[240px]'} bg-white h-screen shrink-0`} />;

  const logoSrc = mounted && theme === 'dark' ? '/login-logo-tight.png?v=4' : '/admin-logo-dark-tight.png?v=4';

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-[230px] md:w-[240px]'} font-portal admin-excel-sidebar bg-white border-r border-[#eef1f5] h-screen flex flex-col transition-all duration-300 z-40 relative shadow-[5px_0_30px_rgba(0,0,0,0.04)] dark:bg-[#0f172a] dark:border-[#334155]`}>
      {/* Header with Original Logo */}
      <div className="px-4 py-3 h-[78px] flex items-center justify-center border-b border-[#f0f0f0] dark:border-[#334155]">
        <Link href="/" className="block">
          {!isCollapsed && (
            <img
              src={logoSrc}
              alt="StartupLab"
              className="h-[50px] w-[172px] max-w-none object-contain"
            />
          )}
          {isCollapsed && (
            <img
              src="/stb.webp"
              alt="StartupLab"
              className="h-9 w-9 object-contain rounded-sm"
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-0 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navigation.flatMap(s => s.items).map((item) => {
          const iconName = (item as any).iconName;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="block group focus:outline-none"
            >
              <div
                className={`flex items-center min-h-[44px] ${isCollapsed ? 'justify-center p-2' : 'px-5 py-3'} gap-3 rounded-none transition-all duration-200 ${isActive
                  ? 'bg-[#1f7fe0] text-white shadow-md'
                  : 'text-[#495057] hover:bg-[#f8f9fa] hover:translate-x-1 dark:text-[#cbd5e1] dark:hover:bg-[#1e293b]'
                  }`}
              >
                <FlatIcon
                  name={iconName}
                  className={`${isCollapsed ? 'w-6 h-6' : 'w-[18px] h-[18px]'} shrink-0 ${isActive ? 'text-white' : 'text-[#343a40] dark:text-slate-400'}`}
                />
                {!isCollapsed && (
                  <span className={`text-[14.5px] font-medium tracking-tight ${isActive ? 'text-white' : 'text-[#495057] dark:text-[#cbd5e1]'}`}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
