'use client';

import { toast } from '@/hooks/use-toast';

export function toastSuccess(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'success',
  });
}

export function toastError(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'destructive',
  });
}

