'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
import { Calendar, Users, Zap, ArrowRight, Ticket, ScrollText, Clock, Plus } from 'lucide-react';
import { formatPHDateTime } from '@/lib/time';

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  detailsJson: unknown | null;
  createdAt: string;
  summary: string;
  target: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
};

export default function DashboardPage() {
  const { user, registrations } = useApp();
  const userRegistrations = user ? registrations.filter(r => r.userId === user.id) : [];
  const [recentActivity, setRecentActivity] = useState<AuditLogRow[]>([]);

  const attendedCount = userRegistrations.filter(r => r.status === 'attended').length;
  const upcomingCount = userRegistrations.filter(r => r.status === 'confirmed').length;
  const pendingCount = userRegistrations.filter(r => r.status === 'pending').length;

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const res = await fetch('/api/audit-logs', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) return;
        setRecentActivity((data.logs || []).slice(0, 5));
      } catch {
        setRecentActivity([]);
      }
    };
    fetchRecentActivity();
  }, []);

  return (
    <AuthGuard requiredRole="attendee">
      <DashboardLayout>
        <div className="p-2 space-y-8 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Attendee Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium italic">Welcome back! Manage your event registrations and profile.</p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold">Online</span>
              </div>
            </div>
          </div>

          {/* Core Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">My Events</p>
                <p className="text-3xl font-black">{userRegistrations.length}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">Total participated</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Upcoming</p>
                <p className="text-3xl font-black">{upcomingCount}</p>
                <p className="text-[10px] text-green-500 font-bold mt-1">Confirmed registrations</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 transition-transform group-hover:scale-110">
                <Ticket className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
                <p className="text-3xl font-black">{attendedCount}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">Sessions attended</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending</p>
                <p className="text-3xl font-black">{pendingCount}</p>
                <p className="text-[10px] text-amber-500 font-bold mt-1">Awaiting approval</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-110">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Activity Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black uppercase text-foreground">Recent Activity</h2>
                <ArrowRight className="w-4 h-4 text-green-500" />
              </div>
              <div className="bg-card border border-border/60 rounded-md shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="flex-1 overflow-auto p-4 space-y-6">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const toneClass =
                        activity.tone === 'success'
                          ? 'text-green-600'
                          : activity.tone === 'warning'
                            ? 'text-amber-600'
                            : activity.tone === 'danger'
                              ? 'text-red-600'
                              : activity.tone === 'info'
                                ? 'text-blue-600'
                                : 'text-muted-foreground';

                      return (
                        <div key={activity.id} className="flex gap-4 group">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <ScrollText className={`w-4 h-4 ${toneClass}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[13px] font-bold truncate pr-2">{activity.summary}</p>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-muted text-muted-foreground border-border">
                                {activity.action}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground italic mb-1">
                              {formatPHDateTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic space-y-2">
                      <Ticket className="w-8 h-8 opacity-20" />
                      <p className="text-xs">No activity yet.</p>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-border bg-muted/10 text-center">
                  <Link href="/dashboard/audit-logs" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                    VIEW ALL ACTIVITY
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions / Featured Section */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-black uppercase text-foreground">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/dashboard/events" className="bg-card border border-border/60 p-10 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-4 bg-blue-500/10 rounded-full inline-block">
                    <Plus className="w-8 h-8 text-blue-600 transition-transform group-hover:rotate-90" />
                  </div>
                  <div>
                    <p className="font-bold text-base uppercase">Discover Events</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Browse and join upcoming workshops</p>
                  </div>
                </Link>

                <Link href="/dashboard/registrations" className="bg-card border border-border/60 p-10 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-4 bg-green-500/10 rounded-full inline-block">
                    <Ticket className="w-8 h-8 text-green-600 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <p className="font-bold text-base uppercase">My Registrations</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Manage your active event registrations</p>
                  </div>
                </Link>

                <Link href="/dashboard/profile" className="bg-card border border-border/60 p-10 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-4 bg-purple-500/10 rounded-full inline-block">
                    <Users className="w-8 h-8 text-purple-600 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <p className="font-bold text-base uppercase">Member Profile</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Update your personal information</p>
                  </div>
                </Link>

                <Link href="/dashboard/audit-logs" className="bg-card border border-border/60 p-10 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-4 bg-orange-500/10 rounded-full inline-block">
                    <ScrollText className="w-8 h-8 text-orange-600 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <p className="font-bold text-base uppercase">Activity Logs</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Review your recent system interactions</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
