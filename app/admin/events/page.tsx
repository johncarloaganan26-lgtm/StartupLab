'use client';

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthGuard } from '@/components/auth-guard';
import { Plus, Pencil, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/contexts/app-context';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  exportToCSV,
  type FilterConfig,
} from '@/components/data-toolbar';
import { formatPHDate, formatTime12h } from '@/lib/time';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EventForm } from '@/components/event-form';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/loading-context';

const PAGE_SIZE = 20;

export default function AdminEventsPage() {
  const { events, deleteEvent } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { toast } = useToast();
  const { setLoading: setGlobalLoading } = useLoading();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let data = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      data = data.filter((e) => e.status === statusFilter);
    }

    switch (sortBy) {
      case 'date-asc':
        data.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
        break;
      case 'date-desc':
        data.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        break;
      case 'title-asc':
        data.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default: // newest
        data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return data;
  }, [events, search, statusFilter, sortBy]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      defaultValue: 'all',
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
    },
    {
      key: 'sort',
      label: 'Sort',
      value: sortBy,
      onChange: setSortBy,
      defaultValue: 'newest',
      options: [
        { label: 'Newest First', value: 'newest' },
        { label: 'Upcoming First', value: 'date-asc' },
        { label: 'Latest First', value: 'date-desc' },
        { label: 'Title A-Z', value: 'title-asc' },
      ],
    },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map(e => e.id));
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      setGlobalLoading(true, 'Deleting event...');
      await deleteEvent(id);
      toast({ title: 'Event deleted', description: 'The event has been moved to the archive.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} events?`)) return;

    try {
      setGlobalLoading(true, `Deleting ${selectedIds.length} events...`);
      for (const id of selectedIds) {
        await deleteEvent(id);
      }
      toast({
        title: 'Bulk delete successful',
        description: `${selectedIds.length} events have been deleted.`,
      });
      setSelectedIds([]);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete some events.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filtered.map(e => ({
      ID: e.id,
      Title: e.title,
      Date: formatPHDate(e.date),
      Time: formatTime12h(e.time),
      Location: e.location,
      Status: e.status,
      'Total Slots': e.totalSlots,
      'Available Slots': e.availableSlots
    }));
    exportToCSV(exportData, 'events_report');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div className="admin-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight">
                Manage Events
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-medium italic">
                Create, edit, and manage your events.
              </p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setEditingEventId(null);
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 self-start sm:self-auto bg-[#1f7fe0] border-b-4 border-[#155ca0] hover:bg-[#1868b7] text-white rounded-none h-11 px-6 active:border-b-0 active:translate-y-1 transition-all">
                  <Plus className="w-4 h-4" />
                  <span className="font-black text-xs uppercase tracking-widest">Create Event</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-border rounded-none shadow-2xl p-0">
                <DialogHeader className="p-6 pb-2 border-b border-border bg-slate-50/50">
                  <DialogTitle className="text-lg font-black text-[#334155] uppercase tracking-tight">{editingEventId ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                  <EventForm
                    initialData={events.find(e => e.id === editingEventId)}
                    onSuccess={() => setIsFormOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setIsDescriptionExpanded(false); } }}>
            <DialogContent className="max-w-4xl bg-white border-border rounded-none shadow-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl font-bold">{selectedEvent?.title}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 pr-2 min-h-0">
                {selectedEvent?.image && (
                  <div className="relative w-full h-48 sm:h-64 rounded-none overflow-hidden border border-border mb-4 flex-shrink-0">
                    <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-muted/30 p-3 rounded-none">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Schedule</h4>
                    <p className="text-sm font-medium text-foreground">
                      {selectedEvent && formatPHDate(selectedEvent.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedEvent && formatTime12h(selectedEvent.time)}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-none">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Location</h4>
                    <p className="text-sm text-foreground">{selectedEvent?.location}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-none">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${selectedEvent?.status === 'published' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {selectedEvent?.status}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-none">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Registration</h4>
                    <p className="text-sm text-foreground">
                      {selectedEvent?.totalSlots - selectedEvent?.availableSlots} / {selectedEvent?.totalSlots} slots
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h4>
                  <div className="relative">
                    <div className={`text-sm text-foreground whitespace-pre-wrap break-all leading-relaxed p-4 bg-muted/20 rounded-none border border-border/50 ${!isDescriptionExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
                      {selectedEvent?.description}
                    </div>
                    {selectedEvent?.description && selectedEvent?.description.length > 500 && (
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

          <DataToolbar
            searchPlaceholder="Search events..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={filters}
            onClearAll={() => { setSearch(''); setStatusFilter('all'); setSortBy('newest'); }}
            totalResults={totalItems}
            resultLabel="events"
            selectedCount={selectedIds.length}
            onBulkDelete={handleBulkDelete}
            onExport={handleExport}
            onPrint={handlePrint}
          />

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
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Event</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Capacity</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <Checkbox
                        checked={selectedIds.includes(event.id)}
                        onCheckedChange={(checked) => handleSelectOne(event.id, !!checked)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {event.image && (
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                            <img src={event.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{event.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {event.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {formatPHDate(event.date)} <br />
                      <span className="text-muted-foreground">{formatTime12h(event.time)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground line-clamp-1 max-w-[150px]">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider ${event.status === 'published' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {event.totalSlots - event.availableSlots} / {event.totalSlots}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEventId(event.id);
                            setIsFormOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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

