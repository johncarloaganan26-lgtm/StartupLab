'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/reset-password-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="relative min-h-screen bg-background">
        <Image
          src="/stlab.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="absolute left-4 top-4 z-10">
          <Link href="/">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="group relative overflow-hidden bg-transparent text-white border-white/25 hover:bg-transparent hover:text-white"
            >
              <span
                aria-hidden
                className="absolute inset-0 translate-y-full bg-sky-500 transition-transform duration-300 ease-out group-hover:translate-y-0"
              />
              <span className="relative z-10 inline-flex items-center gap-2">
                <Home className="size-4" />
                Home
              </span>
            </Button>
          </Link>
        </div>

        <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
          <Card className="w-full max-w-md bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="items-center text-center space-y-4">
              <Image
                src="/login-logo-tight.png?v=3"
                alt="Startup Lab"
                width={88}
                height={25}
                className="h-auto w-[88px] max-w-none select-none"
                priority
              />
              <div className="space-y-1">
                <CardTitle className="text-2xl text-white">Invalid Reset Link</CardTitle>
                <CardDescription className="text-white/70">The password reset link is invalid or has expired.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = '/forgot-password'}
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Image
        src="/stlab.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="absolute left-4 top-4 z-10">
        <Link href="/">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="group relative overflow-hidden bg-transparent text-white border-white/25 hover:bg-transparent hover:text-white"
          >
            <span
              aria-hidden
              className="absolute inset-0 translate-y-full bg-sky-500 transition-transform duration-300 ease-out group-hover:translate-y-0"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              <Home className="size-4" />
              Home
            </span>
          </Button>
        </Link>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="items-center text-center space-y-4">
            <Image
              src="/login-logo-tight.png?v=3"
              alt="Startup Lab"
              width={88}
              height={25}
              className="h-auto w-[88px] max-w-none select-none"
              priority
            />
            <div className="space-y-1">
              <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
              <CardDescription className="text-white/70">Enter your new password</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        <Image
          src="/stlab.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
