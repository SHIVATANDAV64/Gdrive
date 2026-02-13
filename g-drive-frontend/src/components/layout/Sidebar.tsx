
import {
    Home,
    FolderOpen,
    Star,
    Clock,
    Trash2,
    Settings,
    Cloud,
    Plus,
    Activity,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUploadContext } from '@/context/UploadContext';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { useAppActions } from '@/hooks/useAppActions';
import {
    DropdownMenu,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
} from '@/components/ui/DropdownMenu';
import { ROUTES } from '@/lib/constants';


interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const { uploadFiles } = useUploadContext();
    const { usedBytes, totalBytes, percentage, isLoading } = useStorageUsage();
    const { triggerNewFolder } = useAppActions();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create a hidden file input for the "New -> Upload File" action
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFiles(Array.from(e.target.files));
        }
        e.target.value = ''; // Reset
    };

    const navItems = [
        { icon: Home, label: 'My Drive', path: ROUTES.dashboard },
        { icon: FolderOpen, label: 'Shared with me', path: ROUTES.shared },
        { icon: Star, label: 'Starred', path: ROUTES.starred },
        { icon: Clock, label: 'Recent', path: ROUTES.recent },
        { icon: Activity, label: 'Activity', path: ROUTES.activity },
    ];

    const bottomItems = [
        { icon: Trash2, label: 'Trash', path: ROUTES.trash },
        { icon: Settings, label: 'Settings', path: ROUTES.settings },
    ];

    return (
        <aside
            className={cn(
                'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
                'flex flex-col h-screen',
                'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isCollapsed ? 'w-[80px]' : 'w-[280px]',
                'overflow-hidden z-[40]'
            )}
        >
            {/* Header / Logo */}
            <div className={cn(
                "py-6",
                isCollapsed ? "px-4" : "px-6"
            )}>
                <DropdownMenu className="w-full">
                    <DropdownTrigger className={cn(
                        'flex items-center justify-center font-semibold rounded-xl transition-all duration-200',
                        'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
                        'hover:bg-[var(--color-primary-hover)] active:scale-95',
                        isCollapsed ? 'w-12 h-12' : 'w-full h-12 gap-3'
                    )}>
                        <Plus className="h-6 w-6" />
                        {!isCollapsed && <span>New</span>}
                    </DropdownTrigger>

                    <DropdownContent align="left" className="w-48">
                        <DropdownItem
                            icon={<FolderOpen className="h-4 w-4" />}
                            onClick={triggerNewFolder}
                        >
                            New Folder
                        </DropdownItem>
                        <DropdownItem
                            icon={<Cloud className="h-4 w-4" />}
                            onClick={handleUploadClick}
                        >
                            Upload File
                        </DropdownItem>
                    </DropdownContent>
                </DropdownMenu>

                {/* Hidden Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    aria-label="Upload files"
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden py-2">

                {/* Main Items */}
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === ROUTES.dashboard}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center h-10 rounded-lg transition-all duration-200',
                                isCollapsed ? 'justify-center w-12 mx-auto' : 'px-3',
                                isActive
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                            )
                        }
                        title={isCollapsed ? item.label : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={cn(
                                        'h-5 w-5 shrink-0 transition-colors',
                                        isCollapsed ? '' : 'mr-3',
                                        isActive ? 'text-[var(--color-primary)]' : ''
                                    )}
                                />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Divider */}
                <div className="my-4 mx-3 h-px bg-[var(--color-border-subtle)]" />

                <div className="px-3 pb-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {!isCollapsed ? 'Library' : 'Lib'}
                </div>

                {/* Bottom Items */}
                {bottomItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center h-10 rounded-lg transition-all duration-200',
                                isCollapsed ? 'justify-center w-12 mx-auto' : 'px-3',
                                isActive
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                            )
                        }
                        title={isCollapsed ? item.label : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={cn(
                                        'h-5 w-5 shrink-0 transition-colors',
                                        isCollapsed ? '' : 'mr-3',
                                        isActive ? 'text-[var(--color-primary)]' : ''
                                    )}
                                />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}

            </nav>

            {/* Footer / Storage Info or Collapse Toggle */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
                {!isCollapsed && (
                    <div className="mb-4 px-1">
                        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
                            <span>Storage</span>
                            <span>{isLoading ? '...' : `${percentage.toFixed(0)}%`}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                                // eslint-disable-next-line react-dom/no-unsafe-style-property
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            {isLoading ? 'Calculating...' : `${(usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB of ${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB used`}
                        </p>
                    </div>
                )}

                <button
                    onClick={onToggle}
                    className={cn(
                        "flex items-center justify-center w-full h-8 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors",
                        isCollapsed && "mx-auto w-8"
                    )}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
