'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Event } from '@/contexts/app-context';
import { formatPHDate, formatTime12h } from '@/lib/time';

interface EventCardProps {
  event: Event;
  onRegister?: () => void;
  onEdit?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  variant?: 'full' | 'compact';
}

export function EventCard({
  event,
  onRegister,
  onEdit,
  actionLabel = 'Register',
  disabled = false,
  variant = 'full',
}: EventCardProps) {
  const isLearnMore = actionLabel === 'Learn More';
  const registrations = Math.max(0, event.totalSlots - event.availableSlots);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const isCompleted = event.status === 'completed';

  const { visibleDescription, isLongDescription } = useMemo(() => {
    const text = String(event.description ?? '').trim();
    const limit = variant === 'compact' ? 120 : 180;
    if (text.length <= limit) return { visibleDescription: text, isLongDescription: false };
    if (isDescriptionExpanded) return { visibleDescription: text, isLongDescription: true };
    return {
      visibleDescription: `${text.slice(0, limit).trimEnd()}...`,
      isLongDescription: true,
    };
  }, [event.description, isDescriptionExpanded, variant]);

  return (
    <Card className="group h-full overflow-hidden rounded-2xl py-0 gap-0 bg-card border-border hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full bg-muted sm:h-56">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
        {isLearnMore && onRegister && (
          <button
            type="button"
            onClick={onRegister}
            aria-label={`View details for ${event.title}`}
            className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="min-h-[3.25rem] text-xl font-bold text-foreground leading-snug line-clamp-2">
          {event.title}
        </h3>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed break-words">
          {visibleDescription}
          {isLongDescription && (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded((prev) => !prev)}
              className="ml-1 font-medium text-primary hover:underline"
            >
              {isDescriptionExpanded ? 'See less' : 'Read more'}
            </button>
          )}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 px-2.5 py-1 font-semibold">
              <Users className="size-3.5" />
              {registrations} registered
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 font-semibold">
              {event.availableSlots} slots left
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 text-primary" />
              {formatPHDate(event.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-primary" />
              <span className="font-semibold text-foreground">{formatTime12h(event.time)}</span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          <span className={`${variant === 'compact' ? 'line-clamp-2' : 'line-clamp-1'}`}>{event.location}</span>
        </div>
      </div>

      {!isLearnMore && (
        <CardFooter className="px-6 pb-6 pt-0">
          {onRegister ? (
            <Button
              onClick={onRegister}
              className="w-full"
              disabled={isCompleted || event.availableSlots === 0 || disabled}
            >
              {isCompleted
                ? 'Event Completed'
                : event.availableSlots === 0
                  ? 'Fully Booked'
                  : actionLabel}
            </Button>
          ) : onEdit ? (
            <Button
              onClick={onEdit}
              className="w-full"
              variant="outline"
            >
              {actionLabel}
            </Button>
          ) : (
            <Button className="w-full">{actionLabel}</Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
