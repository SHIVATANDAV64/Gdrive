 

import {
    useEffect,
    useRef,
    type ReactNode,
    type MouseEvent as ReactMouseEvent
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';





interface Position {
    x: number;
    y: number;
}

interface ContextMenuProps {
    isOpen: boolean;
    position: Position;
    onClose: () => void;
    children: ReactNode;
}

interface ContextMenuItemProps {
    children: ReactNode;
    icon?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    destructive?: boolean;
}





export function ContextMenu({ isOpen, position, onClose, children }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        document.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, onClose]);

    
    useEffect(() => {
        if (!isOpen || !menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = position.x;
        let adjustedY = position.y;

        if (adjustedX + rect.width > viewportWidth) {
            adjustedX = viewportWidth - rect.width - 8;
        }

        if (adjustedY + rect.height > viewportHeight) {
            adjustedY = viewportHeight - rect.height - 8;
        }

        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
    }, [isOpen, position]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={menuRef}
            className={cn(
                'fixed z-[100] min-w-[180px] rounded-lg',
                'bg-[var(--color-surface)] border border-[var(--color-border)]',
                'shadow-lg py-1',
                'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
            style={{ left: position.x, top: position.y }}
            role="menu"
            aria-orientation="vertical"
        >
            {children}
        </div>,
        document.body
    );
}





export function ContextMenuItem({
    children,
    icon,
    onClick,
    disabled = false,
    destructive = false,
}: ContextMenuItemProps) {
    const handleClick = (e: ReactMouseEvent) => {
        e.stopPropagation();
        if (!disabled && onClick) {
            onClick();
        }
    };

    return (
        <button
            className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm text-left',
                'transition-colors duration-150',
                disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[var(--color-surface-elevated)]',
                destructive
                    ? 'text-[var(--color-danger)]'
                    : 'text-[var(--color-text)]'
            )}
            onClick={handleClick}
            disabled={disabled}
            role="menuitem"
        >
            {icon && <span className="flex-shrink-0 w-4">{icon}</span>}
            {children}
        </button>
    );
}





export function ContextMenuSeparator() {
    return <div className="my-1 h-px bg-[var(--color-border)]" />;
}

export default ContextMenu;

