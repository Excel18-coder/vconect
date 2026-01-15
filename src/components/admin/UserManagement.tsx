/**
 * User Management Component
 * Manage all users in the system
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { authFetch } from '@/services/api-client';
import { Ban, CheckCircle, ChevronDown, ChevronRight, Package, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  display_name: string;
  user_type: string;
  email_verified: boolean;
  location: string;
  phone_number: string;
  product_count: number;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  views: number;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [userProducts, setUserProducts] = useState<Record<string, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, search, userTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(userTypeFilter !== 'all' && { userType: userTypeFilter }),
      });

      const response = await authFetch(`/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await authFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User role updated successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      const response = await authFetch(`/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Suspended by admin' }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User suspended successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await authFetch(`/admin/users/${userId}/verify`, {
        method: 'PATCH',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User verified successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This will permanently delete the user and all their products, messages, and data. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await authFetch(`/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User deleted successfully');
        fetchUsers();
        // Remove from expanded users if it was expanded
        setExpandedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleUserProducts = async (userId: string) => {
    const isExpanded = expandedUsers.has(userId);

    if (isExpanded) {
      // Collapse
      setExpandedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      // Expand and fetch products if not already loaded
      setExpandedUsers(prev => new Set(prev).add(userId));

      if (!userProducts[userId]) {
        setLoadingProducts(prev => new Set(prev).add(userId));
        try {
          const response = await authFetch(`/admin/users/${userId}/products`);
          const data = await response.json();

          if (data.success) {
            setUserProducts(prev => ({
              ...prev,
              [userId]: data.data.products,
            }));
          }
        } catch (error) {
          toast.error('Failed to load user products');
        } finally {
          setLoadingProducts(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="buyer">Buyers</SelectItem>
              <SelectItem value="seller">Sellers</SelectItem>
              <SelectItem value="landlord">Landlords</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => {
                  const isExpanded = expandedUsers.has(user.id);
                  const products = userProducts[user.id] || [];
                  const isLoadingProducts = loadingProducts.has(user.id);

                  return (
                    <>
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.product_count > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleUserProducts(user.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.display_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.user_type === 'admin' ? 'destructive' : 'secondary'}>
                            {user.user_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{user.location || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{user.product_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.user_type}
                              onValueChange={value => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buyer">Buyer</SelectItem>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="landlord">Landlord</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {!user.email_verified && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVerifyUser(user.id)}
                                className="h-8 w-8 p-0"
                                title="Verify user"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSuspendUser(user.id)}
                              className="h-8 w-8 p-0"
                              title="Suspend user"
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="h-8 w-8 p-0"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Products Row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50 dark:bg-gray-900">
                            <div className="p-4">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                User's Products ({user.product_count})
                              </h4>
                              {isLoadingProducts ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                </div>
                              ) : products.length === 0 ? (
                                <p className="text-sm text-gray-500">No products found</p>
                              ) : (
                                <div className="grid gap-2">
                                  {products.map(product => (
                                    <div
                                      key={product.id}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{product.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          <span className="capitalize">{product.category}</span>
                                          {' • '}
                                          <Badge variant="outline" className="text-xs">
                                            {product.status}
                                          </Badge>
                                          {' • '}
                                          {product.views} views
                                        </div>
                                      </div>
                                      <div className="text-sm font-semibold">
                                        KES {product.price.toLocaleString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UserManagement;
