'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthGuard } from '@/components/auth-guard';
import { RefreshCcw, Trash2, Loader2, ArchiveRestore, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPHDate, formatTime12h } from '@/lib/time';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  exportToCSV,
} from '@/components/data-toolbar';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/loading-context';

type ArchivedEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  archivedAt: string | null;
  description?: string;
  image?: string;
};

type ArchivedRegistration = {
  id: string;
  registrationId: string | null;
  eventId: string;
  userId: string;
  status: string;
  registeredAt: string | null;
  userName: string | null;
  userEmail: string | null;
  eventTitle: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  deletedAt: string;
  deletedBy: string | null;
  deletionSource: string | null;
};

type ArchivedUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  phone: string | null;
  bio: string | null;
  createdAtOriginal: string | null;
  deletedAt: string;
  deletedBy: string | null;
  deletionSource: string | null;
};

type ArchiveCategory = 'events' | 'registrations' | 'users';

const PAGE_SIZE = 20;

export default function AdminArchivePage() {
  const [category, setCategory] = useState<ArchiveCategory>('events');

  const [archivedEvents, setArchivedEvents] = useState<ArchivedEvent[]>([]);
  const [archivedRegistrations, setArchivedRegistrations] = useState<ArchivedRegistration[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUser[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedArchivedEvent, setSelectedArchivedEvent] = useState<ArchivedEvent | null>(null);
  const [selectedArchivedRegistration, setSelectedArchivedRegistration] = useState<ArchivedRegistration | null>(null);
  const [selectedArchivedUser, setSelectedArchivedUser] = useState<ArchivedUser | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { toast } = useToast();
  const { setLoading: setGlobalLoading } = useLoading();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [registrationPage, setRegistrationPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    setRegistrationPage(1);
    setUserPage(1);
  }, [search]);

  useEffect(() => {
    setSelectedIds([]);
  }, [category]);

  const fetchArchivedEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch('/api/admin/archive/events', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setArchivedEvents([]);
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch archived events' }));
        console.error('Failed to fetch archived events:', errorData.error || 'Unknown error');
        setArchivedEvents([]);
        return;
      }
      const data = await res.json();
      const mapped = (data.events || []).map((event: any) => ({
        ...event,
        archivedAt: event.archivedAt || event.deletedAt || null,
      }));
      setArchivedEvents(mapped);
    } catch (err) {
      console.error('Failed to fetch archived events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchArchivedRegistrations = async () => {
    try {
      setLoadingRegistrations(true);
      const res = await fetch('/api/admin/archive/registrations', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setArchivedRegistrations([]);
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch archived registrations' }));
        console.error('Failed to fetch archived registrations:', errorData.error || 'Unknown error');
        setArchivedRegistrations([]);
        return;
      }
      const data = await res.json();
      setArchivedRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Failed to fetch archived registrations:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const fetchArchivedUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/admin/archive/users', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setArchivedUsers([]);
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch archived users' }));
        console.error('Failed to fetch archived users:', errorData.error || 'Unknown error');
        setArchivedUsers([]);
        return;
      }
      const data = await res.json();
      setArchivedUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch archived users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchArchivedEvents();
    fetchArchivedRegistrations();
    fetchArchivedUsers();
  }, []);

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return archivedEvents;
    const q = search.toLowerCase();
    return archivedEvents.filter((e) => {
      return e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    });
  }, [archivedEvents, search]);

  const filteredRegistrations = useMemo(() => {
    if (!search.trim()) return archivedRegistrations;
    const q = search.toLowerCase();
    return archivedRegistrations.filter((r) => {
      return (
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q) ||
        (r.eventTitle || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    });
  }, [archivedRegistrations, search]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return archivedUsers;
    const q = search.toLowerCase();
    return archivedUsers.filter((u) => {
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });
  }, [archivedUsers, search]);

  const {
    paginatedData: paginatedEvents,
    totalItems: totalEventItems,
    totalPages: totalEventPages,
    safePage: safeEventPage,
  } = usePaginatedData(filteredEvents, PAGE_SIZE, currentPage);

  const {
    paginatedData: paginatedArchivedRegistrations,
    totalItems: totalRegistrationItems,
    totalPages: totalRegistrationPages,
    safePage: safeRegistrationPage,
  } = usePaginatedData(filteredRegistrations, PAGE_SIZE, registrationPage);

  const {
    paginatedData: paginatedArchivedUsers,
    totalItems: totalArchivedUsers,
    totalPages: totalArchivedUserPages,
    safePage: safeArchivedUserPage,
  } = usePaginatedData(filteredUsers, PAGE_SIZE, userPage);

  const activeLoading =
    category === 'events' ? loadingEvents : category === 'registrations' ? loadingRegistrations : loadingUsers;
  const activeTotalItems =
    category === 'events' ? totalEventItems : category === 'registrations' ? totalRegistrationItems : totalArchivedUsers;
  const activeTotalPages =
    category === 'events' ? totalEventPages : category === 'registrations' ? totalRegistrationPages : totalArchivedUserPages;
  const activeSafePage =
    category === 'events' ? safeEventPage : category === 'registrations' ? safeRegistrationPage : safeArchivedUserPage;
  const activePageRows: Array<{ id: string }> =
    category === 'events'
      ? paginatedEvents
      : category === 'registrations'
        ? paginatedArchivedRegistrations
        : paginatedArchivedUsers;

  const handleSelectAllCurrent = (checked: boolean) => {
    if (checked) {
      setSelectedIds(activePageRows.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOneCurrent = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      setGlobalLoading(true, 'Restoring event...');
      const res = await fetch(`/api/admin/archive/events/${id}/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to restore event');
      await fetchArchivedEvents();
      toast({ title: 'Event restored', description: 'The event is now back in Manage Events.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to restore event.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this event? This cannot be undone.')) return;
    try {
      setGlobalLoading(true, 'Permanently deleting event...');
      const res = await fetch(`/api/admin/archive/events/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      await fetchArchivedEvents();
      await fetchArchivedRegistrations();
      await fetchArchivedUsers();
      toast({ title: 'Record deleted', description: 'Event permanently removed from archive.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRestoreRegistration = async (id: string) => {
    try {
      setGlobalLoading(true, 'Restoring archived registration...');
      const res = await fetch('/api/admin/archive/registrations/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore archived registration');

      const restored = Number(data?.restored ?? 0);
      const skippedCount = Number(data?.skippedCount ?? 0);
      toast({
        title: restored > 0 ? 'Registration restored' : 'Restore skipped',
        description:
          restored > 0
            ? 'The registration is back in the active registrations table.'
            : skippedCount > 0
              ? 'Registration could not be restored due to missing dependencies or duplicates.'
              : 'No registration was restored.',
      });
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      await fetchArchivedRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to restore archived registration.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handlePermanentDeleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this archived registration? This cannot be undone.')) return;

    try {
      setGlobalLoading(true, 'Permanently deleting archived registration...');
      const res = await fetch('/api/admin/archive/registrations/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete archived registration');

      toast({ title: 'Record deleted', description: 'Archived registration permanently removed.' });
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      await fetchArchivedRegistrations();
      setSelectedArchivedRegistration((prev) => (prev?.id === id ? null : prev));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete archived registration.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRestoreUser = async (id: string) => {
    try {
      setGlobalLoading(true, 'Restoring archived user...');
      const res = await fetch('/api/admin/archive/users/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore archived user');

      const restored = Number(data?.restored ?? 0);
      const skippedCount = Number(data?.skippedCount ?? 0);
      toast({
        title: restored > 0 ? 'User restored' : 'Restore skipped',
        description:
          restored > 0
            ? 'The user is back in the active users table.'
            : skippedCount > 0
              ? 'User could not be restored because ID or email already exists.'
              : 'No user was restored.',
      });
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      await fetchArchivedUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to restore archived user.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handlePermanentDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this archived user? This cannot be undone.')) return;

    try {
      setGlobalLoading(true, 'Permanently deleting archived user...');
      const res = await fetch('/api/admin/archive/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete archived user');

      toast({ title: 'Record deleted', description: 'Archived user permanently removed.' });
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      await fetchArchivedUsers();
      setSelectedArchivedUser((prev) => (prev?.id === id ? null : prev));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete archived user.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkRestoreEvents = async () => {
    if (!confirm(`Restore ${selectedIds.length} events?`)) return;
    try {
      setGlobalLoading(true, `Restoring ${selectedIds.length} events...`);
      for (const id of selectedIds) {
        await fetch(`/api/admin/archive/events/${id}/restore`, {
          method: 'POST',
          credentials: 'include',
        });
      }
      toast({ title: 'Success', description: `${selectedIds.length} events restored.` });
      setSelectedIds([]);
      await fetchArchivedEvents();
    } catch (err) {
      toast({ title: 'Error', description: 'Some restorations failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkRestoreRegistrations = async () => {
    if (!confirm(`Restore ${selectedIds.length} archived registrations?`)) return;
    try {
      setGlobalLoading(true, `Restoring ${selectedIds.length} archived registrations...`);
      const res = await fetch('/api/admin/archive/registrations/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      const restored = Number(data?.restored ?? 0);
      const skippedCount = Number(data?.skippedCount ?? 0);
      toast({
        title: 'Restore completed',
        description:
          skippedCount > 0
            ? `${restored} restored, ${skippedCount} skipped.`
            : `${restored} archived registrations restored.`,
      });
      setSelectedIds([]);
      await fetchArchivedRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some restores failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkRestoreUsers = async () => {
    if (!confirm(`Restore ${selectedIds.length} archived users?`)) return;
    try {
      setGlobalLoading(true, `Restoring ${selectedIds.length} archived users...`);
      const res = await fetch('/api/admin/archive/users/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      const restored = Number(data?.restored ?? 0);
      const skippedCount = Number(data?.skippedCount ?? 0);
      toast({
        title: 'Restore completed',
        description: skippedCount > 0 ? `${restored} restored, ${skippedCount} skipped.` : `${restored} archived users restored.`,
      });
      setSelectedIds([]);
      await fetchArchivedUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some restores failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkRestoreSelected = async () => {
    if (category === 'events') {
      await handleBulkRestoreEvents();
      return;
    }
    if (category === 'registrations') {
      await handleBulkRestoreRegistrations();
      return;
    }
    await handleBulkRestoreUsers();
  };

  const handleBulkDeleteEvents = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} events? This cannot be undone.`)) return;
    try {
      setGlobalLoading(true, `Permanently deleting ${selectedIds.length} events...`);
      const res = await fetch('/api/admin/archive/events/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast({ title: 'Success', description: `${selectedIds.length} events permanently deleted.` });
      setSelectedIds([]);
      await fetchArchivedEvents();
      await fetchArchivedRegistrations();
      await fetchArchivedUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some deletions failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkDeleteRegistrations = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} archived registrations? This cannot be undone.`)) return;
    try {
      setGlobalLoading(true, `Permanently deleting ${selectedIds.length} archived registrations...`);
      const res = await fetch('/api/admin/archive/registrations/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast({ title: 'Success', description: `${selectedIds.length} archived registrations permanently deleted.` });
      setSelectedIds([]);
      await fetchArchivedRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some deletions failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} archived users? This cannot be undone.`)) return;
    try {
      setGlobalLoading(true, `Permanently deleting ${selectedIds.length} archived users...`);
      const res = await fetch('/api/admin/archive/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast({ title: 'Success', description: `${selectedIds.length} archived users permanently deleted.` });
      setSelectedIds([]);
      await fetchArchivedUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some deletions failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (category === 'events') {
      await handleBulkDeleteEvents();
      return;
    }
    if (category === 'registrations') {
      await handleBulkDeleteRegistrations();
      return;
    }
    await handleBulkDeleteUsers();
  };

  const handleExport = () => {
    if (category === 'events') {
      const exportData = filteredEvents.map((e) => ({
        ID: e.id,
        Title: e.title,
        Date: formatPHDate(e.date),
        Time: formatTime12h(e.time),
        Location: e.location,
        'Archived At': e.archivedAt ? new Date(e.archivedAt).toLocaleString() : '-',
      }));
      exportToCSV(exportData, 'archived_events');
      return;
    }

    if (category === 'registrations') {
      const exportData = filteredRegistrations.map((r) => ({
        ID: r.id,
        RegistrationID: r.registrationId || '-',
        Name: r.userName || 'Unknown',
        Email: r.userEmail || '-',
        Event: r.eventTitle || 'Unknown',
        Status: r.status || 'unknown',
        'Registered At': r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '-',
        'Archived At': r.deletedAt ? new Date(r.deletedAt).toLocaleString() : '-',
        Source: r.deletionSource || '-',
      }));
      exportToCSV(exportData, 'archived_registrations');
      return;
    }

    const exportData = filteredUsers.map((u) => ({
      ID: u.id,
      UserID: u.userId,
      Name: u.name || 'Unknown',
      Email: u.email || '-',
      Role: u.role || 'unknown',
      'Deleted At': u.deletedAt ? new Date(u.deletedAt).toLocaleString() : '-',
      Source: u.deletionSource || '-',
    }));
    exportToCSV(exportData, 'archived_users');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChangePage = (page: number) => {
    if (category === 'events') {
      setCurrentPage(page);
      return;
    }
    if (category === 'registrations') {
      setRegistrationPage(page);
      return;
    }
    setUserPage(page);
  };

  const searchPlaceholder =
    category === 'events'
      ? 'Search archived events...'
      : category === 'registrations'
        ? 'Search archived registrations...'
        : 'Search archived users...';

  const resultLabel =
    category === 'events' ? 'archived events' : category === 'registrations' ? 'archived registrations' : 'archived users';

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Archive</h1>
            <p className="text-muted-foreground mt-2">Use one archive table with categories for events, registrations, and users.</p>
          </div>

          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <Button
              size="sm"
              variant={category === 'events' ? 'default' : 'ghost'}
              onClick={() => setCategory('events')}
            >
              Events
            </Button>
            <Button
              size="sm"
              variant={category === 'registrations' ? 'default' : 'ghost'}
              onClick={() => setCategory('registrations')}
            >
              Registrations
            </Button>
            <Button
              size="sm"
              variant={category === 'users' ? 'default' : 'ghost'}
              onClick={() => setCategory('users')}
            >
              Users
            </Button>
          </div>

          {!activeLoading && (
            <DataToolbar
              searchPlaceholder={searchPlaceholder}
              searchValue={search}
              onSearchChange={setSearch}
              onClearAll={() => setSearch('')}
              totalResults={activeTotalItems}
              resultLabel={resultLabel}
              selectedCount={selectedIds.length}
              onBulkDelete={handleBulkDeleteSelected}
              onExport={handleExport}
              onPrint={handlePrint}
              actions={
                selectedIds.length > 0 ? (
                  <Button
                    size="icon"
                    onClick={handleBulkRestoreSelected}
                    className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                    title="Restore Selected"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </Button>
                ) : undefined
              }
            />
          )}

          {activeLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto bg-card border border-border rounded-lg">
                <table className="w-full">
                  <thead>
                    {category === 'events' && (
                      <tr className="border-b border-border bg-muted/50 text-left">
                        <th className="px-6 py-3 w-12 text-center">
                          <Checkbox
                            checked={selectedIds.length === paginatedEvents.length && paginatedEvents.length > 0}
                            onCheckedChange={handleSelectAllCurrent}
                          />
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Event</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Date & Time</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Archived On</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    )}
                    {category === 'registrations' && (
                      <tr className="border-b border-border bg-muted/50 text-left">
                        <th className="px-6 py-3 w-12 text-center">
                          <Checkbox
                            checked={selectedIds.length === paginatedArchivedRegistrations.length && paginatedArchivedRegistrations.length > 0}
                            onCheckedChange={handleSelectAllCurrent}
                          />
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Attendee</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Event</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Last Status</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Registered On</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Archived On</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Source</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    )}
                    {category === 'users' && (
                      <tr className="border-b border-border bg-muted/50 text-left">
                        <th className="px-6 py-3 w-12 text-center">
                          <Checkbox
                            checked={selectedIds.length === paginatedArchivedUsers.length && paginatedArchivedUsers.length > 0}
                            onCheckedChange={handleSelectAllCurrent}
                          />
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Name</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Email</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Role</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Deleted On</th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground">Source</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-border">
                    {category === 'events' && (
                      <>
                        {paginatedEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={selectedIds.includes(event.id)}
                                onCheckedChange={(checked) => handleSelectOneCurrent(event.id, !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground">
                              {event.title}
                              <p className="text-xs font-normal text-muted-foreground">{event.location}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {formatPHDate(event.date)} <br />
                              <span className="text-muted-foreground">{formatTime12h(event.time)}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {event.archivedAt ? new Date(event.archivedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Restore"
                                  onClick={() => handleRestore(event.id)}
                                >
                                  <RefreshCcw className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Details"
                                  onClick={() => setSelectedArchivedEvent(event)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Permanently"
                                  onClick={() => handlePermanentDelete(event.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {paginatedEvents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                              No archived events found.
                            </td>
                          </tr>
                        )}
                      </>
                    )}

                    {category === 'registrations' && (
                      <>
                        {paginatedArchivedRegistrations.map((registration) => (
                          <tr key={registration.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={selectedIds.includes(registration.id)}
                                onCheckedChange={(checked) => handleSelectOneCurrent(registration.id, !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground">{registration.userName || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{registration.userEmail || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground">{registration.eventTitle || 'Unknown Event'}</p>
                              <p className="text-xs text-muted-foreground">
                                {registration.eventDate ? formatPHDate(registration.eventDate) : '-'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {registration.status || 'unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {registration.registeredAt ? new Date(registration.registeredAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {registration.deletedAt ? new Date(registration.deletedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{registration.deletionSource || '-'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Restore"
                                  onClick={() => handleRestoreRegistration(registration.id)}
                                >
                                  <RefreshCcw className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Details"
                                  onClick={() => setSelectedArchivedRegistration(registration)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Permanently"
                                  onClick={() => handlePermanentDeleteRegistration(registration.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {paginatedArchivedRegistrations.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                              No archived registrations found.
                            </td>
                          </tr>
                        )}
                      </>
                    )}

                    {category === 'users' && (
                      <>
                        {paginatedArchivedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={selectedIds.includes(user.id)}
                                onCheckedChange={(checked) => handleSelectOneCurrent(user.id, !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground">{user.name || 'Unknown User'}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{user.email || '-'}</td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {user.role || 'unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {user.deletedAt ? new Date(user.deletedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{user.deletionSource || '-'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Restore"
                                  onClick={() => handleRestoreUser(user.id)}
                                >
                                  <RefreshCcw className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Details"
                                  onClick={() => setSelectedArchivedUser(user)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Permanently"
                                  onClick={() => handlePermanentDeleteUser(user.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {paginatedArchivedUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                              No archived users found.
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <DataPagination
                currentPage={activeSafePage}
                totalPages={activeTotalPages}
                onPageChange={handleChangePage}
                pageSize={PAGE_SIZE}
                totalItems={activeTotalItems}
              />
            </>
          )}
        </div>

        <Dialog
          open={!!selectedArchivedEvent}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedArchivedEvent(null);
              setIsDescriptionExpanded(false);
            }
          }}
        >
          <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-bold">{selectedArchivedEvent?.title}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 pr-2 min-h-0">
              {selectedArchivedEvent?.image && (
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-border mb-4 flex-shrink-0">
                  <img src={selectedArchivedEvent.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground uppercase text-[10px] font-bold">Schedule</p>
                  <p className="font-medium text-foreground">
                    {selectedArchivedEvent && formatPHDate(selectedArchivedEvent.date)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {selectedArchivedEvent && formatTime12h(selectedArchivedEvent.time)}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground uppercase text-[10px] font-bold">Location</p>
                  <p className="font-medium text-foreground">{selectedArchivedEvent?.location}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground uppercase text-[10px] font-bold">Archived On</p>
                  <p className="font-medium text-foreground">
                    {selectedArchivedEvent?.archivedAt ? new Date(selectedArchivedEvent.archivedAt).toLocaleDateString() : '-'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {selectedArchivedEvent?.archivedAt ? new Date(selectedArchivedEvent.archivedAt).toLocaleTimeString() : '-'}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground uppercase text-[10px] font-bold">Event ID</p>
                  <p className="font-medium text-foreground font-mono text-xs">{selectedArchivedEvent?.id}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-muted-foreground uppercase text-[10px] font-bold mb-2">Description</p>
                <div className="relative">
                  <div
                    className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50 ${
                      !isDescriptionExpanded ? 'max-h-48 overflow-hidden' : ''
                    }`}
                  >
                    {selectedArchivedEvent?.description || 'No description provided.'}
                  </div>
                  {selectedArchivedEvent?.description && selectedArchivedEvent.description.length > 500 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="p-0 h-auto text-primary hover:text-primary/80 absolute bottom-2 right-2"
                    >
                      {isDescriptionExpanded ? (
                        <span className="flex items-center gap-1 bg-card px-2 py-1 rounded">
                          <ChevronUp className="w-4 h-4" /> See Less
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-card px-2 py-1 rounded">
                          <ChevronDown className="w-4 h-4" /> See More
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!selectedArchivedRegistration}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedArchivedRegistration(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Archived Registration Details</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Archive Row ID</p>
                <p className="font-medium text-foreground font-mono text-xs">{selectedArchivedRegistration?.id || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Original Registration ID</p>
                <p className="font-medium text-foreground">{selectedArchivedRegistration?.registrationId || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Attendee</p>
                <p className="font-medium text-foreground">{selectedArchivedRegistration?.userName || 'Unknown User'}</p>
                <p className="text-muted-foreground text-xs break-all">{selectedArchivedRegistration?.userEmail || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Event</p>
                <p className="font-medium text-foreground">{selectedArchivedRegistration?.eventTitle || 'Unknown Event'}</p>
                <p className="text-muted-foreground text-xs">
                  {selectedArchivedRegistration?.eventDate ? formatPHDate(selectedArchivedRegistration.eventDate) : '-'}
                  {selectedArchivedRegistration?.eventTime ? `, ${formatTime12h(selectedArchivedRegistration.eventTime)}` : ''}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Status</p>
                <p className="font-medium text-foreground">{selectedArchivedRegistration?.status || 'unknown'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Registered On</p>
                <p className="font-medium text-foreground">
                  {selectedArchivedRegistration?.registeredAt
                    ? new Date(selectedArchivedRegistration.registeredAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Archived On</p>
                <p className="font-medium text-foreground">
                  {selectedArchivedRegistration?.deletedAt
                    ? new Date(selectedArchivedRegistration.deletedAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Deletion Source</p>
                <p className="font-medium text-foreground">{selectedArchivedRegistration?.deletionSource || '-'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!selectedArchivedUser}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedArchivedUser(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Archived User Details</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Archive Row ID</p>
                <p className="font-medium text-foreground font-mono text-xs">{selectedArchivedUser?.id || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Original User ID</p>
                <p className="font-medium text-foreground">{selectedArchivedUser?.userId || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Name</p>
                <p className="font-medium text-foreground">{selectedArchivedUser?.name || 'Unknown User'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Email</p>
                <p className="font-medium text-foreground break-all">{selectedArchivedUser?.email || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Role</p>
                <p className="font-medium text-foreground">{selectedArchivedUser?.role || 'unknown'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Created On</p>
                <p className="font-medium text-foreground">
                  {selectedArchivedUser?.createdAtOriginal
                    ? new Date(selectedArchivedUser.createdAtOriginal).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Company</p>
                <p className="font-medium text-foreground">{selectedArchivedUser?.company || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Phone</p>
                <p className="font-medium text-foreground">{selectedArchivedUser?.phone || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg sm:col-span-2">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Bio</p>
                <p className="font-medium text-foreground whitespace-pre-wrap">{selectedArchivedUser?.bio || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Archived On</p>
                <p className="font-medium text-foreground">
                  {selectedArchivedUser?.deletedAt
                    ? new Date(selectedArchivedUser.deletedAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Deletion Source</p>
                <p className="font-medium text-foreground">{selectedArchivedUser?.deletionSource || '-'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  );
}
