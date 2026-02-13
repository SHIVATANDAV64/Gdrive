
import {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    createContext,
    useContext,
    type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';


interface DropdownContextValue {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    close: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error('Dropdown components must be used within DropdownMenu');
    }
    return context;
}


const dropdownVariants = {
    initial: { opacity: 0, y: -4, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4, scale: 0.98 },
};


interface DropdownMenuProps {
    children: ReactNode;
    className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const close = () => setIsOpen(false);

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen, close, triggerRef }}>
            <div className={cn("inline-block", className)}>{children}</div>
        </DropdownContext.Provider>
    );
}


interface DropdownTriggerProps {
    children: ReactNode;
    className?: string;
}

export function DropdownTrigger({ children, className }: DropdownTriggerProps) {
    const { isOpen, setIsOpen, triggerRef } = useDropdown();

    return (
        <button
            ref={triggerRef}
            type="button"
            className={className}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}
            aria-expanded={isOpen ? "true" : "false"}
            aria-haspopup="menu"
        >
            {children}
        </button>
    );
}


interface DropdownContentProps {
    children: ReactNode;
    align?: 'left' | 'right' | 'end' | 'start';
    className?: string;
}

export function DropdownContent({
    children,
    align = 'left',
    className
}: DropdownContentProps) {
    const { isOpen, close, triggerRef } = useDropdown();
    const contentRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useLayoutEffect(() => {
        if (isOpen && triggerRef.current && contentRef.current) {
            const updatePosition = () => {
                if (!triggerRef.current || !contentRef.current) return;

                const rect = triggerRef.current.getBoundingClientRect();
                const height = contentRef.current.offsetHeight;

                const scrollX = window.scrollX;
                const scrollY = window.scrollY;
                const viewportWidth = document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight;

                const spaceBelow = viewportHeight - rect.bottom;
                let top = rect.bottom + scrollY + 4;

                if (spaceBelow < height && rect.top > height) {
                    top = rect.top + scrollY - height - 4;
                }

                let left = rect.left + scrollX;
                let x = '0%';

                if (align === 'right' || align === 'end') {
                    const rightEdge = rect.right;
                    const effectiveRight = Math.min(rightEdge, viewportWidth - 5);
                    left = effectiveRight + scrollX;
                    x = '-100%';
                } else {
                    const estimatedWidth = 160;
                    if (rect.left + estimatedWidth > viewportWidth) {
                        const effectiveRight = Math.min(rect.right, viewportWidth - 5);
                        left = effectiveRight + scrollX;
                        x = '-100%';
                    }
                }

                setStyle({
                    position: 'absolute',
                    top,
                    left,
                    x,
                    minWidth: '160px',
                    zIndex: 9999,
                } as any);
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen, align]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            // Check if click is outside content AND outside trigger
            if (
                contentRef.current &&
                !contentRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target)
            ) {
                close();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
                return;
            }

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const menuItems = contentRef.current?.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]:not([disabled])'
                );
                if (!menuItems?.length) return;

                const currentIndex = Array.from(menuItems).findIndex(
                    (item) => item === document.activeElement
                );

                let nextIndex: number;
                if (e.key === 'ArrowDown') {
                    nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
                }

                menuItems[nextIndex]?.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        requestAnimationFrame(() => {
            const firstItem = contentRef.current?.querySelector<HTMLElement>(
                '[role="menuitem"]:not([disabled])'
            );
            firstItem?.focus();
        });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, close]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={contentRef}
                    style={style}
                    className={cn(
                        'rounded-lg',
                        'bg-[var(--color-surface)] border border-[var(--color-border)]',
                        'shadow-lg py-1.5',
                        'overflow-hidden',
                        className
                    )}
                    role="menu"
                    aria-orientation="vertical"
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}


interface DropdownItemProps {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    destructive?: boolean;
    icon?: ReactNode;
    className?: string;
}

export function DropdownItem({
    children,
    onClick,
    disabled = false,
    destructive = false,
    icon,
    className
}: DropdownItemProps) {
    const { close } = useDropdown();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        onClick?.();
        close();
    };

    return (
        <button
            type="button"
            className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left mx-1 rounded-md block',
                'transition-colors duration-150',
                'max-w-[calc(100%-8px)]',
                disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-[var(--color-surface-hover)]',
                destructive
                    ? 'text-[var(--color-danger)] hover:bg-red-50'
                    : 'text-[var(--color-text)]',
                className
            )}
            onClick={handleClick}
            disabled={disabled}
            role="menuitem"
            tabIndex={-1}
        >
            {icon && <span className={cn("flex-shrink-0 w-4 h-4", destructive ? "text-current" : "text-[var(--color-text-muted)]")}>{icon}</span>}
            <span className="flex-1 truncate font-medium">{children}</span>
        </button>
    );
}


export function DropdownSeparator() {
    return <div className="my-1.5 h-px bg-[var(--color-border-subtle)] mx-1" />;
}


interface DropdownLabelProps {
    children: ReactNode;
}

export function DropdownLabel({ children }: DropdownLabelProps) {
    return (
        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {children}
        </div>
    );
}

export default DropdownMenu;
