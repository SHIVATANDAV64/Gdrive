import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActiveUser {
    userId: string;
    userName: string;
    userEmail: string;
}

interface ActiveUsersProps {
    users: ActiveUser[];
    maxVisible?: number;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
};

const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
};


const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-sky-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
        'bg-rose-500',
    ];

    return colors[Math.abs(hash) % colors.length];
};


const getInitials = (name: string, email: string): string => {
    if (name && name.trim()) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
};

export function ActiveUsers({ users, maxVisible = 3, size = 'md' }: ActiveUsersProps) {
    const { visible, overflow } = useMemo(() => {
        if (users.length <= maxVisible) {
            return { visible: users, overflow: 0 };
        }
        return {
            visible: users.slice(0, maxVisible),
            overflow: users.length - maxVisible,
        };
    }, [users, maxVisible]);

    if (users.length === 0) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="flex items-center">
                {visible.map((user, index) => (
                    <Tooltip key={user.userId}>
                        <TooltipTrigger asChild>
                            <div
                                className={`
                  ${sizeClasses[size]}
                  ${index > 0 ? overlapClasses[size] : ''}
                  ${stringToColor(user.userEmail)}
                  rounded-full flex items-center justify-center
                  text-white font-medium
                  ring-2 ring-background
                  cursor-default
                  transition-transform hover:scale-110 hover:z-10
                `}
                                style={{ zIndex: visible.length - index }}
                            >
                                {getInitials(user.userName, user.userEmail)}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-medium">{user.userName || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {overflow > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={`
                  ${sizeClasses[size]}
                  ${overlapClasses[size]}
                  bg-muted text-muted-foreground
                  rounded-full flex items-center justify-center
                  font-medium ring-2 ring-background
                  cursor-default
                `}
                            >
                                +{overflow}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-medium">
                                {overflow} more {overflow === 1 ? 'person' : 'people'}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                                {users.slice(maxVisible).map((u) => (
                                    <p key={u.userId}>{u.userName || u.userEmail}</p>
                                ))}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}
