 

import { useEffect, useCallback } from 'react';





interface ShortcutHandlers {
     
    onNewFolder?: () => void;
     
    onUpload?: () => void;
     
    onSearch?: () => void;
     
    onDelete?: () => void;
     
    onSelectAll?: () => void;
     
    onDeselect?: () => void;
     
    onCopy?: () => void;
     
    onPaste?: () => void;
     
    onRename?: () => void;
     
    onDownload?: () => void;
     
    onStar?: () => void;
     
    onOpen?: () => void;
     
    onNavigateUp?: () => void;
     
    onGridView?: () => void;
     
    onListView?: () => void;
}

interface UseKeyboardShortcutsOptions {
     
    enabled?: boolean;
     
    handlers: ShortcutHandlers;
}





 
function isInputElement(element: Element | null): boolean {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.getAttribute('contenteditable') === 'true';
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable;
}

 
function isCtrlOrCmd(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.metaKey;
}





 
export function useKeyboardShortcuts({
    enabled = true,
    handlers,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        
        if (!enabled) return;

        
        const isInput = isInputElement(document.activeElement);
        const ctrlOrCmd = isCtrlOrCmd(e);

        
        switch (e.key) {
            
            case 'Escape':
                handlers.onDeselect?.();
                break;

            
            case '/':
                if (!isInput) {
                    e.preventDefault();
                    handlers.onSearch?.();
                }
                break;
            case 'k':
            case 'K':
                if (ctrlOrCmd) {
                    e.preventDefault();
                    handlers.onSearch?.();
                }
                break;

            
            case 'n':
            case 'N':
                if (ctrlOrCmd && e.shiftKey && !isInput) {
                    e.preventDefault();
                    handlers.onNewFolder?.();
                }
                break;

            
            case 'u':
            case 'U':
                if (ctrlOrCmd && !isInput) {
                    e.preventDefault();
                    handlers.onUpload?.();
                }
                break;

            
            case 'Delete':
                if (!isInput) {
                    handlers.onDelete?.();
                }
                break;
            case 'Backspace':
                if (!isInput) {
                    
                    if (e.altKey) {
                        handlers.onNavigateUp?.();
                    } else {
                        handlers.onDelete?.();
                    }
                }
                break;

            
            case 'a':
            case 'A':
                if (ctrlOrCmd && !isInput) {
                    e.preventDefault();
                    handlers.onSelectAll?.();
                }
                break;

            
            case 'c':
            case 'C':
                if (ctrlOrCmd && !isInput) {
                    
                    handlers.onCopy?.();
                }
                break;

            
            case 'v':
            case 'V':
                if (ctrlOrCmd && !isInput) {
                    handlers.onPaste?.();
                }
                break;

            
            case 'd':
            case 'D':
                if (ctrlOrCmd && !isInput) {
                    e.preventDefault(); 
                    handlers.onDownload?.();
                }
                break;

            
            case 's':
            case 'S':
                if (ctrlOrCmd && !isInput) {
                    e.preventDefault();
                    handlers.onStar?.();
                }
                break;

            
            case 'F2':
                if (!isInput) {
                    e.preventDefault();
                    handlers.onRename?.();
                }
                break;

            
            case 'Enter':
                if (!isInput) {
                    handlers.onOpen?.();
                }
                break;

            
            case '1':
                if (ctrlOrCmd && !isInput) {
                    e.preventDefault();
                    handlers.onGridView?.();
                }
                break;
            case '2':
                if (ctrlOrCmd && !isInput) {
                    e.preventDefault();
                    handlers.onListView?.();
                }
                break;
        }
    }, [enabled, handlers]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}





 
export const KEYBOARD_SHORTCUTS = [
    { keys: ['Ctrl', 'Shift', 'N'], action: 'New folder', mac: ['⌘', '⇧', 'N'] },
    { keys: ['Ctrl', 'U'], action: 'Upload files', mac: ['⌘', 'U'] },
    { keys: ['/', 'or Ctrl+K'], action: 'Search', mac: ['/', 'or ⌘K'] },
    { keys: ['Delete'], action: 'Delete selected', mac: ['Delete'] },
    { keys: ['Ctrl', 'A'], action: 'Select all', mac: ['⌘', 'A'] },
    { keys: ['Escape'], action: 'Deselect all', mac: ['Escape'] },
    { keys: ['F2'], action: 'Rename', mac: ['F2'] },
    { keys: ['Enter'], action: 'Open/Preview', mac: ['Enter'] },
    { keys: ['Ctrl', 'D'], action: 'Download', mac: ['⌘', 'D'] },
    { keys: ['Ctrl', 'S'], action: 'Star/Unstar', mac: ['⌘', 'S'] },
    { keys: ['Ctrl', '1'], action: 'Grid view', mac: ['⌘', '1'] },
    { keys: ['Ctrl', '2'], action: 'List view', mac: ['⌘', '2'] },
] as const;

export default useKeyboardShortcuts;
