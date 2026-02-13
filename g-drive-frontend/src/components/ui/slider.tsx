 

import { useCallback, useRef, useState, useEffect, type MouseEvent, type TouchEvent } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
    value: number[];
    max: number;
    step?: number;
    onValueChange: (value: number[]) => void;
    className?: string;
    disabled?: boolean;
     
    ariaLabel?: string;
}

export function Slider({
    value,
    max,
    step = 1,
    onValueChange,
    className,
    disabled = false,
    ariaLabel = 'Slider',
}: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const currentValue = value[0] ?? 0;
    const percentage = max > 0 ? (currentValue / max) * 100 : 0;

    const updateValue = useCallback(
        (clientX: number) => {
            if (!trackRef.current || disabled) return;

            const rect = trackRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            let newValue = (percent / 100) * max;

            
            newValue = Math.round(newValue / step) * step;
            newValue = Math.max(0, Math.min(max, newValue));

            onValueChange([newValue]);
        },
        [max, step, onValueChange, disabled]
    );

    const handleMouseDown = useCallback(
        (e: MouseEvent) => {
            if (disabled) return;
            setIsDragging(true);
            updateValue(e.clientX);
        },
        [updateValue, disabled]
    );

    const handleMouseMove = useCallback(
        (e: globalThis.MouseEvent) => {
            if (isDragging) {
                updateValue(e.clientX);
            }
        },
        [isDragging, updateValue]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback(
        (e: TouchEvent) => {
            if (disabled) return;
            setIsDragging(true);
            updateValue(e.touches[0].clientX);
        },
        [updateValue, disabled]
    );

    const handleTouchMove = useCallback(
        (e: globalThis.TouchEvent) => {
            if (isDragging) {
                updateValue(e.touches[0].clientX);
            }
        },
        [isDragging, updateValue]
    );

    
    useEffect(() => {
        if (!isDragging) return;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    return (
        <div
            ref={trackRef}
            className={cn(
                'relative h-2 w-full rounded-full bg-[var(--color-surface-elevated)] cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={currentValue}
            tabIndex={disabled ? -1 : 0}
        >
            { }
            <div
                className="absolute h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-75"
                style={{ width: `${percentage}%` }}
            />

            { }
            <div
                className={cn(
                    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--color-primary)] shadow-md border-2 border-white transition-transform',
                    isDragging ? 'scale-125' : 'hover:scale-110'
                )}
                style={{ left: `${percentage}%` }}
            />
        </div>
    );
}

export default Slider;
