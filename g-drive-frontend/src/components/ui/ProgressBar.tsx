 

import { cn } from '@/lib/utils';





interface ProgressBarProps {
     
    value: number;
     
    max?: number;
     
    showPercent?: boolean;
     
    label?: string;
     
    size?: 'sm' | 'md' | 'lg';
     
    variant?: 'default' | 'success' | 'warning' | 'danger';
     
    animated?: boolean;
     
    className?: string;
}





const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

const variantStyles = {
    default: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
};





 
export function ProgressBar({
    value,
    max = 100,
    showPercent = false,
    label,
    size = 'md',
    variant = 'default',
    animated = false,
    className,
}: ProgressBarProps) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const percentText = `${Math.round(percent)}%`;

    return (
        <div className={cn('w-full', className)}>
            { }
            {(label || showPercent) && (
                <div className="flex justify-between items-center mb-1">
                    {label && (
                        <span className="text-sm text-[var(--color-text-secondary)] truncate">
                            {label}
                        </span>
                    )}
                    {showPercent && (
                        <span className="text-sm font-medium text-[var(--color-text)]">
                            {percentText}
                        </span>
                    )}
                </div>
            )}

            { }
            <div
                className={cn(
                    'w-full rounded-full bg-[var(--color-surface-elevated)] overflow-hidden',
                    sizeStyles[size]
                )}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
            >
                { }
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-300 ease-out',
                        variantStyles[variant],
                        animated && 'animate-pulse'
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}





interface IndeterminateProgressProps {
    label?: string;
    className?: string;
}

 
export function IndeterminateProgress({ label, className }: IndeterminateProgressProps) {
    return (
        <div className={cn('w-full', className)}>
            {label && (
                <span className="block text-sm text-[var(--color-text-secondary)] mb-1">
                    {label}
                </span>
            )}
            <div className="w-full h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
                <div
                    className="h-full w-1/3 bg-[var(--color-primary)] rounded-full animate-[slidein_1.5s_ease-in-out_infinite]"
                    style={{
                        animation: 'slideIn 1.5s ease-in-out infinite',
                    }}
                />
            </div>
            <style>{`
        @keyframes slideIn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
        </div>
    );
}

export default ProgressBar;
