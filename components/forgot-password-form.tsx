'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset instructions. Please try again.');
      }

      setSuccess('Password reset instructions have been sent to your email');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset instructions. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-4 bg-rose-600/20 border border-rose-400/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-100">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-600/20 border border-green-400/30 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-100">{success}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
          className="w-full text-white placeholder:text-white/60 border-white/25 focus-visible:ring-white/20 focus-visible:border-white/50"
        />
        {errors.email && (
          <p className="text-sm text-rose-200 mt-1">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-sky-500 hover:bg-sky-500 text-white"
      >
        <span className="inline-flex items-center justify-center w-full">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </span>
      </Button>

      <div className="text-center text-sm">
        <span className="text-white/70">Remember your password? </span>
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-white hover:text-white/80 underline"
          onClick={() => router.push('/login')}
        >
          Sign in
        </Button>
      </div>
    </form>
  );
}
