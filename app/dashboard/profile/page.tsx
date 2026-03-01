'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth-guard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordPolicy, 'Use upper, lower, number, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      company: user?.company || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    },
  });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    watch: watchPw,
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });
  const newPasswordValue = watchPw('newPassword') || '';

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateProfile({
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        bio: data.bio,
      });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Failed to change password.');

      setPasswordSuccess('Password changed successfully!');
      resetPw();
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
      setTimeout(() => setPasswordError(''), 5000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AuthGuard requiredRole="attendee">
      <DashboardLayout>
        <div className="p-4 space-y-6 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">My Profile</h1>
              <p className="text-sm text-muted-foreground font-medium">Manage your personal info and security settings.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <Card className="bg-white border-border rounded-none shadow-sm">
                <CardHeader className="border-b border-border bg-slate-50/50">
                  <CardTitle className="text-lg font-black text-[#334155]">Profile Information</CardTitle>
                  <CardDescription className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field id="name" label="Full Name" error={errors.name?.message}>
                        <Input id="name" placeholder="Your Name" {...register('name')} disabled={isLoading} className="rounded-none h-11 border-slate-200" />
                      </Field>
                      <Field id="email" label="Email Address" error={errors.email?.message}>
                        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isLoading} className="rounded-none h-11 border-slate-200" />
                      </Field>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Field id="company" label="Company (Optional)">
                        <Input id="company" placeholder="Your Company" {...register('company')} disabled={isLoading} className="rounded-none h-11 border-slate-200" />
                      </Field>
                      <Field id="phone" label="Phone (Optional)">
                        <Input id="phone" placeholder="+63 912 345 6789" {...register('phone')} disabled={isLoading} className="rounded-none h-11 border-slate-200" />
                      </Field>
                    </div>

                    <Field id="bio" label="Bio (Optional)">
                      <Input id="bio" placeholder="Tell us about yourself" {...register('bio')} disabled={isLoading} className="rounded-none h-11 border-slate-200" />
                    </Field>

                    {successMessage && (
                      <Banner tone="success" message={successMessage} />
                    )}
                    {errorMessage && (
                      <Banner tone="error" message={errorMessage} />
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={isLoading} className="gap-2 bg-[#1f7fe0] hover:bg-[#1a6dc4] text-white rounded-none h-11 px-6 shadow-md border-b-4 border-[#155ca0] active:border-b-0 active:translate-y-1 transition-all">
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span className="font-black text-xs uppercase tracking-widest">{isLoading ? 'Saving...' : 'Save Changes'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white border-border rounded-none shadow-sm">
                <CardHeader className="border-b border-border bg-slate-50/50">
                  <CardTitle className="text-lg font-black text-[#334155]">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 pt-6">
                  <InfoTile label="Account Type" value={user?.role || 'attendee'} />
                  <InfoTile label="Member Since" value={memberSince} />
                  <InfoTile label="Email" value={user?.email || '—'} />
                  <InfoTile label="Name" value={user?.name || '—'} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white border-border rounded-none shadow-sm">
                <CardHeader className="border-b border-border bg-slate-50/50">
                  <CardTitle className="text-lg font-black text-[#334155]">Change Password</CardTitle>
                  <CardDescription className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmitPw(onPasswordSubmit)} className="space-y-4">
                    <Field id="currentPassword" label="Current Password" error={pwErrors.currentPassword?.message}>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        {...registerPw('currentPassword')}
                        disabled={isChangingPassword}
                        className="rounded-none h-11 border-slate-200"
                      />
                    </Field>

                    <Field id="newPassword" label="New Password" error={pwErrors.newPassword?.message}>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        {...registerPw('newPassword')}
                        disabled={isChangingPassword}
                        onFocus={() => setShowPasswordHints(true)}
                        onBlur={() => setShowPasswordHints(newPasswordValue.length > 0)}
                        className="rounded-none h-11 border-slate-200"
                      />
                      {showPasswordHints && (
                        <div className="mt-2 text-xs text-foreground/80 bg-slate-50 border border-border rounded-none p-3 shadow-inner">
                          <p className="font-black text-[#334155] uppercase tracking-tight mb-1">Password Requirements</p>
                          <ul className="list-disc list-inside space-y-0.5 font-bold">
                            <li>At least 8 characters</li>
                            <li>Uppercase, lowercase, number</li>
                            <li>One special character (!@#$%^&*)</li>
                          </ul>
                        </div>
                      )}
                    </Field>

                    <Field id="confirmPassword" label="Confirm New Password" error={pwErrors.confirmPassword?.message}>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...registerPw('confirmPassword')}
                        disabled={isChangingPassword}
                        className="rounded-none h-11 border-slate-200"
                      />
                    </Field>

                    {passwordSuccess && <Banner tone="success" message={passwordSuccess} />}
                    {passwordError && <Banner tone="error" message={passwordError} />}

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" variant="excel" disabled={isChangingPassword} className="gap-2 h-10 px-6">
                        {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span className="font-black text-xs uppercase tracking-widest">{isChangingPassword ? 'Changing...' : 'Change Password'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-black text-[#64748b] uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600 mt-1 font-bold">{error}</p>}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-none p-3 bg-slate-50/50 shadow-sm ring-1 ring-black/5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{label}</p>
      <p className="text-sm font-bold text-[#334155] mt-1 break-words leading-tight">{value}</p>
    </div>
  );
}

function Banner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  const styles =
    tone === 'success'
      ? 'bg-blue-50 border border-blue-200 text-blue-800 shadow-sm'
      : 'bg-red-50 border border-red-200 text-red-800 shadow-sm';
  const Icon = tone === 'success' ? Check : AlertCircle;

  return (
    <div className={`p-4 rounded-none flex items-center gap-3 ${styles}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-bold">{message}</p>
    </div>
  );
}
