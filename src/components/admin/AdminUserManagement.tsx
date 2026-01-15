import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { authFetch } from '@/services/api-client';
import { AlertCircle, Ban, Loader2, Search, Shield, UserCheck, UserX } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  display_name: string;
  user_type: string;
  created_at: string;
  is_suspended: boolean;
  is_banned: boolean;
  suspend_reason?: string;
  ban_reason?: string;
  product_count: number;
  message_count: number;
  last_activity?: string;
}

interface ActionDialogState {
  open: boolean;
  type: 'suspend' | 'ban' | 'delete' | 'role' | 'unsuspend' | 'unban' | null;
  user: User | null;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    type: null,
    user: null,
  });
  const [actionReason, setActionReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterType, filterStatus, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { userType: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await authFetch(`/admin/users?${params}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data.users);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        setError(result.message || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (type: ActionDialogState['type'], user: User) => {
    setActionDialog({ open: true, type, user });
    setActionReason('');
    setNewRole(user.user_type);
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null, user: null });
    setActionReason('');
    setNewRole('');
  };

  const handleAction = async () => {
    if (!actionDialog.user || !actionDialog.type) return;

    setProcessing(true);
    setError(null);

    try {
      let endpoint = '';
      let method = 'PATCH';
      let body: any = { reason: actionReason };

      switch (actionDialog.type) {
        case 'suspend':
          endpoint = `/admin/users/${actionDialog.user.id}/suspend`;
          break;
        case 'unsuspend':
          endpoint = `/admin/users/${actionDialog.user.id}/unsuspend`;
          break;
        case 'ban':
          endpoint = `/admin/users/${actionDialog.user.id}/ban`;
          break;
        case 'unban':
          endpoint = `/admin/users/${actionDialog.user.id}/unban`;
          break;
        case 'role':
          endpoint = `/admin/users/${actionDialog.user.id}/role`;
          body = { role: newRole, reason: actionReason };
          break;
        case 'delete':
          endpoint = `/admin/users/${actionDialog.user.id}`;
          method = 'DELETE';
          break;
      }

      const response = await authFetch(endpoint, {
        method,
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        closeActionDialog();
        fetchUsers(); // Refresh list
      } else {
        setError(result.message || 'Action failed');
      }
    } catch (err) {
      setError('Failed to perform action');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const getUserStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (user.is_suspended) {
      return <Badge variant="secondary">Suspended</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts, roles, and access</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="seller">Sellers</SelectItem>
                <SelectItem value="landlord">Landlords</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* User Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.display_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.user_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getUserStatusBadge(user)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{user.product_count} products</p>
                          <p className="text-muted-foreground">{user.message_count} messages</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!user.is_suspended && !user.is_banned && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openActionDialog('suspend', user)}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openActionDialog('ban', user)}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            </>
                          )}
                          {user.is_suspended && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog('unsuspend', user)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unsuspend
                            </Button>
                          )}
                          {user.is_banned && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog('unban', user)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unban
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog('role', user)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Role
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'suspend' && 'Suspend User'}
              {actionDialog.type === 'unsuspend' && 'Unsuspend User'}
              {actionDialog.type === 'ban' && 'Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'role' && 'Change User Role'}
              {actionDialog.type === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription>User: {actionDialog.user?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionDialog.type === 'role' && (
              <div>
                <label className="text-sm font-medium">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Textarea
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={3}
              />
            </div>

            {actionDialog.type === 'delete' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. All user data will be permanently deleted.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={!actionReason || processing}
              variant={
                actionDialog.type === 'delete' || actionDialog.type === 'ban'
                  ? 'destructive'
                  : 'default'
              }
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
