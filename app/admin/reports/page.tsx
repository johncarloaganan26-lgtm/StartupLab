'use client';

import { useEffect, useState } from 'react';
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
        confirmed: '#10b981',
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
      { name: 'Confirmed', value: registrations.filter(r => r.status === 'confirmed').length, color: '#10b981' },
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
        <div className="p-2 space-y-8 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Reports & Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1 font-medium">View detailed insights and analytics for your platform</p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <FileDown className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
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

          {/* Core Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Events</p>
                <p className="text-3xl font-black">{report?.totalEvents ?? events.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 transition-transform group-hover:scale-110">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Registrations</p>
                <p className="text-3xl font-black">{report?.totalRegistrations ?? registrations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
                <Ticket className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg / Event</p>
                <p className="text-3xl font-black">{avgRegistrationsPerEvent}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Capacity Usage</p>
                <p className="text-3xl font-black">{capacityUsage}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-110">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-card border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Key Metrics */}
          {/* Monthly Trend */}
          <Card className="bg-card border-border print:hidden">
            <CardHeader>
              <CardTitle>Monthly Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData.length > 0 ? monthlyData : [{ name: 'No Data', events: 0, registrations: 0 }]}>
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
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Registrations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6 print:hidden">
            {/* Registration Status Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
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

            {/* Event Performance */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Event Performance</CardTitle>
              </CardHeader>
              <CardContent>
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
                    <Bar dataKey="filled" fill="var(--color-primary)" radius={[8, 8, 0, 0]} name="Filled Slots" />
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
