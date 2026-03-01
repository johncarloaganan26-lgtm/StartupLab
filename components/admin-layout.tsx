'use client';

import { useState, useEffect, useRef } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AccountMenu } from './account-menu';
import { PrintHeader } from './print-header';
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  Command,
  Calendar,
  Users,
  Ticket,
  ScrollText,
  BarChart3,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';

import { ThemeProvider } from './theme-provider';
import { useApp } from '@/contexts/app-context';
import { LoadingOverlay } from './loading-overlay';
import { LoadingBar } from './loading-bar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const { events, users = [] } = useApp();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Auto-collapse on small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, []);

  const filteredEvents = searchQuery
    ? events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const filteredUsers = searchQuery && users
    ? users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const hasResults = filteredEvents.length > 0 || filteredUsers.length > 0;

  // Real notifications from API
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.notifications?.filter((n: any) => !n.is_read).length || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId })
      });
      // Refresh notifications
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: any) => !n.is_read).length || 0);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true })
      });
      setUnreadCount(0);
      setNotifications(notifications.map((n: any) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="font-portal mech-shell admin-excel-shell flex h-screen bg-[#eef1f5] text-[#2f3742] transition-colors duration-300 dark:bg-[#0b1220] dark:text-[#e5edf7]">
      <AdminSidebar isCollapsed={isCollapsed} />
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Print watermark - appears on ALL printed pages */}
        <div
          className="print-watermark-container fixed inset-0 pointer-events-none hidden print:flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <img
            src="/Dark-e1735336357773.png"
            alt="Watermark"
            className="h-[85vh] w-auto object-contain"
            style={{ transform: 'rotate(-20deg)', opacity: 0.25 }}
          />
        </div>
        <div className="sticky top-0 z-30 border-b border-[#d6dbe2] bg-[#fbfcfd] px-4 py-2.5 print:hidden text-[#2f3742] dark:border-[#283548] dark:bg-[#111827] dark:text-[#e5edf7]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="shrink-0 h-9 w-9 border border-[#d6dbe2] bg-white text-[#66707f] hover:bg-[#eef2f6] hover:text-[#394655] rounded-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#9fb0c7] dark:hover:bg-[#1e293b] dark:hover:text-[#e5edf7]"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative max-w-md w-full hidden md:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a99ad] group-focus-within:text-[#475769] transition-colors dark:text-[#7f8ea6] dark:group-focus-within:text-[#d5e3f7]" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search admin... (Ctrl+K)"
                  className="pl-9 h-9 bg-white border-[#d6dbe2] focus-visible:ring-1 focus-visible:ring-[#8ea3ba]/30 text-sm rounded-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#e5edf7] dark:placeholder:text-[#8da0b8]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />

                {isSearchFocused && searchQuery && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-[#d6dbe2] shadow-lg overflow-hidden z-50 rounded-sm dark:border-[#334155] dark:bg-[#0f172a]">
                    {hasResults ? (
                      <div className="max-h-[300px] overflow-auto p-1.5 space-y-4">
                        {filteredEvents.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-1 py-1">Events</p>
                            {filteredEvents.map(event => (
                              <div
                                key={event.id}
                                onClick={() => {
                                  router.push(`/admin/events?id=${event.id}`);
                                  setSearchQuery('');
                                }}
                                className="flex items-center gap-2 p-2 hover:bg-[#f1f4f8] rounded-sm cursor-pointer transition-colors dark:hover:bg-[#1e293b]"
                              >
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate leading-none">{event.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {filteredUsers.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-1 py-1">Users</p>
                            {filteredUsers.map(user => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  router.push(`/admin/users?id=${user.id}`);
                                  setSearchQuery('');
                                }}
                                className="flex items-center gap-2 p-2 hover:bg-[#f1f4f8] rounded-sm cursor-pointer transition-colors dark:hover:bg-[#1e293b]"
                              >
                                <Users className="w-3.5 h-3.5 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate leading-none">{user.name}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{user.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-[11px] font-medium text-muted-foreground">No matches found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 border border-[#d6dbe2] bg-white text-[#66707f] hover:bg-[#eef2f6] hover:text-[#394655] rounded-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#9fb0c7] dark:hover:bg-[#1e293b] dark:hover:text-[#e5edf7]"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground dark:text-[#9fb0c7]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-background">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 border-[#d6dbe2] bg-white max-h-[400px] overflow-hidden rounded-sm dark:border-[#334155] dark:bg-[#0f172a]">
                  <DropdownMenuLabel className="p-4 border-b border-[#d6dbe2] text-sm font-bold flex justify-between items-center bg-[#f4f6f9] dark:border-[#334155] dark:bg-[#111827]">
                    <span>Notifications ({notifications.length})</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-xs bg-[#1f7fe0] hover:bg-[#1b70c7] text-white"
                        onClick={markAllAsRead}
                      >
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <div className="max-h-[350px] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <DropdownMenuItem
                          key={n.id}
                          className={`flex flex-col items-start gap-2 p-4 cursor-pointer focus:bg-[#f1f4f8] border-b border-[#e3e8ef] last:border-0 rounded-none dark:focus:bg-[#1e293b] dark:border-[#334155] ${!n.is_read ? 'bg-[#edf4ff] dark:bg-[#122338]' : ''}`}
                          onClick={() => !n.is_read && markAsRead(n.id)}
                        >
                          <div className="flex justify-between w-full items-center">
                            <span className="text-sm font-semibold">{n.title}</span>
                            {!n.is_read && <span className="w-2.5 h-2.5 bg-[#1f7fe0] rounded-full" />}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">{n.message}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-[#d6dbe2] bg-white text-[#66707f] hover:bg-[#eef2f6] hover:text-[#394655] rounded-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#9fb0c7] dark:hover:bg-[#1e293b] dark:hover:text-[#e5edf7]"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title="Toggle Mode"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              <AccountMenu variant="admin" />
            </div>
          </div>
        </div>

        <div className="print-page-content relative z-10 flex-1 p-4 md:p-5 bg-[#eef1f5] dark:bg-[#0b1220]">
          <PrintHeader />
          {children}
        </div>
      </main>
      <LoadingOverlay />
    </div>
  );
}

