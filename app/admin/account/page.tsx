'use client';

import { useState } from 'react';
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

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AdminAccountPage() {
  const { user, updateProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password change state
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
      setGlobalLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
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
      setGlobalLoading(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="max-w-2xl space-y-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              My Account
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your admin profile and account details
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        placeholder="Admin User"
                        {...register('name')}
                        disabled={isLoading}
                        className="w-full"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        {...register('email')}
                        disabled={isLoading}
                        className="w-full"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                        Company (Optional)
                      </label>
                      <Input
                        id="company"
                        placeholder="Your Company"
                        {...register('company')}
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Phone (Optional)
                      </label>
                      <Input
                        id="phone"
                        placeholder="+63 912 345 6789"
                        {...register('phone')}
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                      Bio (Optional)
                    </label>
                    <Input
                      id="bio"
                      placeholder="Tell us about yourself"
                      {...register('bio')}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>

                  {successMessage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <p className="text-green-800 text-sm">{successMessage}</p>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPw(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerPw('currentPassword')}
                      disabled={isChangingPassword}
                      className="w-full"
                    />
                    {pwErrors.currentPassword && (
                      <p className="text-sm text-destructive mt-1">{pwErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        {...registerPw('newPassword')}
                        disabled={isChangingPassword}
                        className="w-full"
                      />
                      {pwErrors.newPassword && (
                        <p className="text-sm text-destructive mt-1">{pwErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...registerPw('confirmPassword')}
                        disabled={isChangingPassword}
                        className="w-full"
                      />
                      {pwErrors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">{pwErrors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  {passwordSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <p className="text-green-800 text-sm">{passwordSuccess}</p>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800 text-sm">{passwordError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isChangingPassword}
                      className="gap-2"
                    >
                      {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your administrator account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Type</p>
                    <p className="font-medium text-foreground capitalize mt-1">
                      {user?.role || 'admin'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium text-foreground mt-1">
                      {memberSince}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
