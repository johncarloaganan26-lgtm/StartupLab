'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Event } from '@/contexts/app-context';
import { formatPHDate, formatTime12h } from '@/lib/time';
import { Checkbox } from '@/components/ui/checkbox';

interface EventCardProps {
  event: Event;
  onRegister?: () => void;
  onEdit?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  variant?: 'full' | 'compact';
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function EventCard({
  event,
  onRegister,
  onEdit,
  actionLabel = 'Register',
  disabled = false,
  variant = 'full',
  selectable = false,
  selected = false,
  onToggleSelect,
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
    <Card className="group h-full overflow-hidden rounded-none py-0 gap-0 bg-white border-border hover:shadow-md transition-all">
      <div className="relative h-48 w-full bg-muted sm:h-56">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
        {selectable && (
          <div className="absolute top-3 right-3 z-20">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.()}
              className="size-5 border-2 border-white shadow-md bg-white/90 data-[state=checked]:bg-[#00a8e8] data-[state=checked]:border-[#008fc4]"
            />
          </div>
        )}
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
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-tight">
            <span className="inline-flex items-center gap-1 rounded-none bg-slate-100 text-slate-600 px-2 py-0.5 border border-slate-200">
              <Users className="size-3" />
              {registrations} registered
            </span>
            <span className="inline-flex items-center rounded-none bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-100 italic">
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
              className="w-full rounded-none bg-[#1f7fe0] hover:bg-[#1a6dc4] text-white border-b-4 border-[#155ca0] active:border-b-0 active:translate-y-1 transition-all h-11 font-black text-xs uppercase tracking-widest"
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
