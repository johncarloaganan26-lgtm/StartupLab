'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useApp, type Event } from '@/contexts/app-context';
import { toastError } from '@/lib/toast';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatPHDate, formatTime12h } from '@/lib/time';

export default function PublicEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String((params as any)?.id ?? '');

  const { isAuthenticated, user, registerEvent, isRegisteredForEvent } = useApp();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load event.');
      const loadedEvent = data.event ?? null;
      setEvent(
        loadedEvent
          ? {
              ...loadedEvent,
              image: loadedEvent?.image ? String(loadedEvent.image) : '/placeholder.jpg',
            }
          : null
      );
    } catch (err) {
      toastError('Load failed', err instanceof Error ? err.message : 'Failed to load event.');
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [eventId]);

  const isAlreadyRegistered = useMemo(
    () => (eventId ? isRegisteredForEvent(eventId) : false),
    [eventId, isRegisteredForEvent]
  );

  const canRegister = isAuthenticated && user?.role === 'attendee' && !isAlreadyRegistered;
  const isFullyBooked = !!event && event.availableSlots === 0;
  const isCompleted = event?.status === 'completed';
  const descriptionText = (event?.description ?? '').trim();
  const DESCRIPTION_PREVIEW_CHARS = 220;
  const isLongDescription = descriptionText.length > DESCRIPTION_PREVIEW_CHARS;
  const visibleDescription =
    isLongDescription && !isDescriptionExpanded
      ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}...`
      : descriptionText;

  const handleRegister = async () => {
    if (!eventId) return;
    if (!isAuthenticated) {
      router.push('/signup');
      return;
    }
    if (user?.role !== 'attendee') {
      toastError('Not allowed', 'Admin accounts cannot register for events.');
      return;
    }
    if (isAlreadyRegistered) return;

    setIsRegistering(true);
    try {
      await registerEvent(eventId);
      await fetchEvent();
    } catch {
      // toast handled in app context
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100svh-4rem)] min-h-[calc(100vh-4rem)] flex items-center">
        {isLoading ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        ) : !event ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center space-y-4">
            <p className="text-foreground font-semibold">Event not found</p>
            <Link href="/events">
              <Button variant="outline">Back to Events</Button>
            </Link>
          </div>
        ) : (
          <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
                    {event.title}
                  </h1>
                  <p className="text-muted-foreground text-base lg:text-lg leading-relaxed break-words">
                    {visibleDescription}
                    {isLongDescription && (
                      <button
                        type="button"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="ml-2 inline text-base lg:text-lg font-medium text-primary hover:underline"
                      >
                        {isDescriptionExpanded ? 'See less' : 'Read more'}
                      </button>
                    )}
                  </p>
                </div>

              <div className="space-y-4 max-w-xl">
                <div className="rounded-xl border border-border bg-card/60">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <Calendar className="size-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Date & Time</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {formatPHDate(event.date)} at {formatTime12h(event.time)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/60">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <MapPin className="size-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Location</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-medium text-foreground">{event.location}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/60">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <Users className="size-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Available Spots</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-medium text-foreground">{event.availableSlots} remaining</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleRegister}
                  disabled={isRegistering || isFullyBooked || isCompleted || (isAuthenticated && !canRegister)}
                >
                  {isCompleted
                    ? 'Event Completed'
                    : isRegistering
                      ? 'Registering...'
                      : isFullyBooked
                        ? 'Fully Booked'
                        : !isAuthenticated
                          ? 'Create account to join'
                          : user?.role !== 'attendee'
                            ? 'Admin account'
                            : isAlreadyRegistered
                              ? 'Already Registered'
                              : 'Register'}
                </Button>
              </div>
            </div>

            <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[70vh] rounded-2xl overflow-hidden bg-muted lg:order-last">
              <Image src={event.image} alt={event.title} fill className="object-cover" />
            </div>
          </div>
        )}
      </section>
  );
}
