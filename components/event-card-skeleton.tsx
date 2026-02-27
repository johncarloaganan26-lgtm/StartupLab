'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden rounded-2xl py-0 gap-0 bg-card border-border">
      <Skeleton className="h-48 w-full rounded-none sm:h-56" />
      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="mt-2 h-6 w-4/6" />

        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-9/12" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  );
}

