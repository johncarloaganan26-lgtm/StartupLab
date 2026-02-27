'use client';

import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black">
      <Image
        src="/stlab.jpg"
        alt="Startup Lab team background"
        fill
        priority
        className="object-cover object-center"
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

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <section className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl sm:p-8">
          <div className="space-y-6">
            <Image
              src="/login-logo-tight.png?v=3"
              alt="Startup Lab Business Center"
              width={88}
              height={25}
              className="h-auto w-[88px] max-w-none select-none"
              priority
            />
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
              <p className="text-white/70">Sign in to your Startup Lab account</p>
            </div>
          </div>
          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
