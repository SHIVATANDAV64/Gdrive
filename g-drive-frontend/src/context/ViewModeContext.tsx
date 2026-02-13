import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import type { ViewMode } from '@/types';

interface ViewModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.viewMode);
        return (stored === 'list' || stored === 'grid') ? stored : 'grid';
    });

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        localStorage.setItem(STORAGE_KEYS.viewMode, mode);
    };

    return (
        <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (!context) {
        throw new Error('useViewMode must be used within a ViewModeProvider');
    }
    return context;
}
