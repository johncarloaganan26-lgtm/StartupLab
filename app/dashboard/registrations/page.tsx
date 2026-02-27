'use client';

import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
import { formatPHDate, formatTime12h } from '@/lib/time';
import { QrCode, Trash2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  type FilterConfig,
} from '@/components/data-toolbar';

const PAGE_SIZE = 8;

export default function RegistrationsPage() {
  const { user, registrations, events, cancelRegistration } = useApp();
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [ticketPreviewUrl, setTicketPreviewUrl] = useState<string>('');

  // Search & filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const userRegistrations = useMemo(() => {
    if (!user) return [];
    return registrations.filter(r => r.userId === user.id);
  }, [registrations, user]);

  const filtered = useMemo(() => {
    let data = [...userRegistrations];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r => {
        const event = events.find(e => e.id === r.eventId);
        return event?.title.toLowerCase().includes(q) || event?.location.toLowerCase().includes(q);
      });
    }

    if (statusFilter !== 'all') {
      data = data.filter(r => r.status === statusFilter);
    }

    return data;
  }, [userRegistrations, events, search, statusFilter]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const selectedReg = registrations.find(r => r.id === selectedRegId);
  const selectedEvent = selectedReg ? events.find(e => e.id === selectedReg.eventId) : null;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    attended: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    waitlisted: 'bg-orange-100 text-orange-800 border-orange-200',
    'no-show': 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Waitlisted', value: 'waitlisted' },
        { label: 'Attended', value: 'attended' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ];

  const handleCancelClick = (regId: string) => {
    setSelectedRegId(regId);
    setShowCancelConfirm(true);
  };

  const handleViewTicket = (regId: string) => {
    setSelectedRegId(regId);
    setShowCancelConfirm(false);
  };

  const handleCancelAction = async () => {
    if (!selectedRegId) return;
    setIsCancelling(true);
    try {
      await cancelRegistration(selectedRegId);
      setSelectedRegId(null);
      setShowCancelConfirm(false);
    } catch (err) {
      // toast handled in app context
    } finally {
      setIsCancelling(false);
    }
  };

  const makeTicketNumber = (registrationId: string, eventId: string, registeredAt?: string) => {
    const base = `${registrationId}|${eventId}|${registeredAt || ''}`;
    const hash = (input: string) => {
      let h = 5381;
      for (let i = 0; i < input.length; i += 1) {
        h = ((h << 5) + h) + input.charCodeAt(i);
      }
      return Math.abs(h >>> 0);
    };

    const p1 = hash(base).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
    const p2 = hash(base.split('').reverse().join('')).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
    return `STL-${p1}-${p2}`;
  };

  const generateTicketImage = async () => {
    if (!selectedReg || !selectedEvent) return '';

    const ticketNumber = makeTicketNumber(selectedReg.id, selectedReg.eventId, selectedReg.registeredAt || selectedReg.createdAt);
    const generatedAt = new Date().toLocaleString();
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ticket card
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 40, 1320, 740, 22);
    ctx.fill();
    ctx.stroke();

    // Header bar
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(40, 40, 1320, 120, 22);
    ctx.fill();
    ctx.fillRect(40, 120, 1320, 40);

    // Load and draw logo
    const logo = new Image();
    logo.src = '/Light-e1735353395645-2048x621.png';
    await new Promise((resolve) => {
      logo.onload = resolve;
      logo.onerror = resolve;
    });
    if (logo.complete && logo.naturalWidth > 0) {
      ctx.drawImage(logo, 70, 62, 290, 76);
    }

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px Roboto, Arial';
    ctx.fillText('EVENT ACCESS TICKET', 420, 105);

    // Status badge
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.roundRect(1120, 70, 190, 48, 24);
    ctx.fill();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = '700 22px Roboto, Arial';
    ctx.fillText(selectedReg.status.toUpperCase(), 1155, 102);

    // Main title
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 44px Roboto, Arial';
    const title = selectedEvent.title.length > 42 ? `${selectedEvent.title.slice(0, 42)}...` : selectedEvent.title;
    ctx.fillText(title, 80, 230);

    ctx.fillStyle = '#64748b';
    ctx.font = '400 24px Roboto, Arial';
    ctx.fillText('Present this ticket at the event entrance.', 80, 270);

    const drawField = (label: string, value: string, x: number, y: number, w: number) => {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, 120, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '600 18px Roboto, Arial';
      ctx.fillText(label.toUpperCase(), x + 20, y + 38);
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 28px Roboto, Arial';
      const safe = value.length > 30 ? `${value.slice(0, 30)}...` : value;
      ctx.fillText(safe, x + 20, y + 86);
    };

    drawField('Ticket Number', ticketNumber, 80, 310, 600);
    drawField('Attendee', user?.name || '-', 720, 310, 560);
    drawField('Date', formatPHDate(selectedEvent.date), 80, 450, 410);
    drawField('Time', formatTime12h(selectedEvent.time), 510, 450, 320);
    drawField('Location', selectedEvent.location, 850, 450, 430);

    // Footer strip
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 710, 1320, 70);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 20px Roboto, Arial';
    ctx.fillText(`Registration ID: ${selectedReg.id.toUpperCase()}`, 70, 754);
    ctx.fillText(`Generated: ${generatedAt}`, 900, 754);

    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    let mounted = true;
    const buildPreview = async () => {
      if (!selectedReg || !selectedEvent || showCancelConfirm) {
        setTicketPreviewUrl('');
        return;
      }
      const url = await generateTicketImage();
      if (mounted) setTicketPreviewUrl(url);
    };
    buildPreview();
    return () => {
      mounted = false;
    };
  }, [selectedRegId, showCancelConfirm, selectedReg?.id, selectedEvent?.id]);

  const handleDownloadTicket = async () => {
    if (!selectedReg || !selectedEvent) return;

    const ticketNumber = makeTicketNumber(selectedReg.id, selectedReg.eventId, selectedReg.registeredAt || selectedReg.createdAt);
    const safeTitle = selectedEvent.title.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40);
    const dataUrl = ticketPreviewUrl || await generateTicketImage();
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${safeTitle}_ticket_${ticketNumber}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <AuthGuard requiredRole="attendee">
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              My Registrations
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage your event registrations
            </p>
          </div>

          <DataToolbar
            searchPlaceholder="Search events..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={filters}
            onClearAll={() => { setSearch(''); setStatusFilter('all'); }}
            totalResults={totalItems}
            resultLabel="registrations"
            onExport={() => {
              const exportData = filtered.map(r => {
                const event = events.find(e => e.id === r.eventId);
                return {
                  ID: r.id,
                  Event: event?.title || 'Unknown',
                  Location: event?.location || 'Unknown',
                  Date: event ? new Date(event.date).toLocaleDateString() : '-',
                  Status: r.status
                };
              });
              import('@/components/data-toolbar').then(m => m.exportToCSV(exportData, 'my_registrations'));
            }}
            onPrint={() => window.print()}
          />

          {paginatedData.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
              {userRegistrations.length === 0
                ? "You haven't registered for any events yet."
                : "No registrations match your search."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto bg-card border border-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Event Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((reg) => {
                      const event = events.find(e => e.id === reg.eventId);

                      return (
                        <tr key={reg.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-foreground">
                              {event ? event.title : `Event #${reg.eventId}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {event ? event.location : 'Event details unavailable'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {event ? (
                              <>
                                {formatPHDate(event.date)}<br />
                                <span className="text-muted-foreground">{formatTime12h(event.time)}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[reg.status]}`}>
                              {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {reg.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleViewTicket(reg.id)}
                                >
                                  <QrCode className="w-4 h-4" />
                                  <span className="hidden sm:inline">Ticket</span>
                                </Button>
                              )}
                              {(reg.status === 'pending' || reg.status === 'confirmed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive gap-2"
                                  onClick={() => handleCancelClick(reg.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="hidden sm:inline">Cancel</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
            </>
          )}
        </div>

        {/* Unified Dialog for Ticket / Cancel */}
        <Dialog open={!!selectedRegId} onOpenChange={(open) => !open && setSelectedRegId(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            {selectedReg && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {showCancelConfirm ? 'Cancel Registration' : 'Your Event Ticket'}
                  </DialogTitle>
                  <DialogDescription>
                    {showCancelConfirm
                      ? 'Please confirm if you want to cancel your slot.'
                      : 'Present this QR code at the event entrance.'}
                  </DialogDescription>
                </DialogHeader>

                {!showCancelConfirm ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-white rounded-xl border border-border flex flex-col items-center">
                      {ticketPreviewUrl ? (
                        <img
                          src={ticketPreviewUrl}
                          alt="Ticket Preview"
                          className="w-full max-w-[360px] rounded-lg border border-border mb-4"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                          <QrCode className="w-32 h-32 text-primary/40" />
                        </div>
                      )}
                      <p className="font-bold text-center text-slate-900">
                        {selectedEvent?.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {selectedReg.id.toUpperCase()}
                      </p>
                      <p className="text-xs font-semibold text-primary mt-1">
                        Ticket No: {makeTicketNumber(selectedReg.id, selectedReg.eventId, selectedReg.registeredAt || selectedReg.createdAt)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Date</p>
                        <p className="font-medium text-foreground">{selectedEvent ? formatPHDate(selectedEvent.date) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Time</p>
                        <p className="font-medium text-foreground">{selectedEvent ? formatTime12h(selectedEvent.time) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Attendee</p>
                        <p className="font-medium text-foreground">{user?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Status</p>
                        <p className="font-bold text-primary capitalize">{selectedReg.status}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <p className="text-foreground">
                      Are you sure you want to cancel your registration for{' '}
                      <span className="font-bold">{selectedEvent?.title}</span>?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This will free up your slot for other attendees. This action is permanent but you can register again if slots are available.
                    </p>
                  </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                  {!showCancelConfirm ? (
                    <>
                      <Button variant="outline" onClick={handleDownloadTicket} className="w-full sm:w-auto gap-2">
                        <Download className="w-4 h-4" />
                        Download Ticket
                      </Button>
                      <Button onClick={() => setSelectedRegId(null)} className="w-full sm:w-auto">
                        Close
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setSelectedRegId(null)} disabled={isCancelling}>
                        No, Keep it
                      </Button>
                      <Button variant="destructive" onClick={handleCancelAction} disabled={isCancelling}>
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Registration'}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </AuthGuard>
  );
}
