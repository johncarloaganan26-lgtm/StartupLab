'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/app-context';
import { AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useApp();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setIsLoading(true);
      const signedInUser = await login(data.email, data.password);
      router.push(signedInUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
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

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
          Password
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
        <div className="mt-2 text-sm text-left">
          <span className="text-white/70">Forgot password? </span>
          <Link href="/forgot-password" className="text-white hover:underline font-medium">
            Reset it here
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-sky-500 hover:bg-sky-500 text-white"
      >
        <span className="inline-flex items-center justify-center w-full">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </span>
      </Button>

      <div className="text-center text-sm">
        <div>
          <span className="text-white/70">Don't have an account? </span>
          <Link href="/signup" className="text-white hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </form>
  );
}
