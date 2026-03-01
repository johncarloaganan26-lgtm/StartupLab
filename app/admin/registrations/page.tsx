'use client';

import { useMemo, useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  exportToCSV,
  type FilterConfig,
} from '@/components/data-toolbar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/app-context';
import { formatPHDate, formatTime12h } from '@/lib/time';
import { Check, X, Loader2, UserCheck, Trash2, Eye, Calendar, MapPin, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/loading-context';

const PAGE_SIZE = 25;

export default function RegistrationsPage() {
  const { users, events, approveRegistration, rejectRegistration, markAttended, fetchRegistrations: refreshGlobalRegistrations } = useApp();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'attend' | 'noshow' | 'delete' | null>(null);
  const [eligibleIds, setEligibleIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { setLoading: setGlobalLoading } = useLoading();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, eventFilter]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/registrations', { credentials: 'include' });
      if (!res.ok) {
        // Silently handle auth errors - user may not be admin
        if (res.status === 401 || res.status === 403) {
          setRegistrations([]);
          setLoading(false);
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Failed to load registrations' }));
        throw new Error(errorData.error || 'Failed to load registrations.');
      }
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load registrations.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const filtered = useMemo(() => {
    let data = [...registrations];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) => {
        return (
          r.userName?.toLowerCase().includes(q) ||
          r.userEmail?.toLowerCase().includes(q) ||
          r.eventTitle?.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (eventFilter !== 'all') {
      data = data.filter((r) => r.eventId === eventFilter);
    }

    // Group by status then newest
    const order: Record<string, number> = {
      pending: 1,
      confirmed: 2, // Approved
      rejected: 3,
      attended: 4, // Completed
      'no-show': 5,
      cancelled: 6,
      waitlisted: 7,
    };
    data.sort((a, b) => {
      const ao = order[a.status] ?? 99;
      const bo = order[b.status] ?? 99;
      if (ao !== bo) return ao - bo;
      return new Date(b.registeredAt || b.createdAt).getTime() - new Date(a.registeredAt || a.createdAt).getTime();
    });

    return data;
  }, [registrations, search, statusFilter, eventFilter]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const eventOptions = useMemo(() => {
    const options = events.map((e) => ({ label: e.title, value: e.id }));
    return [{ label: 'All Events', value: 'all' }, ...options];
  }, [events]);

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      defaultValue: 'all',
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Approved', value: 'confirmed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Waitlisted', value: 'waitlisted' },
        { label: 'Attended', value: 'attended' },
        { label: 'No Show', value: 'no-show' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'event',
      label: 'Event',
      value: eventFilter,
      onChange: setEventFilter,
      defaultValue: 'all',
      options: eventOptions,
    },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setGlobalLoading(true, 'Approving registrations...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids, action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      toast({ title: 'Success', description: `${ids.length} registrations approved.` });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await loadRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some approvals failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const statusForId = (id: string) => registrations.find((r) => r.id === id)?.status;

  const actionRules: Record<'approve' | 'reject' | 'attend' | 'noshow' | 'delete', string[]> = {
    approve: ['pending', 'waitlisted'],
    reject: ['pending', 'waitlisted'],
    attend: ['confirmed'],
    noshow: ['confirmed'],
    delete: ['pending', 'waitlisted', 'confirmed', 'attended', 'cancelled', 'no-show', 'rejected'],
  };

  const prepareAction = (action: 'approve' | 'reject' | 'attend' | 'noshow' | 'delete', ids?: string[]) => {
    const targetIds = ids && ids.length ? ids : selectedIds;
    const allowed = actionRules[action];
    const eligible = targetIds.filter((id) => allowed.includes(statusForId(id) || ''));
    const skipped = targetIds.filter((id) => !allowed.includes(statusForId(id) || ''));
    setActionType(action);
    setEligibleIds(eligible);
    setSkippedIds(skipped);
    if (action !== 'reject') setRejectReason('');
    setActionDialogOpen(true);
  };

  const handleSubmitReject = async (ids: string[]) => {
    if (ids.length === 0) return;
    setRejectSubmitting(true);
    try {
      if (ids.length === 1) {
        await rejectRegistration(ids[0], rejectReason || undefined);
      } else {
        setGlobalLoading(true, 'Rejecting registrations...');
        const res = await fetch('/api/admin/registrations/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids, action: 'reject', reason: rejectReason }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Rejection failed');
        toast({ title: 'Success', description: `${ids.length} registrations rejected.` });
      }
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await loadRegistrations();
      refreshGlobalRegistrations();
      setRejectReason('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Rejection failed.', variant: 'destructive' });
    } finally {
      setRejectSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setGlobalLoading(true, 'Deleting registrations...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids, action: 'delete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast({ title: 'Success', description: `${ids.length} registrations deleted.` });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await loadRegistrations();
      refreshGlobalRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some deletions failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkNoShow = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setGlobalLoading(true, 'Marking no-show...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids, action: 'noshow' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');
      toast({ title: 'Success', description: `${ids.length} marked as no-show.` });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await loadRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some operations failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteRegistration = async (registration: any) => {
    const attendee = registration.userName || 'this attendee';
    if (!confirm(`Delete registration for ${attendee}? This cannot be undone.`)) return;

    try {
      setGlobalLoading(true, 'Deleting registration...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [registration.id], action: 'delete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      toast({ title: 'Success', description: 'Registration deleted.' });
      setSelectedIds((prev) => prev.filter((id) => id !== registration.id));
      await loadRegistrations();
      refreshGlobalRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Delete failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkAttend = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setGlobalLoading(true, 'Marking as attended...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids, action: 'attend' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mark as attended failed');
      toast({ title: 'Success', description: `${ids.length} registrations marked as attended.` });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await loadRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some operations failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filtered.map(r => {
      const u = users.find(user => user.id === r.userId);
      const e = events.find(event => event.id === r.eventId);
      return {
        ID: r.id,
        Name: u?.name || 'Unknown',
        Email: u?.email || 'Unknown',
        Event: e?.title || 'Unknown',
        Status: r.status,
        Date: new Date(r.createdAt).toLocaleString()
      };
    });
    exportToCSV(exportData, 'registrations_report');
  };

  const handlePrint = () => {
    window.print();
  };

  const statusMap: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Approved', class: 'bg-blue-100 text-blue-700' },
    attended: { label: 'Attended', class: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
    waitlisted: { label: 'Waitlisted', class: 'bg-orange-100 text-orange-700' },
    'no-show': { label: 'No Show', class: 'bg-slate-100 text-slate-700' },
    rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700' },
  };

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div className="admin-page-header">
            <h1 className="text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight">
              Registrations
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium italic">
              Review and manage event registration requests.
            </p>
          </div>

          <DataToolbar
            searchPlaceholder="Search by name, email, or event..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={filters}
            onClearAll={() => { setSearch(''); setStatusFilter('all'); setEventFilter('all'); }}
            totalResults={totalItems}
            resultLabel="registrations"
            onExport={handleExport}
            onPrint={handlePrint}
          />

          {selectedIds.length > 0 && (
            <div className="print:hidden rounded-none border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {selectedIds.length} selected
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => prepareAction('approve')} className="bg-blue-600 hover:bg-blue-700">
                    <Check className="mr-1.5 h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" onClick={() => prepareAction('reject')} className="bg-orange-600 hover:bg-orange-700">
                    <X className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => prepareAction('attend')} className="bg-blue-600 hover:bg-blue-700">
                    <UserCheck className="mr-1.5 h-4 w-4" />
                    Mark Attended
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => prepareAction('noshow')} className="text-red-600 border-red-200 hover:bg-red-50">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Mark No-Show
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => prepareAction('delete')}>
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto bg-card border border-border rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                    <th className="px-6 py-4 w-12 text-center">
                      <Checkbox
                        checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="rounded-none border-slate-300"
                      />
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Attendee</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Event</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.map((reg) => {
                    const status = statusMap[reg.status] || { label: reg.statusLabel || reg.status, class: 'bg-gray-100' };

                    return (
                      <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <Checkbox
                            checked={selectedIds.includes(reg.id)}
                            onCheckedChange={(checked) => handleSelectOne(reg.id, !!checked)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{reg.userName || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">{reg.userEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground line-clamp-1">{reg.eventTitle || 'Unknown Event'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPHDate(reg.eventDate)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider ${status.class}`}>
                            {reg.statusLabel || status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(reg.registeredAt || reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {reg.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  onClick={async () => {
                                    setGlobalLoading(true, 'Approving registration...');
                                    try {
                                      await approveRegistration(reg.id);
                                      await loadRegistrations();
                                      refreshGlobalRegistrations();
                                    } finally {
                                      setGlobalLoading(false);
                                    }
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => prepareAction('reject', [reg.id])}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {reg.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  title="Mark Attended"
                                  onClick={async () => {
                                    setGlobalLoading(true, 'Marking as attended...');
                                    try {
                                      await markAttended(reg.id);
                                      await loadRegistrations();
                                      refreshGlobalRegistrations();
                                    } finally {
                                      setGlobalLoading(false);
                                    }
                                  }}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Mark No-Show"
                                  onClick={async () => {
                                    setGlobalLoading(true, 'Marking no-show...');
                                    try {
                                      const res = await fetch(`/api/admin/registrations/${reg.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ status: 'no-show', reason: rejectReason || 'Did not attend' }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.error || 'Failed to update');
                                      toast({
                                        title: 'Success',
                                        description: `${reg.userName || 'Attendee'} marked as no-show.`,
                                        className: 'bg-blue-50 text-blue-900 border border-blue-200',
                                      });
                                      await loadRegistrations();
                                      refreshGlobalRegistrations();
                                    } catch (err: any) {
                                      toast({ title: 'Error', description: err.message || 'Failed to update.', variant: 'destructive' });
                                    } finally {
                                      setGlobalLoading(false);
                                    }
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="View Details"
                              onClick={() => setSelectedRegistration(reg)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Delete Registration"
                              onClick={() => handleDeleteRegistration(reg)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
            <DialogContent className="max-w-md bg-white border-border rounded-none shadow-2xl p-0">
              <DialogHeader className="p-6 pb-2 border-b border-border bg-slate-50/50">
                <DialogTitle className="text-lg font-black text-[#334155] uppercase tracking-tight">Registration Details</DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Attendee Information</h4>
                    <p className="font-medium text-foreground">{selectedRegistration?.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRegistration?.userEmail}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</h4>
                    <p className="font-medium text-foreground">{selectedRegistration?.eventTitle}</p>
                    <p className="text-sm text-muted-foreground">{formatPHDate(selectedRegistration?.eventDate)} at {formatTime12h(selectedRegistration?.eventTime)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</h4>
                      <span className={`px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider block w-fit ${statusMap[selectedRegistration?.status]?.class}`}>
                        {statusMap[selectedRegistration?.status]?.label || selectedRegistration?.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Registered On</h4>
                      <p className="text-sm text-foreground">
                        {selectedRegistration && new Date(selectedRegistration.registeredAt || selectedRegistration.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={actionDialogOpen} onOpenChange={(open) => { if (!rejectSubmitting) setActionDialogOpen(open); }}>
            <DialogContent className="max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle>
                  {actionType ? `Bulk ${actionType === 'noshow' ? 'Mark No Show' : actionType === 'attend' ? 'Mark Attended' : actionType === 'delete' ? 'Delete' : actionType === 'approve' ? 'Approve' : 'Reject'}` : 'Bulk Action'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm text-foreground">
                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                  <p className="font-medium text-foreground">Selection summary</p>
                  <p>{eligibleIds.length} eligible | {skippedIds.length} skipped (status not applicable)</p>
                  <p className="text-muted-foreground">Only eligible items will be processed; others remain unchanged.</p>
                </div>
                {actionType === 'reject' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Reason (optional)</label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g., Event is full or duplicate registration."
                      maxLength={500}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground text-right">{rejectReason.length}/500</p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setActionDialogOpen(false)} disabled={rejectSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={rejectSubmitting || eligibleIds.length === 0}
                    onClick={async () => {
                      if (!actionType) return;
                      if (actionType === 'approve') await handleBulkApprove(eligibleIds);
                      if (actionType === 'reject') await handleSubmitReject(eligibleIds);
                      if (actionType === 'attend') await handleBulkAttend(eligibleIds);
                      if (actionType === 'noshow') await handleBulkNoShow(eligibleIds);
                      if (actionType === 'delete') await handleBulkDelete(eligibleIds);
                      setActionDialogOpen(false);
                      // leave skipped selected to allow further actions
                      setSelectedIds((prev) => prev.filter((id) => skippedIds.includes(id)));
                    }}
                  >
                    {rejectSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {eligibleIds.length === 0 ? 'Nothing to process' : `Proceed (${eligibleIds.length})`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DataPagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
          />
        </div>
      </AdminLayout>
    </AuthGuard >
  );
}

