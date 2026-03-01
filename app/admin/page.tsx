'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
import { formatPHDateTime } from '@/lib/time';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Activity, TrendingUp, Plus, ClipboardList } from 'lucide-react';

type DashboardStats = {
  registrationTrend: { name: string; registrations: number }[];
  monthlyTrend: { name: string; registrations: number; events: number }[];
  growth: { events: number; registrations: number; activeUsers: number };
  recentRegistrations: {
    id: string;
    status: string;
    registeredAt: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
  }[];
  recentAuditLogs?: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    createdAt: string;
  }[];
};

export default function AdminDashboardPage() {
  const { events, registrations } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setStats(data);
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const monthlySeries = useMemo(() => stats?.monthlyTrend ?? [], [stats]);

  const totalAttendees = useMemo(() => {
    if (stats?.registrationTrend?.length) {
      return stats.registrationTrend.reduce((sum, item) => sum + (item?.registrations ?? 0), 0);
    }
    return registrations.length;
  }, [stats, registrations]);

  const totalEvents = useMemo(() => {
    if (stats?.monthlyTrend?.length) {
      return stats.monthlyTrend.reduce((sum, item) => sum + (item?.events ?? 0), 0);
    }
    return events.length;
  }, [stats, events]);

  const currentMonth = monthlySeries[monthlySeries.length - 1];
  const monthlyAttendees = currentMonth?.registrations ?? 0;
  const monthlyEvents = currentMonth?.events ?? 0;

  const regGrowth = stats?.growth?.registrations ?? null;
  const eventGrowth = stats?.growth?.events ?? null;

  const donutData = useMemo(() => {
    const base = stats?.registrationTrend ?? [];
    const colors = ['#FBC02D', '#F97316', '#38BDF8', '#1f7fe0'];
    return base.slice(-4).map((item, idx) => ({
      name: item.name || `Segment ${idx + 1}`,
      value: item.registrations ?? 0,
      fill: colors[idx % colors.length],
    }));
  }, [stats]);

  const recentRows = (stats?.recentRegistrations ?? []).slice(0, 8);
  const recentActivity = (stats?.recentAuditLogs ?? []).slice(0, 6);

  const quickActions = useMemo(
    () => [
      {
        title: 'Create Event',
        href: '/admin/events/create',
        description: 'Schedule a new workshop or meetup',
        icon: <Plus className="w-5 h-5" />,
      },
      {
        title: 'Manage Users',
        href: '/admin/users',
        description: 'Review attendee and admin accounts',
        icon: <Users className="w-5 h-5" />,
      },
      {
        title: 'Registrations',
        href: '/admin/registrations',
        description: 'Approve, reject, or mark attendance',
        icon: <ClipboardList className="w-5 h-5" />,
      },
      {
        title: 'Audit Logs',
        href: '/admin/audit-logs',
        description: 'Track recent administrative changes',
        icon: <Activity className="w-5 h-5" />,
      },
    ],
    []
  );

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
          <div className="admin-page-header space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground font-medium italic mt-2">Snapshot of attendance, events, and activity.</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatPill label="Total Attendees" value={totalAttendees} icon={<Users className="w-4 h-4" />} />
              <StatPill label="Yearly Events" value={totalEvents} icon={<Calendar className="w-4 h-4" />} />
              <StatPill label="Monthly Attendees" value={monthlyAttendees} delta={regGrowth} icon={<Activity className="w-4 h-4" />} />
              <StatPill label="Monthly Events" value={monthlyEvents} delta={eventGrowth} icon={<TrendingUp className="w-4 h-4" />} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border">
              <CardHeader className="border-b border-border bg-slate-50/50">
                <CardTitle className="text-base font-black text-[#334155] uppercase tracking-tight">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="registrations" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="border-b border-border bg-slate-50/50">
                <CardTitle className="text-base font-black text-[#334155] uppercase tracking-tight">Registrations Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-border rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-slate-50/50">
                <CardTitle className="text-base font-black text-[#334155] uppercase tracking-tight">Recent Activity</CardTitle>
                <Link href="/admin/audit-logs" className="text-xs font-semibold text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[360px] overflow-auto">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log) => {
                    const actionText = log.action?.replace(/_/g, ' ') ?? 'activity';
                    const toneClass = /delete|remove|revoke|fail/i.test(actionText)
                      ? 'text-red-600'
                      : /create|add|approve|confirm/i.test(actionText)
                        ? 'text-blue-600'
                        : /update|edit|change/i.test(actionText)
                          ? 'text-blue-600'
                          : 'text-muted-foreground';

                    return (
                      <div key={log.id} className="border border-border rounded-none p-3 space-y-1 flex gap-3 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                        <div className="w-10 h-10 rounded-none bg-[#1f7fe0]/10 text-[#1f7fe0] flex items-center justify-center shrink-0 border border-[#1f7fe0]/20">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[#334155] leading-tight capitalize truncate">
                              {actionText}
                            </p>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-none bg-muted text-muted-foreground border border-border shrink-0 font-bold">
                              {log.entityType}
                            </span>
                          </div>
                          <p className={`text-xs flex items-center gap-2 font-bold ${toneClass}`}>
                            <Activity className="w-3.5 h-3.5" />
                            {log.entityId || 'N/A'}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {log.createdAt ? formatPHDateTime(log.createdAt) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">No recent activity.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border rounded-none shadow-sm">
              <CardHeader className="border-b border-border bg-slate-50/50">
                <CardTitle className="text-base font-black text-[#334155] uppercase tracking-tight">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group border border-border rounded-none p-4 bg-white hover:bg-slate-50 hover:border-[#1f7fe0]/60 transition-all flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-none bg-[#1f7fe0]/10 text-[#1f7fe0] flex items-center justify-center border border-[#1f7fe0]/20">
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#334155] truncate">{action.title}</p>
                      <p className="text-[11px] text-[#64748b] truncate uppercase font-semibold tracking-wide">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border rounded-none shadow-md">
            <CardHeader className="border-b border-border bg-slate-50/50">
              <CardTitle className="text-lg font-black text-[#334155]">Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Event</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRows.length > 0 ? (
                    recentRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-mono text-xs truncate max-w-[160px] text-muted-foreground font-bold">{row.id}</td>
                        <td className="py-3 px-6 text-[#334155] font-bold">
                          {row.userName || 'Unknown'}
                          <div className="text-[11px] text-muted-foreground font-normal">{row.userEmail || ''}</div>
                        </td>
                        <td className="py-3 px-6 text-[#334155] font-medium">{row.eventTitle || '-'}</td>
                        <td className="py-3 px-6 capitalize">
                          <span className="px-2 py-0.5 rounded-none border border-current text-[10px] font-black uppercase tracking-tighter text-[#1f7fe0]">
                            {row.status || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-xs text-muted-foreground font-medium">
                          {row.registeredAt ? formatPHDateTime(row.registeredAt) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-8 text-muted-foreground text-center" colSpan={5}>
                        No recent registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function StatPill({
  label,
  value,
  icon,
  delta,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delta?: number | null;
}) {
  const showDelta = typeof delta === 'number';
  const deltaClass =
    showDelta && delta !== null
      ? 'text-[#1f7fe0]'
      : 'text-muted-foreground';

  return (
    <div className="inline-flex items-center gap-2 rounded-none border border-border bg-card px-3 py-1.5 text-sm shadow-sm ring-1 ring-black/5">
      <span className="text-[#1f7fe0]">{icon}</span>
      <span className="font-bold text-[#1a1a1a] dark:text-white">{value}</span>
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      {showDelta && (
        <span className={`text-[11px] font-bold ${deltaClass}`}>
          {delta! >= 0 ? '+' : ''}
          {delta}%
        </span>
      )}
    </div>
  );
}


