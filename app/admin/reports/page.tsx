'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth-guard';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useApp } from '@/contexts/app-context';
import { Loader2, Printer, FileDown, Calendar, Users, BarChart3, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/components/data-toolbar';

type ReportPayload = {
  totalEvents: number;
  totalRegistrations: number;
  capacityUsage: number;
  statusDistribution: Record<string, number>;
};

type MonthlyTrend = {
  name: string;
  registrations: number;
  events: number;
};

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { events, registrations } = useApp();
  const latestMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];

  const registrationMoMGrowth = useMemo(() => {
    if (!latestMonth || !prevMonth) return null;
    if (prevMonth.registrations === 0) return latestMonth.registrations > 0 ? 100 : 0;
    return Math.round(((latestMonth.registrations - prevMonth.registrations) / prevMonth.registrations) * 100);
  }, [latestMonth, prevMonth]);

  const eventsMoMGrowth = useMemo(() => {
    if (!latestMonth || !prevMonth) return null;
    if (prevMonth.events === 0) return latestMonth.events > 0 ? 100 : 0;
    return Math.round(((latestMonth.events - prevMonth.events) / prevMonth.events) * 100);
  }, [latestMonth, prevMonth]);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch reports
        const reportRes = await fetch('/api/admin/reports', { credentials: 'include' });
        if (!reportRes.ok) {
          // Silently handle auth errors - user may not be admin
          if (reportRes.status === 401 || reportRes.status === 403) {
            setLoading(false);
            return;
          }
          const errorData = await reportRes.json().catch(() => ({ error: 'Failed to load reports' }));
          throw new Error(errorData?.error || 'Failed to load reports.');
        }
        const reportData = await reportRes.json();

        // Fetch monthly trend
        const dashRes = await fetch('/api/admin/dashboard', { credentials: 'include' });

        if (isMounted) {
          setReport(reportData);
          setError('');

          if (dashRes.ok) {
            const dashData = await dashRes.json();
            if (dashData?.monthlyTrend?.length) {
              setMonthlyData(dashData.monthlyTrend);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load reports.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { isMounted = false; };
  }, []);


  const statusDistributionData = report
    ? Object.entries(report.statusDistribution).map(([name, value]) => {
      const colorMap: Record<string, string> = {
        confirmed: '#1f7fe0',
        pending: '#f59e0b',
        attended: '#3b82f6',
        cancelled: '#ef4444',
      };
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colorMap[name] ?? '#94a3b8',
      };
    })
    : [
      { name: 'Confirmed', value: registrations.filter(r => r.status === 'confirmed').length, color: '#1f7fe0' },
      { name: 'Pending', value: registrations.filter(r => r.status === 'pending').length, color: '#f59e0b' },
      { name: 'Attended', value: registrations.filter(r => r.status === 'attended').length, color: '#3b82f6' },
      { name: 'Cancelled', value: registrations.filter(r => r.status === 'cancelled').length, color: '#ef4444' },
    ];

  // Event performance
  const eventPerformance = events.map(e => ({
    name: e.title.substring(0, 10),
    filled: e.totalSlots - e.availableSlots,
    capacity: e.totalSlots,
  }));

  const avgRegistrationsPerEvent = report?.totalEvents
    ? Math.round(report.totalRegistrations / report.totalEvents)
    : events.length > 0
      ? Math.round(registrations.length / events.length)
      : 0;

  const capacityUsage = report?.capacityUsage ?? (
    events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + e.totalSlots - e.availableSlots, 0) / events.reduce((sum, e) => sum + e.totalSlots, 0) * 100)
      : 0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const summaryRows = [
      { Metric: 'Total Events', Value: report?.totalEvents ?? events.length },
      { Metric: 'Total Registrations', Value: report?.totalRegistrations ?? registrations.length },
      { Metric: 'Average Registrations Per Event', Value: avgRegistrationsPerEvent },
      { Metric: 'Capacity Usage (%)', Value: capacityUsage },
    ];

    const statusRows = statusDistributionData.map((item) => ({
      Metric: `Status - ${item.name}`,
      Value: item.value,
    }));

    const eventRows = eventPerformance.map((item) => ({
      Metric: `Event - ${item.name} Filled`,
      Value: item.filled,
    }));

    exportToCSV([...summaryRows, ...statusRows, ...eventRows], 'reports_analytics');
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
          <div className="admin-page-header flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground">Insights on events, registrations, and capacity.</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button size="sm" variant="excel" onClick={handleExport} className="h-10 gap-2 px-4 shadow-md group">
                <FileDown className="w-4 h-4 text-[#1f7fe0] group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-black text-xs uppercase tracking-widest text-[#475569]">Export</span>
              </Button>
              <Button size="sm" variant="excel" onClick={handlePrint} className="h-10 gap-2 px-4 shadow-md group">
                <Printer className="w-4 h-4 text-[#1f7fe0] group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-black text-xs uppercase tracking-widest text-[#475569]">Print</span>
              </Button>
            </div>
          </div>

          <div className="hidden print:block space-y-4">
            <h2 className="text-lg font-semibold">Reports Summary</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left">Metric</th>
                  <th className="text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Events</td>
                  <td>{report?.totalEvents ?? events.length}</td>
                </tr>
                <tr>
                  <td>Total Registrations</td>
                  <td>{report?.totalRegistrations ?? registrations.length}</td>
                </tr>
                <tr>
                  <td>Average Registrations Per Event</td>
                  <td>{avgRegistrationsPerEvent}</td>
                </tr>
                <tr>
                  <td>Capacity Usage</td>
                  <td>{capacityUsage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <StatPill label="Total Events" value={report?.totalEvents ?? events.length} delta={eventsMoMGrowth} icon={<Calendar className="w-4 h-4" />} />
            <StatPill label="Total Registrations" value={report?.totalRegistrations ?? registrations.length} delta={registrationMoMGrowth} icon={<Ticket className="w-4 h-4" />} />
            <StatPill label="Avg / Event" value={avgRegistrationsPerEvent} icon={<Users className="w-4 h-4" />} />
            <StatPill label="Capacity Usage" value={`${capacityUsage}%`} icon={<BarChart3 className="w-4 h-4" />} />
          </div>

          {error && (
            <div className="bg-card border border-destructive/20 rounded-none p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Card className="bg-white border-border rounded-none shadow-sm ring-1 ring-black/5 print:hidden">
            <CardHeader className="border-b border-border bg-slate-50/50">
              <CardTitle className="text-lg font-black text-[#334155]">Monthly Growth Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData.length > 0 ? monthlyData : [{ name: 'No Data', events: 0, registrations: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: `1px solid var(--color-border)`,
                      borderRadius: '0px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    name="Events"
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#1f7fe0"
                    strokeWidth={2}
                    name="Registrations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6 print:hidden">
            <Card className="bg-white border-border rounded-none shadow-sm ring-1 ring-black/5">
              <CardHeader className="border-b border-border bg-slate-50/50">
                <CardTitle className="text-lg font-black text-[#334155]">Registration Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: `1px solid var(--color-border)`,
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {statusDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border rounded-none shadow-sm ring-1 ring-black/5">
              <CardHeader className="border-b border-border bg-slate-50/50">
                <CardTitle className="text-lg font-black text-[#334155]">Event Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={eventPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: `1px solid var(--color-border)`,
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="filled" fill="#1f7fe0" radius={[0, 0, 0, 0]} name="Filled Slots" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
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
    <div className="inline-flex items-center gap-2 rounded-none border border-border bg-white px-3 py-1.5 text-sm shadow-sm ring-1 ring-black/5">
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

