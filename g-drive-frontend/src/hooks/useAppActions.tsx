 

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';





interface AppActionsContextValue {
    
    uploadTrigger: number;
    newFolderTrigger: number;
    
    triggerUpload: () => void;
    triggerNewFolder: () => void;
    
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}





const AppActionsContext = createContext<AppActionsContextValue | null>(null);





interface AppActionsProviderProps {
    children: ReactNode;
}

export function AppActionsProvider({ children }: AppActionsProviderProps) {
    
    const [uploadTrigger, setUploadTrigger] = useState(0);
    const [newFolderTrigger, setNewFolderTrigger] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const triggerUpload = useCallback(() => {
        setUploadTrigger((prev) => prev + 1);
    }, []);

    const triggerNewFolder = useCallback(() => {
        setNewFolderTrigger((prev) => prev + 1);
    }, []);

    return (
        <AppActionsContext.Provider
            value={{
                uploadTrigger,
                newFolderTrigger,
                triggerUpload,
                triggerNewFolder,
                searchQuery,
                setSearchQuery,
            }}
        >
            {children}
        </AppActionsContext.Provider>
    );
}





export function useAppActions(): AppActionsContextValue {
    const context = useContext(AppActionsContext);
    if (!context) {
        throw new Error('useAppActions must be used within AppActionsProvider');
    }
    return context;
}
