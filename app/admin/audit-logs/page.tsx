'use client';

import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  exportToCSV,
  type FilterConfig,
} from '@/components/data-toolbar';
import { AuditDetails } from '@/components/audit-details';
import { Eye, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type AuditLog = {
  id: string;
  adminUserId: string;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  detailsJson: any;
  createdAt: string;
  summary: string;
  target: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
};

const PAGE_SIZE = 30;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [search, categoryFilter, entityFilter]);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/audit-logs', { credentials: 'include' });
        if (!res.ok) {
          // Silently handle auth errors - user may not be admin
          if (res.status === 401 || res.status === 403) {
            setLogs([]);
            setLoading(false);
            return;
          }
          const errorData = await res.json().catch(() => ({ error: 'Failed to fetch logs' }));
          throw new Error(errorData.error || 'Failed to fetch logs');
        }
        const data = await res.json();
        if (isMounted) setLogs(data.logs || []);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Error fetching logs');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let data = [...logs];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.adminName?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      data = data.filter((l) => l.tone === categoryFilter);
    }

    if (entityFilter !== 'all') {
      data = data.filter((l) => l.entityType === entityFilter);
    }

    return data;
  }, [logs, search, categoryFilter, entityFilter]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { label: 'All Tones', value: 'all' },
        { label: 'Success', value: 'success' },
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Danger', value: 'danger' },
        { label: 'Neutral', value: 'neutral' },
      ],
    },
    {
      key: 'entity',
      label: 'Entity',
      value: entityFilter,
      onChange: setEntityFilter,
      options: [
        { label: 'All Entities', value: 'all' },
        { label: 'Event', value: 'event' },
        { label: 'Registration', value: 'registration' },
        { label: 'User', value: 'user' },
      ],
    },
  ];

  const handleExport = () => {
    const exportData = filtered.map(l => ({
      ID: l.id,
      Actor: l.adminName,
      Action: l.action,
      Entity: l.entityType,
      'Entity ID': l.entityId,
      Date: new Date(l.createdAt).toLocaleString(),
      Tone: l.tone
    }));
    exportToCSV(exportData, 'audit_logs_report');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6 print:space-y-0">
          <div className="print:hidden">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-2">
              Track administrative activities across the platform.
            </p>
          </div>

          {!loading && !error && (
            <DataToolbar
              searchPlaceholder="Search logs..."
              searchValue={search}
              onSearchChange={setSearch}
              filters={filters}
              onClearAll={() => { setSearch(''); setCategoryFilter('all'); setEntityFilter('all'); }}
              totalResults={totalItems}
              resultLabel="logs"
              onExport={handleExport}
              onPrint={handlePrint}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-card border border-destructive/20 rounded-lg p-6 text-center text-destructive">
              {error}
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto bg-card border border-border rounded-lg">
                <div className="pointer-events-none absolute inset-0 z-0 hidden items-end justify-center pb-10 print:flex">
                  <img
                    src="/Dark-e1735336357773.png"
                    alt=""
                    className="print-watermark h-auto w-[1180px] object-contain"
                  />
                </div>
                <table className="relative z-10 w-full">
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
                    {paginatedData.map((log) => {
                      const toneClass =
                        log.tone === 'success' ? 'text-emerald-600' :
                          log.tone === 'info' ? 'text-sky-600' :
                            log.tone === 'warning' ? 'text-amber-600' :
                              log.tone === 'danger' ? 'text-rose-600' :
                                'text-muted-foreground';

                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-foreground text-sm">{log.adminName || 'System'}</p>
                            <p className="text-xs text-muted-foreground">{log.adminEmail}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current ${toneClass}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{log.summary}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          No logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="print:hidden">
                <DataPagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={PAGE_SIZE}
                  totalItems={totalItems}
                />
              </div>
            </>
          )}

          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle>Audit Log Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Action</p>
                    <p className="font-medium text-foreground uppercase">{selectedLog?.action}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Timestamp</p>
                    <p className="font-medium text-foreground">
                      {selectedLog && new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Raw Action Data</p>
                  <pre className="text-[11px] font-mono text-foreground overflow-auto max-h-[400px] leading-relaxed">
                    {JSON.stringify(selectedLog?.detailsJson, null, 2)}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
