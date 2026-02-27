'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth-guard';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to export backup' }));
        throw new Error(data.error || 'Failed to export backup');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `startup_lab_backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Backup exported',
        description: 'SQL backup file downloaded successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err.message || 'Failed to export backup.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    if (!backupFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a .sql backup file first.',
        variant: 'destructive',
      });
      return;
    }

    if (!backupFile.name.toLowerCase().endsWith('.sql')) {
      toast({
        title: 'Invalid file',
        description: 'Only .sql backup files are allowed.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = confirm('Importing backup will overwrite existing data. Continue?');
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', backupFile);

      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to import backup');

      toast({
        title: 'Backup imported',
        description: `SQL restore completed (${data.statements || 0} statements).`,
        variant: 'success',
      });
      setBackupFile(null);
    } catch (err: any) {
      toast({
        title: 'Import failed',
        description: err.message || 'Failed to import backup.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requiredRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="max-w-6xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage system backup and configurations
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-1">
            {/* System Backup */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>System Backup (.sql)</CardTitle>
                <CardDescription>
                  Export all system data as SQL backup and import SQL backups for full restore.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportBackup} disabled={isExporting || isImporting} className="w-full gap-2">
                  {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>

                <Input
                  type="file"
                  accept=".sql"
                  onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                  disabled={isImporting || isExporting}
                  className="w-full"
                />

                <Button
                  variant="outline"
                  onClick={handleImportBackup}
                  disabled={isImporting || isExporting || !backupFile}
                  className="w-full gap-2"
                >
                  {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Import will restore the uploaded SQL backup and can replace current records.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
