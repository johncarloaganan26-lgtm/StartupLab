'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventCard } from '@/components/event-card';
import { useApp } from '@/contexts/app-context';
import { EventCardSkeleton } from '@/components/event-card-skeleton';
import { Input } from '@/components/ui/input';

export default function PublicEventsPage() {
  const router = useRouter();
  const { events, eventsLoading } = useApp();
  const [_selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;

    const q = searchQuery.toLowerCase();
    return events.filter((event) =>
      event.title?.toLowerCase().includes(q)
      || event.description?.toLowerCase().includes(q)
      || event.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[42svh] min-h-[42vh]">
          <div className="absolute inset-0 bg-[url('/d3.jpg')] bg-cover bg-center bg-fixed" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/55 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                All Events
              </h1>
              <p className="mt-4 text-base lg:text-lg text-white/85 leading-relaxed">
                Browse upcoming workshops, networking sessions, and pitch events.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-8 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, description, or location..."
            className="bg-card"
          />
        </div>

        {eventsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-full">
                <EventCardSkeleton />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">
              No events found for "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              return (
                <div key={event.id} className="h-full">
                  <EventCard
                    event={event}
                    onRegister={() => {
                      setSelectedEventId(event.id);
                      router.push(`/events/${event.id}`);
                    }}
                    actionLabel="Learn More"
                    variant="compact"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
