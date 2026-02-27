'use client';

import { useMemo, useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Check, X, Loader2, UserCheck, Trash2, Eye, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/loading-context';

const PAGE_SIZE = 25;

export default function RegistrationsPage() {
  const { users, events, approveRegistration, rejectRegistration, markAttended, fetchRegistrations: refreshGlobalRegistrations } = useApp();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
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

    // Default sort by newest registration
    data.sort((a, b) => new Date(b.registeredAt || b.createdAt).getTime() - new Date(a.registeredAt || a.createdAt).getTime());

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
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Waitlisted', value: 'waitlisted' },
        { label: 'Attended', value: 'attended' },
        { label: 'No-Show', value: 'no-show' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'event',
      label: 'Event',
      value: eventFilter,
      onChange: setEventFilter,
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

  const handleBulkApprove = async () => {
    if (!confirm(`Approve ${selectedIds.length} registrations?`)) return;
    try {
      setGlobalLoading(true, 'Approving registrations...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds, action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      toast({ title: 'Success', description: `${selectedIds.length} registrations approved.` });
      setSelectedIds([]);
      await loadRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some approvals failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!confirm(`Reject ${selectedIds.length} registrations?`)) return;
    try {
      setGlobalLoading(true, 'Rejecting registrations...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds, action: 'reject' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      toast({ title: 'Success', description: `${selectedIds.length} registrations rejected.` });
      setSelectedIds([]);
      await loadRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some rejections failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} registrations? This cannot be undone.`)) return;
    try {
      setGlobalLoading(true, 'Deleting registrations...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds, action: 'delete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast({ title: 'Success', description: `${selectedIds.length} registrations deleted.` });
      setSelectedIds([]);
      await loadRegistrations();
      refreshGlobalRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some deletions failed.', variant: 'destructive' });
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

  const handleBulkAttend = async () => {
    if (!confirm(`Mark ${selectedIds.length} registrations as attended?`)) return;
    try {
      setGlobalLoading(true, 'Marking as attended...');
      const res = await fetch('/api/admin/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds, action: 'attend' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mark as attended failed');
      toast({ title: 'Success', description: `${selectedIds.length} registrations marked as attended.` });
      setSelectedIds([]);
      await loadRegistrations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Some operations failed.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  // Determine bulk action buttons based on selected registrations' status
  const getSelectedStatuses = () => {
    const statuses = new Set(selectedIds.map(id => {
      const reg = registrations.find(r => r.id === id);
      return reg?.status;
    }).filter(Boolean));
    return statuses as Set<string>;
  };

  const selectedStatuses = getSelectedStatuses();
  const isAllPending = selectedStatuses.size === 1 && selectedStatuses.has('pending');
  const isAllConfirmed = selectedStatuses.size === 1 && selectedStatuses.has('confirmed');
  const hasOnlyPendingConfirmedOrAttended =
    (selectedStatuses.size === 1 &&
      (selectedStatuses.has('pending') || selectedStatuses.has('confirmed') || selectedStatuses.has('attended'))) ||
    selectedStatuses.size === 0;

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
    confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-700' },
    attended: { label: 'Attended', class: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
    waitlisted: { label: 'Waitlisted', class: 'bg-orange-100 text-orange-700' },
    'no-show': { label: 'No-Show', class: 'bg-slate-100 text-slate-700' },
  };

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              Registrations
            </h1>
            <p className="text-muted-foreground mt-2">
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
            <div className="print:hidden rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {selectedIds.length} selected
                </p>
                <div className="flex items-center gap-2">
                  {isAllPending && (
                    <>
                      <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
                        <Check className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" onClick={handleBulkReject} className="bg-orange-600 hover:bg-orange-700">
                        <X className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {isAllConfirmed && (
                    <Button size="sm" onClick={handleBulkAttend} className="bg-blue-600 hover:bg-blue-700">
                      <UserCheck className="mr-1.5 h-4 w-4" />
                      Mark Attended
                    </Button>
                  )}
                  {hasOnlyPendingConfirmedOrAttended && (
                    <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto bg-card border border-border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-6 py-3 w-12 text-center">
                      <Checkbox
                        checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-sm font-semibold text-foreground">Attendee</th>
                    <th className="px-6 py-3 text-sm font-semibold text-foreground">Event</th>
                    <th className="px-6 py-3 text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.map((reg) => {
                    const status = statusMap[reg.status] || { label: reg.status, class: 'bg-gray-100' };

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
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.class}`}>
                            {status.label}
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
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
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
                                  onClick={async () => {
                                    setGlobalLoading(true, 'Rejecting registration...');
                                    try {
                                      await rejectRegistration(reg.id);
                                      await loadRegistrations();
                                      refreshGlobalRegistrations();
                                    } finally {
                                      setGlobalLoading(false);
                                    }
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {reg.status === 'confirmed' && (
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
            <DialogContent className="max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle>Registration Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold block w-fit ${statusMap[selectedRegistration?.status]?.class}`}>
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
          <DataPagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
          />
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
