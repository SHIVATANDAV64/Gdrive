
import {
    useEffect,
    useRef,
    type ReactNode,
    type MouseEvent
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';


export interface ModalProps {

    isOpen: boolean;

    onClose: () => void;

    title?: string;

    ariaLabel?: string;

    description?: string;

    children: ReactNode;

    footer?: ReactNode;

    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

    closeOnOverlayClick?: boolean;

    showCloseButton?: boolean;
}


const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
};

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])';


const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const contentVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 10 },
};


export function Modal({
    isOpen,
    onClose,
    title,
    ariaLabel,
    description,
    children,
    footer,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
}: ModalProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);


    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);


    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            setTimeout(() => contentRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';

            const handleTabKey = (e: globalThis.KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                const modal = contentRef.current;
                if (!modal) return;

                const focusableElements = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            };

            document.addEventListener('keydown', handleTabKey);
            return () => document.removeEventListener('keydown', handleTabKey);
        } else {
            previousActiveElement.current?.focus();
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleOverlayClick = (e: MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={handleOverlayClick}
                    role="presentation"
                    variants={overlayVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Content */}
                    <motion.div
                        ref={contentRef}
                        className={cn(
                            'relative w-full',
                            'bg-white rounded-2xl',
                            'shadow-2xl ring-1 ring-black/5',
                            'max-h-[85vh] flex flex-col',
                            'overflow-hidden',
                            sizeStyles[size]
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? 'modal-title' : undefined}
                        aria-label={!title ? ariaLabel : undefined}
                        aria-describedby={description ? 'modal-description' : undefined}
                        tabIndex={-1}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-start justify-between px-8 pt-8 pb-6">
                                <div className="flex-1 min-w-0 pr-4">
                                    {title && (
                                        <h2
                                            id="modal-title"
                                            className="text-xl font-semibold text-[var(--color-text)] tracking-tight"
                                        >
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p
                                            id="modal-description"
                                            className="mt-1.5 text-sm text-[var(--color-text-secondary)]"
                                        >
                                            {description}
                                        </p>
                                    )}
                                </div>

                                {showCloseButton && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        aria-label="Close modal"
                                        className="shrink-0 -mt-1 -mr-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Body - Increased padding to p-8 */}
                        <div className="px-8 py-4 overflow-y-auto flex-1 min-h-0">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="px-8 py-5 border-t border-[var(--color-border-subtle)] flex justify-end gap-3 bg-[var(--color-surface-muted)]/50 mt-4">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default Modal;
