
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FilterChip {
    id: string;
    label: string;
    active?: boolean;
    onRemove?: () => void;
}

interface FilterChipsProps {
    chips: FilterChip[];
    onSelect: (id: string) => void;
    className?: string;
}

export function FilterChips({ chips, onSelect, className }: FilterChipsProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {chips.map(chip => (
                <button
                    key={chip.id}
                    onClick={() => !chip.active && onSelect(chip.id)}
                    className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                        chip.active
                            ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                    )}
                >
                    {chip.label}
                    {chip.active && chip.onRemove && (
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove ${chip.label}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                chip.onRemove?.();
                            }}
                            className="ml-2 p-0.5 rounded-full hover:bg-[var(--color-primary)]/10"
                        >
                            <X className="h-3 w-3" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
