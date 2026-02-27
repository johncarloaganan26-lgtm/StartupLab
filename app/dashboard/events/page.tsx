'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { EventCard } from '@/components/event-card';
import { AuthGuard } from '@/components/auth-guard';
import { useApp } from '@/contexts/app-context';
import { EventCardSkeleton } from '@/components/event-card-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Calendar, MapPin, Users, Info } from 'lucide-react';
import { formatPHDate, formatTime12h } from '@/lib/time';
import { DataToolbar, DataPagination, usePaginatedData } from '@/components/data-toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 9;

export default function EventsPage() {
  const { events, eventsLoading, registerEvent, isRegisteredForEvent } = useApp();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Search & pagination state
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const filtered = useMemo(() => {
    let data = events.filter(e => e.status === 'published' || e.status === 'completed'); // Show live and completed (read-only)

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }

    // Sort by date (closest first)
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return data;
  }, [events, search]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isAlreadyRegistered = selectedEventId ? isRegisteredForEvent(selectedEventId) : false;
  const isCompleted = selectedEvent?.status === 'completed';
  const DESCRIPTION_PREVIEW_CHARS = 320;
  const descriptionText = (selectedEvent?.description ?? '').trim();
  const isLongDescription = descriptionText.length > DESCRIPTION_PREVIEW_CHARS;
  const visibleDescription =
    isLongDescription && !isDescriptionExpanded
      ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}...`
      : descriptionText;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleRegister = async () => {
    if (!selectedEventId) return;
    if (isCompleted) return;
    setIsRegistering(true);

    try {
      await registerEvent(selectedEventId);
      setSelectedEventId(null);
    } catch (err) {
      // toast handled in app context
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <AuthGuard requiredRole="attendee">
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                Upcoming Events
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover and register for workshops, networking sessions, and pitch events.
              </p>
            </div>
          </div>

          {!eventsLoading && (
            <>
              <DataToolbar
                searchPlaceholder="Search events by title, location or description..."
                searchValue={search}
                onSearchChange={setSearch}
                onClearAll={() => setSearch('')}
                totalResults={totalItems}
                resultLabel="events"
              />
              <div className="flex items-center gap-3 justify-between flex-wrap mt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {paginatedData.length} of {totalItems} events
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idsOnPage = paginatedData.map((e) => e.id);
                      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsOnPage])));
                    }}
                  >
                    Select All on Page
                  </Button>
                </div>
              </div>
            </>
          )}

          {eventsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-full">
                  <EventCardSkeleton />
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-16 text-center">
              <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
              <p className="text-muted-foreground">
                {events.filter(e => e.status === 'published').length === 0
                  ? "There are no upcoming events at the moment. Check back soon!"
                  : "No events match your criteria. Try a different search term."}
              </p>
            </div>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-3 justify-between">
                  <p className="text-sm font-medium text-foreground">{selectedIds.length} selected</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={async () => {
                        const selectableIds = selectedIds.filter((id) => {
                          const ev = events.find((e) => e.id === id);
                          if (!ev) return false;
                          if (ev.status !== 'published') return false;
                          if (isRegisteredForEvent(id)) return false;
                          return true;
                        });
                        if (selectableIds.length === 0) {
                          toast({ title: 'No eligible events', description: 'Selected events are either completed or already registered.', variant: 'destructive' });
                          return;
                        }
                        setIsRegistering(true);
                        let success = 0;
                        for (const id of selectableIds) {
                          try {
                            await registerEvent(id);
                            success++;
                          } catch (err) {
                            // errors handled in context toast
                          }
                        }
                        setIsRegistering(false);
                        setSelectedIds([]);
                        if (success > 0) {
                          toast({ title: 'Registered', description: `Registered for ${success} event${success > 1 ? 's' : ''}.` });
                        }
                      }}
                      disabled={isRegistering}
                    >
                      {isRegistering ? 'Registering...' : 'Register Selected'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} disabled={isRegistering}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedData.map((event) => {
                  const isRegistered = isRegisteredForEvent(event.id);

                  return (
                    <div key={event.id} className="h-full">
                      <EventCard
                        event={event}
                        onRegister={() => setSelectedEventId(event.id)}
                        actionLabel={isRegistered ? 'Already Registered' : 'View Details'}
                        disabled={isRegistered}
                        selectable
                        selected={selectedIds.includes(event.id)}
                        onToggleSelect={() => toggleSelect(event.id)}
                      />
                    </div>
                  );
                })}
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

        {/* Event Details Modal */}
        <Dialog open={!!selectedEventId} onOpenChange={(open) => { if (!open) { setSelectedEventId(null); setIsDescriptionExpanded(false); } }}>
          <DialogContent className="max-w-3xl bg-card border-border overflow-hidden p-0 max-h-[90vh] flex flex-col">
            {selectedEvent && (
              <>
                <DialogHeader className="sr-only">
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                  <DialogDescription>Event details and registration</DialogDescription>
                </DialogHeader>

                {/* Hero Image - Always visible at top */}
                <div className="relative h-40 sm:h-48 lg:h-56 w-full bg-muted flex-shrink-0">
                  <Image
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-5 sm:left-6 right-5 sm:right-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white line-clamp-2">{selectedEvent.title}</h2>
                  </div>
                </div>

                {/* Quick Info Cards - Always visible, not scrollable */}
                <div className="p-4 sm:p-6 pb-2 flex-shrink-0 bg-card">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div className="size-9 sm:size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Date & Time</p>
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {formatPHDate(selectedEvent.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime12h(selectedEvent.time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div className="size-9 sm:size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Location</p>
                        <p className="text-sm font-semibold text-foreground line-clamp-2">{selectedEvent.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div className="size-9 sm:size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Availability</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedEvent.availableSlots} / {selectedEvent.totalSlots}
                        </p>
                        <p className="text-xs text-muted-foreground">slots left</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Section - Only this scrolls if description is long */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2 min-h-0">
                  <div className="space-y-3 py-2">
                    <h3 className="font-bold text-foreground text-base sm:text-lg border-b border-border pb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      About this event
                    </h3>
                    <div className="relative">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                        {visibleDescription}
                      </p>
                      {isLongDescription && (
                        <button
                          type="button"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-1 text-sm font-medium text-primary hover:underline"
                        >
                          {isDescriptionExpanded ? 'See less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Footer with Register Button */}
                <DialogFooter className="p-4 sm:p-6 bg-background/95 backdrop-blur-sm border-t border-border mt-0 flex-shrink-0 sticky bottom-0 z-10">
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="hidden sm:block">
                      {isAlreadyRegistered && (
                        <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          You're registered!
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto ml-auto">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedEventId(null)}
                        disabled={isRegistering}
                        className="flex-1 sm:flex-none"
                      >
                        Close
                      </Button>
                      {isCompleted ? (
                        <Button
                          variant="outline"
                          disabled
                          className="flex-1 sm:flex-none cursor-default bg-slate-100 border-slate-200 text-slate-700"
                        >
                          Event Completed
                        </Button>
                      ) : !isAlreadyRegistered ? (
                        <Button
                          onClick={handleRegister}
                          disabled={isRegistering}
                          className={`flex-1 sm:flex-none px-6 sm:px-8 ${selectedEvent.availableSlots === 0 ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
                        >
                          {isRegistering
                            ? 'Processing...'
                            : selectedEvent.availableSlots === 0
                              ? 'Join Waitlist'
                              : 'Register Now'}
                        </Button>
                      ) : (
                        <Button variant="outline" disabled className="flex-1 sm:flex-none cursor-default bg-green-50 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700">
                          ✓ Registered
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </AuthGuard >
  );
}
