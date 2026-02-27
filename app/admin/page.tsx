'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
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
import { Calendar, Users, Activity, TrendingUp } from 'lucide-react';

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
};

export default function AdminDashboardPage() {
  const { events, registrations, users = [] } = useApp();
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

  const donutData = useMemo(() => {
    const base = stats?.registrationTrend ?? [];
    const colors = ['#FBC02D', '#F97316', '#38BDF8', '#22C55E'];
    return base.slice(0, 4).map((item, idx) => ({
      name: item.name || `Segment ${idx + 1}`,
      value: item.registrations ?? 0,
      fill: colors[idx % colors.length],
    }));
  }, [stats]);

  const recentRows = (stats?.recentRegistrations ?? []).slice(0, 8);

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Snapshot of attendance, events, and activity.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Attendees"
              value={registrations.length}
              subtitle="Since last years"
              icon={<Users className="w-5 h-5 text-primary" />}
            />
            <MetricCard
              title="Yearly Events"
              value={events.length}
              subtitle="Since past years"
              icon={<Calendar className="w-5 h-5 text-primary" />}
            />
            <MetricCard
              title="Monthly Attendees"
              value={monthlySeries.slice(-1)?.[0]?.registrations ?? registrations.length}
              subtitle="Since last month"
              icon={<Activity className="w-5 h-5 text-primary" />}
            />
            <MetricCard
              title="Monthly Events"
              value={monthlySeries.slice(-1)?.[0]?.events ?? events.length}
              subtitle="Since last month"
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border">
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
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
              <CardHeader>
                <CardTitle>Events by Category</CardTitle>
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

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Event</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRows.length > 0 ? (
                    recentRows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/40">
                        <td className="py-2 pr-4 font-mono text-xs truncate max-w-[160px]">{row.id}</td>
                        <td className="py-2 pr-4">
                          {row.userName || 'Unknown'}
                          <div className="text-xs text-muted-foreground">{row.userEmail || ''}</div>
                        </td>
                        <td className="py-2 pr-4">{row.eventTitle || '-'}</td>
                        <td className="py-2 pr-4 capitalize text-primary">{row.status || '-'}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">
                          {row.registeredAt ? new Date(row.registeredAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-4 text-muted-foreground" colSpan={5}>
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

type MetricCardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
};

function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{icon}</div>
      </CardContent>
    </Card>
  );
}
