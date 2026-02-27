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

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordPolicy, 'Use upper, lower, number, and special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const { signup } = useApp();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const passwordValue = watch('password') || '';
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError('');
      setIsLoading(true);
      await signup(data.name, data.email, data.password, 'attendee');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
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
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...register('name')}
          disabled={isLoading}
          className="w-full text-white placeholder:text-white/60 border-white/25 focus-visible:ring-white/20 focus-visible:border-white/50"
        />
        {errors.name && (
          <p className="text-sm text-rose-200 mt-1">{errors.name.message}</p>
        )}
      </div>

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
          onFocus={() => setShowPasswordHints(true)}
          onBlur={() => setShowPasswordHints(passwordValue.length > 0)}
          className="w-full text-white placeholder:text-white/60 border-white/25 focus-visible:ring-white/20 focus-visible:border-white/50"
        />
        {errors.password && (
          <p className="text-sm text-rose-200 mt-1">{errors.password.message}</p>
        )}
        {showPasswordHints && (
          <div className="mt-2 text-[11px] leading-5 text-white/80 bg-white/5 border border-white/10 rounded-md p-3">
            <p className="font-semibold text-white">Password Requirements</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>At least 8 characters</li>
              <li>At least 1 uppercase letter (A-Z)</li>
              <li>At least 1 lowercase letter (a-z)</li>
              <li>At least 1 number (0-9)</li>
              <li>At least 1 special character (!@#$%^&*)</li>
            </ul>
          </div>
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
        className="w-full bg-sky-500 hover:bg-sky-500 text-white"
      >
        <span className="inline-flex items-center justify-center w-full">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Creating account...' : 'Create Account'}
        </span>
      </Button>

      <div className="text-center text-sm">
        <span className="text-white/70">Already have an account? </span>
        <Link href="/login" className="text-white hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </form>
  );
}
