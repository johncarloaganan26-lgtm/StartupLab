'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth-guard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toastError } from '@/lib/toast';
import { useLoading } from '@/contexts/loading-context';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string(),
  time: z.string(),
  location: z.string().min(3, 'Location is required'),
  totalSlots: z.coerce.number().min(1, 'Must have at least 1 slot'),
  image: z.string().trim().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const imageValue = watch('image');
  const imagePreview = (imageValue && imageValue.trim()) || '/placeholder.jpg';

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/uploads/events', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Upload failed.');
    }
    return String(data.path);
  };

  const onSubmit = async (data: EventFormData) => {
    setGlobalLoading(true, 'Creating event...');
    try {
      const image = String(data.image ?? '').trim() || '/placeholder.jpg';

      await createEvent({
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        totalSlots: data.totalSlots,
        availableSlots: data.totalSlots,
        image,
        status: 'published',
      });
      router.push('/admin/events');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            Create New Event
          </h1>
          <p className="text-muted-foreground mt-2">
            Add a new event to your startup community calendar
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Event Title
                </label>
                <Input
                  id="title"
                  placeholder="Startup Pitch Night"
                  {...register('title')}
                  disabled={isLoading}
                  className="w-full"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Describe your event..."
                  {...register('description')}
                  disabled={isLoading}
                  className="w-full"
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                    Date
                  </label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    disabled={isLoading}
                    className="w-full"
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
                    Time
                  </label>
                  <Input
                    id="time"
                    type="time"
                    {...register('time')}
                    disabled={isLoading}
                    className="w-full"
                  />
                  {errors.time && (
                    <p className="text-sm text-destructive mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <Input
                  id="location"
                  placeholder="Innovation Hub, Downtown"
                  {...register('location')}
                  disabled={isLoading}
                  className="w-full"
                />
                {errors.location && (
                  <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="totalSlots" className="block text-sm font-medium text-foreground mb-2">
                  Total Slots
                </label>
                <Input
                  id="totalSlots"
                  type="number"
                  placeholder="100"
                  {...register('totalSlots')}
                  disabled={isLoading}
                  className="w-full"
                />
                {errors.totalSlots && (
                  <p className="text-sm text-destructive mt-1">{errors.totalSlots.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-32 overflow-hidden rounded-md border border-border bg-muted">
                    <Image src={imagePreview} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="event-image-create"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isLoading || isUploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setIsUploadingImage(true);
                          const uploadedPath = await uploadImage(file);
                          setValue('image', uploadedPath, { shouldDirty: true });
                        } catch (err) {
                          toastError('Upload failed', err instanceof Error ? err.message : 'Upload failed.');
                        } finally {
                          setIsUploadingImage(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading || isUploadingImage}
                      className="gap-2"
                      asChild
                    >
                      <label htmlFor="event-image-create" className="cursor-pointer">
                        {isUploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </Button>
                    <input type="hidden" {...register('image')} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
