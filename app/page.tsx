'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';
import { useApp } from '@/contexts/app-context';
import { ArrowRight, CalendarCheck, Ticket, BellRing } from 'lucide-react';
import { EventCard } from '@/components/event-card';
import { EventCardSkeleton } from '@/components/event-card-skeleton';
import { Reveal } from '@/components/reveal';
import { SiteFooter } from '@/components/site-footer';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { events, eventsLoading, user } = useApp();
  const [eventsSearch, setEventsSearch] = useState('');

  const upcomingEvents = useMemo(() => {
    if (!eventsSearch.trim()) {
      return events.slice(0, 3);
    }

    const q = eventsSearch.toLowerCase();
    return events
      .filter((event) =>
        event.title?.toLowerCase().includes(q)
        || event.description?.toLowerCase().includes(q)
        || event.location?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [events, eventsSearch]);

  const browseEventsHref = !user ? '/events' : user.role === 'admin' ? '/admin/events' : '/dashboard/events';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section
        id="hero"
        className="relative overflow-hidden min-h-[100svh] min-h-[100vh] flex items-center"
      >
        <div className="absolute inset-0 bg-[url('/stlab.jpg')] bg-cover bg-center bg-fixed" />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              Innovate. <br />
              <span className="text-sky-300">Connect.</span> Build.
            </h1>
            <p className="text-lg text-white/90 mb-8 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
              Join Startup Lab&apos;s community of entrepreneurs, innovators, and investors. Access workshops, networking events, and mentorship from industry leaders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={browseEventsHref}>
                <Button size="lg" className="w-full sm:w-auto">
                  View Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="group relative overflow-hidden w-full sm:w-auto bg-transparent text-white border-white/30 hover:bg-transparent hover:text-white"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 translate-y-full bg-sky-500 transition-transform duration-300 ease-out group-hover:translate-y-0"
                  />
                  <span className="relative z-10">Get Started</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="w-full bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
          <Reveal className="grid gap-10 md:grid-cols-3 md:gap-12 lg:gap-12">
            <div className="flex items-start gap-5">
              <CalendarCheck className="size-12 text-white sm:size-14" strokeWidth={1.6} />
              <div>
                <h3 className="text-2xl font-bold leading-[1.05] tracking-tight text-white sm:text-3xl">
                  <span className="block">Simple</span>
                  <span className="block">Registration</span>
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85 sm:text-base">
                  Browse upcoming events and reserve your slot in seconds. No complicated steps, just quick sign-up.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <Ticket className="size-12 text-white sm:size-14" strokeWidth={1.6} />
              <div>
                <h3 className="text-2xl font-bold leading-[1.05] tracking-tight text-white sm:text-3xl">
                  <span className="block">Real Events</span>
                  <span className="block">That Matter</span>
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85 sm:text-base">
                  Workshops, networking, mentorship, and pitch sessions designed to help you learn and connect.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <BellRing className="size-12 text-white sm:size-14" strokeWidth={1.6} />
              <div>
                <h3 className="text-2xl font-bold leading-[1.05] tracking-tight text-white sm:text-3xl">
                  <span className="block">Stay</span>
                  <span className="block">Updated</span>
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85 sm:text-base">
                  Keep track of dates, times, and availability so you never miss a session you want to join.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section id="upcoming-events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Reveal className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg text-muted-foreground">
            Discover the latest workshops, networking sessions, and pitch events.
          </p>
          <div className="mt-6 max-w-md">
            <Input
              value={eventsSearch}
              onChange={(e) => setEventsSearch(e.target.value)}
              placeholder="Search events by title, description, or location..."
              className="bg-card"
            />
          </div>
        </Reveal>

        <Reveal>
          {eventsLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-full">
                  <EventCardSkeleton />
                </div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div
              className={
                upcomingEvents.length === 1
                  ? 'grid grid-cols-1 justify-items-center gap-6'
                  : upcomingEvents.length === 2
                  ? 'grid grid-cols-1 md:grid-cols-2 justify-items-center gap-6'
                  : 'grid md:grid-cols-3 gap-6'
              }
            >
              {upcomingEvents.map((event) => (
                <div key={event.id} className="w-full h-full">
                  <EventCard
                    event={event}
                    onRegister={() => router.push(`/events/${event.id}`)}
                    actionLabel="Learn More"
                    variant="compact"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              No events found for "{eventsSearch}".
            </div>
          )}
        </Reveal>

        <Reveal className="mt-12 text-center">
          <Link href="/events">
            <Button size="lg">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Reveal>
      </section>


      {/* CTA Section */}
      <section id="get-started" className="w-full">
        <div className="relative bg-[url('/6d.jpg')] bg-cover bg-center bg-fixed">
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative min-h-[calc(100svh-5rem)] min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
            <Reveal className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to join the startup revolution?
              </h2>
              <p className="text-lg text-white/85 max-w-3xl mx-auto leading-relaxed">
                Startup Lab Business Center is a community for founders, builders, and innovators. Join workshops,
                networking sessions, and pitch events designed to help you learn faster, meet the right people, and move
                your idea forward.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
                <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Weekly Events</p>
                  <p className="text-sm text-white/75 mt-1">
                    Curated sessions for founders, students, and teams.
                  </p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Mentors + Community</p>
                  <p className="text-sm text-white/75 mt-1">
                    Get feedback from experienced builders and operators.
                  </p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Real Outcomes</p>
                  <p className="text-sm text-white/75 mt-1">
                    Practical workshops and connections that lead to action.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
