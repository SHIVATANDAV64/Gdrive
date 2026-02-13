import React, { useState, useRef, useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delayMs?: number;
}

interface TooltipProviderProps {
    children: ReactNode;
}

interface TooltipTriggerProps {
    children: ReactNode;
    asChild?: boolean;
}

interface TooltipContentProps {
    children: ReactNode;
}


export function TooltipProvider({ children }: TooltipProviderProps) {
    return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [actualSide, setActualSide] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
        timeoutRef.current = window.setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;

                
                let side: 'top' | 'bottom' | 'left' | 'right' = 'top';
                let top = 0;
                let left = 0;

                
                if (rect.top > 100) {
                    top = rect.top - 8;
                    side = 'top';
                } else if (viewportHeight - rect.bottom > 100) {
                    top = rect.bottom + 8;
                    side = 'bottom';
                } else {
                    
                    top = rect.bottom + 8;
                    side = 'bottom';
                }

                
                left = rect.left + rect.width / 2;
                
                setPosition({ top, left });
                setActualSide(side);
            }
            setIsOpen(true);
        }, 200);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    
    const childArray = React.Children.toArray(children);
    const trigger = childArray.find((child) => React.isValidElement(child) && child.type === TooltipTrigger) as React.ReactElement | undefined;
    const content = childArray.find((child) => React.isValidElement(child) && child.type === TooltipContent) as React.ReactElement | undefined;

    return (
        <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
        >
            {trigger}
            {isOpen && content && createPortal(
                <div
                    ref={contentRef}
                    className="fixed z-[var(--z-tooltip)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] px-3 py-2 text-sm rounded-md shadow-lg border border-[var(--color-border)] animate-in fade-in-0 zoom-in-95 max-w-xs pointer-events-none"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: `translateX(-50%) translateY(${actualSide === 'top' ? '-100%' : '0'})`,
                    }}
                >
                    { }
                    {React.isValidElement(content) ? (content.props as any).children : null}
                </div>,
                document.body
            )}
        </div>
    );
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
    if (asChild) {
        return <>{children}</>;
    }
    return <span>{children}</span>;
}

export function TooltipContent({ children }: TooltipContentProps) {
    return <>{children}</>;
}


export function SimpleTooltip({ children, content, side = 'bottom', delayMs = 200 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);
    const tooltipId = useId();

    const showTooltip = () => {
        timeoutRef.current = window.setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                let top = 0, left = 0;

                switch (side) {
                    case 'top':
                        top = rect.top - 8;
                        left = rect.left + rect.width / 2;
                        break;
                    case 'bottom':
                        top = rect.bottom + 8;
                        left = rect.left + rect.width / 2;
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2;
                        left = rect.left - 8;
                        break;
                    case 'right':
                        top = rect.top + rect.height / 2;
                        left = rect.right + 8;
                        break;
                }

                setPosition({ top, left });
            }
            setIsVisible(true);
        }, delayMs);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className="inline-block"
                aria-describedby={isVisible ? tooltipId : undefined}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    id={tooltipId}
                    role="tooltip"
                    className="fixed z-[var(--z-tooltip)] bg-popover text-popover-foreground px-3 py-2 text-sm rounded-md shadow-md border animate-in fade-in-0 zoom-in-95"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: side === 'top' || side === 'bottom'
                            ? 'translateX(-50%)'
                            : 'translateY(-50%)',
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
}
