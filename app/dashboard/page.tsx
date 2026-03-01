'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
import { Calendar as CalendarIcon, Users, Zap, Ticket, ScrollText, Clock, Plus, MapPin, Activity, ListChecks } from 'lucide-react';
import { formatPHDate, formatPHDateTime, formatTime12h } from '@/lib/time';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const { user, registrations, events } = useApp();
  const userRegistrations = useMemo(
    () => (user ? registrations.filter((r) => r.userId === user.id) : []),
    [user, registrations]
  );
  const [recentActivity, setRecentActivity] = useState<AuditLogRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const attendedCount = useMemo(
    () => userRegistrations.filter((r) => r.status === 'attended').length,
    [userRegistrations]
  );
  const upcomingCount = useMemo(
    () => userRegistrations.filter((r) => r.status === 'confirmed').length,
    [userRegistrations]
  );
  const pendingCount = useMemo(
    () => userRegistrations.filter((r) => r.status === 'pending').length,
    [userRegistrations]
  );

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

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach((ev) => {
      const key = new Date(ev.date).toDateString();
      map.set(key, [...(map.get(key) ?? []), ev]);
    });
    return map;
  }, [events]);

  const eventDates = useMemo(
    () =>
      Array.from(eventsByDate.keys())
        .map((k) => new Date(k))
        .filter((d) => !Number.isNaN(d.getTime())),
    [eventsByDate]
  );

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate.toDateString()) ?? [];
  }, [selectedDate, eventsByDate]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingEvents = useMemo(() => {
    const sorted = events
      .map((ev) => ({ ...ev, dateObj: new Date(ev.date) }))
      .filter((ev) => !Number.isNaN(ev.dateObj.getTime()) && ev.dateObj >= today)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return sorted.slice(0, 5);
  }, [events, today]);

  const quickActions = useMemo(
    () => [
      {
        title: 'Discover Events',
        href: '/dashboard/events',
        description: 'Browse and join upcoming sessions',
        icon: <Plus className="w-5 h-5" />,
      },
      {
        title: 'My Registrations',
        href: '/dashboard/registrations',
        description: 'Manage your confirmed slots',
        icon: <Ticket className="w-5 h-5" />,
      },
      {
        title: 'Profile & Preferences',
        href: '/dashboard/profile',
        description: 'Update contact info and bio',
        icon: <Users className="w-5 h-5" />,
      },
      {
        title: 'Activity Log',
        href: '/dashboard/audit-logs',
        description: 'Review your recent actions',
        icon: <ScrollText className="w-5 h-5" />,
      },
    ],
    []
  );

  return (
    <AuthGuard requiredRole="attendee">
      <DashboardLayout>
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">Attendee Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your events, registrations, and activity at a glance.</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Status</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-foreground">Online</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatPill label="My Events" value={userRegistrations.length} icon={<CalendarIcon className="w-4 h-4" />} />
            <StatPill label="Upcoming" value={upcomingCount} icon={<Ticket className="w-4 h-4" />} />
            <StatPill label="Completed" value={attendedCount} icon={<Zap className="w-4 h-4" />} />
            <StatPill label="Pending" value={pendingCount} icon={<Clock className="w-4 h-4" />} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group border border-border rounded-none p-4 bg-white shadow-sm hover:bg-slate-50 hover:border-[#1f7fe0]/60 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-none bg-[#1f7fe0]/10 text-[#1f7fe0] flex items-center justify-center border border-[#1f7fe0]/20 shrink-0">
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#334155] truncate">{action.title}</p>
                  <p className="text-[11px] text-[#64748b] truncate uppercase font-semibold tracking-wide">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-3 items-start">
            <Card className="border-border rounded-none shadow-sm h-full">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border bg-slate-50/50">
                <div>
                  <CardTitle className="text-lg font-black text-[#334155]">Event Calendar</CardTitle>
                  <p className="text-[11px] text-[#64748b] uppercase font-bold tracking-tight">
                    Dates with dots have scheduled sessions.
                  </p>
                </div>
                <Button variant="excel" size="sm" asChild className="h-9">
                  <Link href="/dashboard/events" className="gap-2 flex items-center">
                    <ListChecks className="w-4 h-4" />
                    View all
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => day && setSelectedDate(day)}
                  modifiers={{ event: eventDates }}
                  modifiersClassNames={{
                    event: 'after:content-[""] after:w-1.5 after:h-1.5 after:bg-[#1f7fe0] after:rounded-full after:block after:mx-auto after:mt-1',
                  }}
                  className="w-full min-h-[440px] rounded-none shadow-none border-0"
                />
              </CardContent>
            </Card>

            <Card className="border-border rounded-none shadow-sm h-full">
              <CardHeader className="flex items-center justify-between pb-3 border-b border-border bg-slate-50/50">
                <CardTitle className="text-lg font-black text-[#334155]">{selectedDate ? formatPHDate(selectedDate) : 'Select a date'}</CardTitle>
                <span className="text-[10px] font-black uppercase text-muted-foreground bg-slate-100 px-2 py-0.5 border border-border">
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="border border-border rounded-none p-3 flex flex-col gap-1 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-[#334155] leading-tight">{ev.title}</p>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-none bg-blue-50 text-[#1f7fe0] border border-[#1f7fe0]/20">
                            {ev.status ?? 'upcoming'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#1f7fe0]" />
                          {ev.time ? formatTime12h(ev.time) : 'Time TBA'}
                        </p>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#1f7fe0]" />
                          {ev.location || 'TBA'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-none p-8 text-sm text-muted-foreground text-center bg-slate-50/30">
                    No events scheduled for this date.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-border rounded-none shadow-sm">
              <CardHeader className="border-b border-border bg-slate-50/50">
                <CardTitle className="text-lg font-black text-[#334155]">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="border border-border rounded-none p-3 hover:bg-slate-50 transition-colors shadow-sm bg-white"
                    >
                      <p className="text-sm font-bold text-[#334155] leading-tight">{ev.title}</p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#1f7fe0]" />
                        {formatPHDate(ev.dateObj)}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#1f7fe0]" />
                        {ev.time ? formatTime12h(ev.time) : 'Time TBA'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#1f7fe0]" />
                        {ev.location || 'Location TBA'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-sm text-muted-foreground text-center">No upcoming events yet.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border rounded-none shadow-sm">
              <CardHeader className="flex items-center justify-between border-b border-border bg-slate-50/50">
                <CardTitle className="text-lg font-black text-[#334155]">Recent Activity</CardTitle>
                <Link href="/dashboard/audit-logs" className="text-[11px] font-black uppercase text-[#1f7fe0] hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[360px] overflow-auto pt-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const toneClass =
                      activity.tone === 'success'
                        ? 'text-blue-600'
                        : activity.tone === 'warning'
                          ? 'text-amber-600'
                          : activity.tone === 'danger'
                            ? 'text-red-600'
                            : activity.tone === 'info'
                              ? 'text-blue-600'
                              : 'text-muted-foreground';

                    return (
                      <div key={activity.id} className="border border-border rounded-none p-3 space-y-1 bg-white hover:bg-slate-50 transition-colors shadow-sm flex gap-3">
                        <div className="w-10 h-10 rounded-none bg-[#1f7fe0]/10 text-[#1f7fe0] flex items-center justify-center shrink-0 border border-[#1f7fe0]/20">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[#334155] leading-tight truncate">{activity.summary}</p>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-none bg-muted text-muted-foreground border border-border font-bold">
                              {activity.action}
                            </span>
                          </div>
                          <p className={`text-xs flex items-center gap-2 font-bold ${toneClass}`}>
                            <Activity className="w-3.5 h-3.5" />
                            {activity.target}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-medium">{formatPHDateTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">No activity yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function StatPill({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-none border border-border bg-white px-3 py-1.5 text-sm shadow-sm ring-1 ring-black/5">
      <span className="text-[#1f7fe0]">{icon}</span>
      <span className="font-bold text-[#1a1a1a]">{value}</span>
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

