'use client';

import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect, useState, useMemo } from 'react';
import {
  DataToolbar,
  DataPagination,
  usePaginatedData,
  exportToCSV,
  type FilterConfig,
} from '@/components/data-toolbar';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { useLoading } from '@/contexts/loading-context';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'attendee' | 'admin';
  eventCount: number;
  lastRegistered: string | null;
};

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { setLoading: setGlobalLoading } = useLoading();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'attendee'>('attendee');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, sortBy]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        // Silently handle auth errors - user may not be admin
        if (res.status === 401 || res.status === 403) {
          setUsers([]);
          setIsLoading(false);
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Failed to load users' }));
        throw new Error(errorData?.error || 'Failed to load users.');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    let data = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'all') {
      data = data.filter((u) => u.role === roleFilter);
    }

    switch (sortBy) {
      case 'name-asc':
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        data.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'most-events':
        data.sort((a, b) => b.eventCount - a.eventCount);
        break;
      case 'least-events':
        data.sort((a, b) => a.eventCount - b.eventCount);
        break;
      default:
        break; // newest (default from API)
    }

    return data;
  }, [users, search, roleFilter, sortBy]);

  const { paginatedData, totalItems, totalPages, safePage } = usePaginatedData(filtered, PAGE_SIZE, currentPage);

  const filters: FilterConfig[] = [
    {
      key: 'role',
      label: 'Role',
      value: roleFilter,
      onChange: setRoleFilter,
      options: [
        { label: 'All Roles', value: 'all' },
        { label: 'Attendee', value: 'attendee' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      key: 'sort',
      label: 'Sort',
      value: sortBy,
      onChange: setSortBy,
      options: [
        { label: 'Newest First', value: 'newest' },
        { label: 'Name A-Z', value: 'name-asc' },
        { label: 'Name Z-A', value: 'name-desc' },
        { label: 'Most Events', value: 'most-events' },
        { label: 'Least Events', value: 'least-events' },
      ],
    },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;

    try {
      setGlobalLoading(true, 'Deleting users...');
      const res = await fetch('/api/admin/users/bulk', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete users.');

      toast({
        title: 'Users deleted',
        description: `${selectedIds.length} users have been permanently removed.`,
      });
      setSelectedIds([]);
      await loadUsers();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete users.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      setGlobalLoading(true, 'Deleting user...');
      const res = await fetch('/api/admin/users/bulk', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [user.id] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user.');

      toast({
        title: 'User deleted',
        description: `${user.name} has been permanently removed.`,
      });
      setSelectedIds((prev) => prev.filter((id) => id !== user.id));
      await loadUsers();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete user.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filtered.map(u => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      'Event Count': u.eventCount,
      'Last Registered': u.lastRegistered ? new Date(u.lastRegistered).toLocaleString() : 'Never'
    }));
    exportToCSV(exportData, 'users_report');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    try {
      setGlobalLoading(true, 'Updating user role...');
      const res = await fetch(`/api/admin/users/${editingUser.id}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      toast({ title: 'Role updated', description: `${editingUser.name}'s role is now ${newRole}.` });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update user role.', variant: 'destructive' });
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                User Management
              </h1>
              <p className="text-muted-foreground mt-2">
                View and manage registered users in a table view
              </p>
            </div>
          </div>

          {!isLoading && !error && (
            <DataToolbar
              searchPlaceholder="Search by name or email..."
              searchValue={search}
              onSearchChange={setSearch}
              filters={filters}
              onClearAll={() => { setSearch(''); setRoleFilter('all'); setSortBy('newest'); }}
              totalResults={totalItems}
              resultLabel="users"
              selectedCount={selectedIds.length}
              onBulkDelete={handleBulkDelete}
              onExport={handleExport}
              onPrint={handlePrint}
            />
          )}

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
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left w-12">
                        <Checkbox
                          checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground text-center">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground text-center">Events</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Last Activity</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={selectedIds.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-primary">{user.eventCount}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {user.lastRegistered ? new Date(user.lastRegistered).toLocaleDateString() : 'None'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Role"
                              onClick={() => {
                                setEditingUser(user);
                                setNewRole(user.role);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
        </div>

        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">User: {editingUser?.name}</p>
                <p className="text-xs text-muted-foreground">{editingUser?.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="attendee">Attendee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={isUpdating} className="bg-primary hover:bg-primary/90">
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  );
}
