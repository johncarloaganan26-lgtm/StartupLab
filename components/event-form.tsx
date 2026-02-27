'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useApp, Event } from '@/contexts/app-context';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const eventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
    location: z.string().min(3, 'Location is required'),
    totalSlots: z.coerce.number().min(1, 'At least 1 slot is required'),
    image: z.string().min(1, 'Image is required'),
    status: z.enum(['draft', 'published', 'completed', 'cancelled']),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
    initialData?: Event;
    onSuccess?: () => void;
}

export function EventForm({ initialData, onSuccess }: EventFormProps) {
    const { createEvent, updateEvent } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            description: initialData.description,
            date: initialData.date,
            time: initialData.time,
            location: initialData.location,
            totalSlots: initialData.totalSlots,
            image: initialData.image,
            status: initialData.status,
        } : {
            status: 'draft',
            totalSlots: 50,
            image: '',
        },
    });

    const status = watch('status');
    const imageUrl = watch('image');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/events/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setValue('image', data.url);
            toast.success('Image uploaded successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: EventFormData) => {
        try {
            setIsLoading(true);
            if (initialData) {
                const slotDifference = data.totalSlots - initialData.totalSlots;
                const newAvailableSlots = Math.max(0, initialData.availableSlots + slotDifference);

                await updateEvent(initialData.id, {
                    ...data,
                    availableSlots: newAvailableSlots,
                });
            } else {
                await createEvent({
                    ...data,
                    availableSlots: data.totalSlots,
                });
            }
            onSuccess?.();
        } catch (err) {
            console.error(err);
            toast.error(initialData ? 'Failed to update event' : 'Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Event Title</label>
                    <Input
                        {...register('title')}
                        placeholder="e.g. Startup Networking Mixer"
                        disabled={isLoading}
                    />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                        {...register('description')}
                        placeholder="Describe your event..."
                        className="min-h-[100px]"
                        disabled={isLoading}
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                        type="date"
                        {...register('date')}
                        disabled={isLoading}
                    />
                    {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                        type="time"
                        {...register('time')}
                        disabled={isLoading}
                    />
                    {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                        {...register('location')}
                        placeholder="e.g. Innovation Hub, Block 71"
                        disabled={isLoading}
                    />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Total Slots</label>
                    <Input
                        type="number"
                        {...register('totalSlots')}
                        disabled={isLoading}
                    />
                    {errors.totalSlots && <p className="text-xs text-destructive">{errors.totalSlots.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Event Image</label>
                    <div className="mt-1 flex flex-col items-center gap-4 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
                        {imageUrl ? (
                            <div className="relative w-full aspect-video rounded-md overflow-hidden group">
                                <Image
                                    src={imageUrl}
                                    alt="Event Preview"
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setValue('image', '')}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-6">
                                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-center text-muted-foreground">
                                    Click to upload or drag and drop<br />
                                    <span className="text-xs">PNG, JPG or WEBP (MAX. 5MB)</span>
                                </p>
                            </div>
                        )}
                        <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="event-image-upload"
                            onChange={handleFileUpload}
                            disabled={isUploading || isLoading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading || isLoading}
                            onClick={() => document.getElementById('event-image-upload')?.click()}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {imageUrl ? 'Change Image' : 'Select Image'}
                                </>
                            )}
                        </Button>
                    </div>
                    {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                        value={status}
                        onValueChange={(val: any) => setValue('status', val)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSuccess}
                    disabled={isLoading || isUploading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isUploading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Update Event' : 'Create Event'}
                </Button>
            </div>
        </form>
    );
}
