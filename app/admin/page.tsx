'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
import { Calendar, Users, BarChart3, Clock, ArrowRight, Ticket, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  recentAuditLogs: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    createdAt: string;
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
        // fallback
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const pendingApprovals = registrations.filter(r => r.status === 'pending').length;
  const activeUsers = new Set(registrations.map(r => r.userId)).size;

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="p-2 space-y-8 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Welcome back! Here&apos;s what&apos;s happening at StartupLab.</p>
          </div>

          {/* Core Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Users</p>
                <p className="text-3xl font-black">{users.length}</p>
                <p className="text-[10px] text-green-500 font-bold mt-1">+{users.length > 0 ? '1' : '0'} this month</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Events</p>
                <p className="text-3xl font-black">{events.length}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">3 upcoming</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 transition-transform group-hover:scale-110">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Bookings</p>
                <p className="text-3xl font-black">{registrations.length}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">All-time total</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
                <Ticket className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 rounded-md shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending Tasks</p>
                <p className="text-3xl font-black">{pendingApprovals}</p>
                <p className="text-[10px] text-amber-500 font-bold mt-1">{pendingApprovals} unread</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-110">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Activities Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black uppercase text-foreground">Recent Activities</h2>
                <ArrowRight className="w-4 h-4 text-green-500" />
              </div>
              <div className="bg-card border border-border/60 rounded-md shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="flex-1 overflow-auto p-4 space-y-6">
                  {(stats?.recentAuditLogs || []).length > 0 ? (
                    stats?.recentAuditLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[13px] font-bold">{log.action.replace(/_/g, ' ')}</p>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">{log.entityType}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic mb-1">{log.details ? JSON.stringify(log.details).slice(0, 50) : 'No details'}</p>
                          <p className="text-[10px] text-muted-foreground/60">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic space-y-2">
                      <Clock className="w-8 h-8 opacity-20" />
                      <p className="text-xs">No activity found.</p>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-border bg-muted/10">
                  <Link href="/admin/audit-logs">
                    <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest rounded-sm border-border h-10 hover:bg-muted">VIEW ALL ACTIVITIES</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-black uppercase text-foreground">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/admin/users" className="bg-card border border-border/60 p-8 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="relative inline-block">
                    <Users className="w-10 h-10 text-blue-600 transition-transform group-hover:scale-110" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold">+</div>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Add New User</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Register a new system member</p>
                  </div>
                </Link>

                <Link href="/admin/events/create" className="bg-card border border-border/60 p-8 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-3 bg-green-500/10 rounded-full inline-block">
                    <Plus className="w-6 h-6 text-green-600 transition-transform group-hover:rotate-90" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Create Event</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Schedule a new system event</p>
                  </div>
                </Link>

                <Link href="/admin/audit-logs" className="bg-card border border-border/60 p-8 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group text-foreground">
                  <div className="p-3 bg-purple-500/10 rounded-full inline-block">
                    <Ticket className="w-6 h-6 text-purple-600 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Review Logs</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Check system activity logs</p>
                  </div>
                </Link>

                <Link href="/admin/users" className="bg-card border border-border/60 p-8 rounded-md shadow-sm text-center space-y-4 hover:border-primary/50 transition-all hover:shadow-md group text-foreground">
                  <div className="p-3 bg-orange-500/10 rounded-full inline-block">
                    <Users className="w-6 h-6 text-orange-600 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">User Directory</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Manage all system users</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
