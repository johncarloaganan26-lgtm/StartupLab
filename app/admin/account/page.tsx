'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth-guard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useLoading } from '@/contexts/loading-context';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AdminAccountPage() {
  const { user, updateProfile } = useApp();
  const { setLoading: setGlobalLoading } = useLoading();

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setGlobalLoading(true, 'Updating profile...');
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
      setIsSaving(false);
      setGlobalLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    setGlobalLoading(true, 'Changing password...');
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
      setGlobalLoading(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="p-4 space-y-6 max-w-6xl mx-auto">
          <div className="admin-page-header flex flex-col gap-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Admin Account</h1>
            <p className="text-sm text-muted-foreground">Keep your profile and security details up to date.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your admin details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field id="name" label="Full Name" error={errors.name?.message}>
                        <Input id="name" placeholder="Admin User" {...register('name')} disabled={isSaving} />
                      </Field>
                      <Field id="email" label="Email Address" error={errors.email?.message}>
                        <Input id="email" type="email" placeholder="admin@example.com" {...register('email')} disabled={isSaving} />
                      </Field>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Field id="company" label="Company (Optional)">
                        <Input id="company" placeholder="StartupLab" {...register('company')} disabled={isSaving} />
                      </Field>
                      <Field id="phone" label="Phone (Optional)">
                        <Input id="phone" placeholder="+63 912 345 6789" {...register('phone')} disabled={isSaving} />
                      </Field>
                    </div>

                    <Field id="bio" label="Bio (Optional)">
                      <Input id="bio" placeholder="Tell us about yourself" {...register('bio')} disabled={isSaving} />
                    </Field>

                    {successMessage && <Banner tone="success" message={successMessage} />}
                    {errorMessage && <Banner tone="error" message={errorMessage} />}

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" disabled={isSaving} className="gap-2 bg-[#1f7fe0] hover:bg-[#1a6dc4] text-white">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Account Snapshot</CardTitle>
                  <CardDescription>Quick view of your admin account</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <InfoTile label="Account Type" value={user?.role || 'admin'} />
                  <InfoTile label="Member Since" value={memberSince} />
                  <InfoTile label="Email" value={user?.email || 'N/A'} />
                  <InfoTile label="Name" value={user?.name || 'N/A'} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Keep your admin access secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPw(onPasswordSubmit)} className="space-y-4">
                    <Field id="currentPassword" label="Current Password" error={pwErrors.currentPassword?.message}>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="********"
                        {...registerPw('currentPassword')}
                        disabled={isChangingPassword}
                      />
                    </Field>

                    <Field id="newPassword" label="New Password" error={pwErrors.newPassword?.message}>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="********"
                        {...registerPw('newPassword')}
                        disabled={isChangingPassword}
                      />
                    </Field>

                    <Field id="confirmPassword" label="Confirm New Password" error={pwErrors.confirmPassword?.message}>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="********"
                        {...registerPw('confirmPassword')}
                        disabled={isChangingPassword}
                      />
                    </Field>

                    {passwordSuccess && <Banner tone="success" message={passwordSuccess} />}
                    {passwordError && <Banner tone="error" message={passwordError} />}

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" variant="outline" disabled={isChangingPassword} className="gap-2">
                        {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
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
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-md p-3 bg-muted/30">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1 break-words">{value}</p>
    </div>
  );
}

function Banner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  const styles =
    tone === 'success'
      ? 'bg-blue-50 border border-blue-200 text-blue-800'
      : 'bg-red-50 border border-red-200 text-red-800';
  const Icon = tone === 'success' ? Check : AlertCircle;

  return (
    <div className={`p-4 rounded-none flex items-center gap-2 ${styles}`}>
      <Icon className="w-5 h-5" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

