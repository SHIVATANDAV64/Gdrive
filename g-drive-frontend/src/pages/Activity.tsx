 

import ActivityLog from '@/components/features/ActivityLog';
import { Clock } from 'lucide-react';

 
const ActivityPage = () => {
    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Clock className="h-6 w-6 text-[var(--color-primary)]" />
                    Activity Log
                </h1>
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
                <ActivityLog />
            </div>
        </div>
    );
};

export default ActivityPage;
