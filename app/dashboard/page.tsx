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
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
                className="group border border-border rounded-md p-4 bg-card shadow-sm hover:border-primary/60 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-3 items-start">
            <Card className="border-border h-full">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
                <div>
                  <CardTitle>Event Calendar</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Dates with dots have scheduled sessions.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/events" className="gap-2 flex items-center">
                    <ListChecks className="w-4 h-4" />
                    View all
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => day && setSelectedDate(day)}
                  modifiers={{ event: eventDates }}
                  modifiersClassNames={{
                    event: 'after:content-[""] after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full after:block after:mx-auto after:mt-1',
                  }}
                  className="w-full min-h-[440px]"
                />
              </CardContent>
            </Card>

            <Card className="border-border h-full">
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle>{selectedDate ? formatPHDate(selectedDate) : 'Select a date'}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="border border-border rounded-md p-3 flex flex-col gap-1 bg-card/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground leading-tight">{ev.title}</p>
                          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                            {ev.status ?? 'upcoming'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {ev.time ? formatTime12h(ev.time) : 'Time TBA'}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {ev.location || 'TBA'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-md p-4 text-sm text-muted-foreground text-center">
                    No events scheduled for this date.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="border border-border rounded-md p-3 hover:border-primary/50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-foreground leading-tight">{ev.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatPHDate(ev.dateObj)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {ev.time ? formatTime12h(ev.time) : 'Time TBA'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {ev.location || 'Location TBA'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link href="/dashboard/audit-logs" className="text-xs font-semibold text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[360px] overflow-auto">
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
                      <div key={activity.id} className="border border-border rounded-md p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground leading-tight">{activity.summary}</p>
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {activity.action}
                          </span>
                        </div>
                        <p className={`text-xs flex items-center gap-2 ${toneClass}`}>
                          <Activity className="w-3.5 h-3.5" />
                          {activity.target}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formatPHDateTime(activity.createdAt)}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">No activity yet.</div>
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
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm">
      <span className="text-primary">{icon}</span>
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
