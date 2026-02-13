
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, Bell, User, LogOut, Settings } from 'lucide-react';
import { debounce, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import type { ViewMode } from '@/types';


import { useViewMode } from '@/context/ViewModeContext';

interface HeaderProps {
    onSearch: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
    const { viewMode, setViewMode } = useViewMode();
    const navigate = useNavigate();
    const { user, logout, isLoggingOut } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        debouncedSearchRef.current = debounce((query: string) => onSearch(query), 300);
        return () => {
            if (debouncedSearchRef.current && typeof debouncedSearchRef.current === 'function' && 'cancel' in debouncedSearchRef.current) {
                (debouncedSearchRef.current as unknown as { cancel: () => void }).cancel();
            }
        };
    }, [onSearch]);

    useEffect(() => {
        if (!isUserMenuOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserMenuOpen]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearchRef.current?.(query);
    };

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 sm:px-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
            {/* Search Bar - Centered/Left aligned */}
            <div className="flex-1 max-w-2xl">
                <div className={cn(
                    'relative flex items-center h-10',
                    'bg-[var(--color-border-subtle)] rounded-lg',
                    'border border-transparent transition-all duration-200',
                    isSearchFocused
                        ? 'border-[var(--color-primary)] ring-2 ring-blue-500/10 bg-[var(--color-surface)]'
                        : 'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border)]'
                )}>
                    <Search className={cn(
                        "absolute left-3 h-4 w-4 pointer-events-none transition-colors",
                        isSearchFocused ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                    )} />
                    <input
                        type="search"
                        placeholder="Search files, folders..."
                        aria-label="Search in Drive"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className={cn(
                            'w-full h-full pl-10 pr-4',
                            'bg-transparent text-[var(--color-text)]',
                            'placeholder:text-[var(--color-text-muted)]',
                            'rounded-lg border-none outline-none',
                            'text-sm font-medium'
                        )}
                    />
                    {/* Optional: Add "Cmd+K" visual indicator here later */}
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 ml-4">
                {/* View Mode Toggle */}
                <div
                    className="flex items-center bg-[var(--color-surface-hover)] p-1 rounded-lg border border-[var(--color-border)]"
                    role="group"
                    aria-label="View mode"
                >
                    <button
                        onClick={() => setViewMode('grid')}
                        aria-label="Grid view"
                        aria-pressed={viewMode === 'grid'}
                        className={cn(
                            'flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200',
                            viewMode === 'grid'
                                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        )}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        aria-label="List view"
                        aria-pressed={viewMode === 'list'}
                        className={cn(
                            'flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200',
                            viewMode === 'list'
                                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        )}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    className="text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                >
                    <Bell className="h-5 w-5" />
                </Button>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <motion.button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        aria-label="User menu"
                        aria-expanded={isUserMenuOpen ? "true" : "false"}
                        aria-haspopup="true"
                        className={cn(
                            'flex items-center justify-center',
                            'ring-2 ring-transparent rounded-full',
                            'hover:ring-[var(--color-border)] transition-all'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {user?.name ? (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-blue-500/20">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center border border-[var(--color-border)]">
                                <User className="h-5 w-5 text-[var(--color-text-muted)]" />
                            </div>
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <motion.div
                                className="absolute right-0 top-full mt-2 w-64 z-[100] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden"
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]">
                                    <p className="font-semibold text-[var(--color-text)]">
                                        {user?.name ?? 'User'}
                                    </p>
                                    <p className="text-sm text-[var(--color-text-muted)] truncate">
                                        {user?.email ?? ''}
                                    </p>
                                </div>

                                <div className="py-2">
                                    <button
                                        className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                                        onClick={() => {
                                            navigate(ROUTES.settings);
                                            setIsUserMenuOpen(false);
                                        }}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </button>
                                    <button
                                        className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-[var(--color-danger)] hover:bg-red-50 hover:text-red-700 transition-colors"
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {isLoggingOut ? 'Logging out…' : 'Log out'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}

export default Header;
