'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password. Please try again.');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
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
        <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
          New Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...register('password')}
          disabled={isLoading}
          className="w-full text-white placeholder:text-white/60 border-white/25 focus-visible:ring-white/20 focus-visible:border-white/50"
        />
        {errors.password && (
          <p className="text-sm text-rose-200 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="********"
          {...register('confirmPassword')}
          disabled={isLoading}
          className="w-full text-white placeholder:text-white/60 border-white/25 focus-visible:ring-white/20 focus-visible:border-white/50"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-rose-200 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        variant="outline"
        className="group w-full relative overflow-hidden border-white/25 bg-white/10 text-white hover:bg-transparent hover:text-white"
      >
        <span
          aria-hidden
          className="absolute inset-0 translate-y-full bg-sky-500 transition-transform duration-300 ease-out group-hover:translate-y-0"
        />
        <span className="relative z-10 inline-flex items-center justify-center w-full">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </span>
      </Button>

      <div className="text-center text-sm">
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-white hover:text-white/80 underline"
          onClick={() => router.push('/login')}
        >
          Back to login
        </Button>
      </div>
    </form>
  );
}
