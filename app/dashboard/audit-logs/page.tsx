'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { Loader2, Eye, Download } from 'lucide-react';
import { formatPHDateTime } from '@/lib/time';
import { AuditDetails } from '@/components/audit-details';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  exportToCSV,
} from '@/components/data-toolbar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  detailsJson: unknown | null;
  createdAt: string;
  summary: string;
  target: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
};

const PAGE_SIZE = 20;

export default function UserAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-logs', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load audit logs.');
      setLogs(data.logs || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.target?.toLowerCase().includes(q) ||
        l.entityType?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const handleExport = () => {
    const exportData = filtered.map(l => ({
      Timestamp: formatPHDateTime(l.createdAt),
      Actor: l.target || 'You',
      Action: l.action,
      Summary: l.summary,
      Details: l.details || '',
    }));
    exportToCSV(exportData, 'my_audit_logs');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthGuard requiredRole="attendee">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-2">
              Your recent account activity (registrations, cancellations, and updates).
            </p>
          </div>

          <DataToolbar
            searchPlaceholder="Search logs..."
            searchValue={search}
            onSearchChange={setSearch}
            onClearAll={() => setSearch('')}
            totalResults={totalItems}
            resultLabel="activity logs"
            onExport={handleExport}
            onPrint={handlePrint}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto bg-card border border-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="px-6 py-3 text-sm font-semibold text-foreground">Timestamp</th>
                      <th className="px-6 py-3 text-sm font-semibold text-foreground">Actor</th>
                      <th className="px-6 py-3 text-sm font-semibold text-foreground">Action</th>
                      <th className="px-6 py-3 text-sm font-semibold text-foreground">Summary</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedData.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatPHDateTime(row.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {row.target || 'You'}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {row.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {row.summary}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(row)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No audit logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <DataPagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
              />
            </>
          )}

          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle>Activity Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Timestamp</p>
                    <p className="font-medium text-foreground">{selectedLog && formatPHDateTime(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Actor</p>
                    <p className="font-medium text-foreground">{selectedLog?.target || 'You'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Action</p>
                    <p className="font-medium text-foreground">{selectedLog?.action}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Entity Type</p>
                    <p className="font-medium text-foreground">{selectedLog?.entityType || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Summary</p>
                    <p className="font-medium text-foreground">{selectedLog?.summary}</p>
                  </div>
                  {selectedLog?.details && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground uppercase text-[10px] font-bold">Details</p>
                      <p className="font-medium text-foreground whitespace-pre-wrap">{selectedLog.details}</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
