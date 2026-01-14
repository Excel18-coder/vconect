/**
 * Activity Log Component
 * Display system activity and audit logs
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authFetch } from '@/shared/api/client';
import { Activity, Clock, MessageSquare, Package, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ActivityLogItem {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

const getActivityIcon = (entityType: string) => {
  switch (entityType) {
    case 'user':
      return <User className="h-5 w-5 text-blue-500" />;
    case 'product':
      return <Package className="h-5 w-5 text-green-500" />;
    case 'message':
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    default:
      return <Settings className="h-5 w-5 text-gray-500" />;
  }
};

const getActionColor = (action: string) => {
  if (action.includes('create')) return 'default';
  if (action.includes('update')) return 'secondary';
  if (action.includes('delete')) return 'destructive';
  return 'outline';
};

export function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const response = await authFetch('/admin/activity-logs?limit=50');
      const data = await response.json();

      if (data.success) {
        setActivities(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Live
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-1">{getActivityIcon(activity.entity_type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {activity.user_name || activity.user_email}
                    </span>
                    <Badge variant={getActionColor(activity.action)} className="text-xs">
                      {activity.action}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {activity.entity_type === 'user' && 'User profile'}
                    {activity.entity_type === 'product' && 'Product'}
                    {activity.entity_type === 'message' && 'Message'}
                    {activity.entity_type === 'setting' && 'System setting'}
                    {activity.details && (
                      <span className="ml-1">
                        {activity.details.title || activity.details.name || ''}
                      </span>
                    )}
                  </p>

                  {activity.details && activity.details.changes && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Changes:</span>{' '}
                      {Object.entries(activity.details.changes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {formatTime(activity.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityLog;
