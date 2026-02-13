import { useQuery } from '@tanstack/react-query';
import { getActivities, type Activity } from '@/services/activity.service';
import { 
  Upload, 
  Pencil, 
  Trash2, 
  RotateCcw, 
  FolderInput, 
  Share2, 
  Download, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';

const getActionIcon = (action: string) => {
  switch (action) {
    case 'upload':
      return <Upload className="w-4 h-4 text-blue-500" />;
    case 'rename':
      return <Pencil className="w-4 h-4 text-orange-500" />;
    case 'delete':
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case 'restore':
      return <RotateCcw className="w-4 h-4 text-green-500" />;
    case 'move':
      return <FolderInput className="w-4 h-4 text-purple-500" />;
    case 'share':
      return <Share2 className="w-4 h-4 text-indigo-500" />;
    case 'download':
      return <Download className="w-4 h-4 text-teal-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'upload':
      return 'Uploaded a file';
    case 'rename':
      return 'Renamed an item';
    case 'delete':
      return 'Moved to trash';
    case 'restore':
      return 'Restored from trash';
    case 'move':
      return 'Moved an item';
    case 'share':
      return 'Shared an item';
    case 'download':
      return 'Downloaded a file';
    default:
      return 'Performed an action';
  }
};

/**
 * Format the activity context into a human-readable string
 */
const formatActivityContext = (action: string, context: string): string => {
  if (!context) return 'Unknown item';
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(context);
    
    switch (action) {
      case 'upload':
        return parsed.name || parsed.fileName || 'a file';
      
      case 'rename':
        if (parsed.oldName && parsed.newName) {
          return `"${parsed.oldName}" → "${parsed.newName}"`;
        }
        return parsed.name || 'an item';
      
      case 'delete':
        return parsed.name || 'an item';
      
      case 'restore':
        return parsed.name || 'an item';
      
      case 'move':
        if (parsed.name && parsed.destination) {
          return `"${parsed.name}" to "${parsed.destination}"`;
        }
        return parsed.name || 'an item';
      
      case 'share':
        if (parsed.granteeEmail) {
          const role = parsed.role || 'viewer';
          return `with ${parsed.granteeEmail} as ${role}`;
        }
        return parsed.name || 'an item';
      
      case 'download':
        return parsed.name || parsed.fileName || 'a file';
      
      default:
        // For any other action, try to extract a meaningful name
        return parsed.name || parsed.fileName || parsed.title || 'an item';
    }
  } catch {
    // If not valid JSON, return as-is (it might already be a plain string)
    return context;
  }
};

export const ActivityLog = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: getActivities,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)]">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[var(--color-text)] mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity: Activity) => (
          <div 
            key={activity.$id}
            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div className="mt-0.5 p-1.5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)]">
              {getActionIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)]">
                {getActionLabel(activity.action)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                {formatActivityContext(activity.action, activity.context)}
              </p>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
              {getRelativeTime(activity.$createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;