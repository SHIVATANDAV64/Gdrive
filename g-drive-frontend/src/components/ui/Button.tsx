
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';


export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDragStart' | 'onDragEnd' | 'onDrag'> {

    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';

    size?: 'sm' | 'md' | 'lg' | 'icon';

    isLoading?: boolean;

    leftIcon?: ReactNode;

    rightIcon?: ReactNode;

    fullWidth?: boolean;
}


const baseStyles = `
  inline-flex items-center justify-center
  font-medium cursor-pointer
  transition-all duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  whitespace-nowrap
`;

const variantStyles = {
    primary: `
    bg-[var(--color-primary)] text-white
    hover:bg-[var(--color-primary-hover)]
    focus-visible:ring-[var(--color-primary)]
    shadow-sm hover:shadow
  `,
    secondary: `
    bg-white text-[var(--color-text)]
    border border-[var(--color-border)]
    hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-subtle)]
    focus-visible:ring-[var(--color-text-muted)]
    shadow-sm
  `,
    ghost: `
    bg-transparent text-[var(--color-text-secondary)]
    hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]
    focus-visible:ring-[var(--color-text-muted)]
  `,
    danger: `
    bg-[var(--color-danger)] text-white
    hover:bg-red-600 hover:shadow
    focus-visible:ring-[var(--color-danger)]
    shadow-sm
  `,
    outline: `
    bg-transparent text-[var(--color-primary)]
    border border-[var(--color-primary)]
    hover:bg-blue-50
    focus-visible:ring-[var(--color-primary)]
  `,
    accent: `
    bg-[var(--color-accent)] text-white
    hover:bg-[var(--color-accent-alt)]
    focus-visible:ring-[var(--color-accent)]
    shadow-sm
  `,
};


const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-10 px-4 text-sm gap-2 rounded-md',
    lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
    icon: 'h-9 w-9 rounded-md p-0',
};


const buttonAnimations = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
};


const LoadingSpinner = () => (
    <motion.svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </motion.svg>
);


export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            type = 'button',
            onClick,
            ...props
        },
        ref
    ) => {
        const isDisabled = isLoading || disabled;

        return (
            <motion.button
                ref={ref}
                type={type}
                className={cn(
                    baseStyles,
                    variantStyles[variant],
                    sizeStyles[size],
                    fullWidth && 'w-full',
                    isLoading && 'pointer-events-none',
                    className
                )}
                disabled={isDisabled}
                onClick={onClick}
                variants={buttonAnimations}
                initial="initial"
                whileHover={!isDisabled ? "hover" : undefined}
                whileTap={!isDisabled ? "tap" : undefined}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                {...(props as object)}
            >
                {/* Loading State or Left Icon */}
                <span className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.span
                                key="loading"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                <LoadingSpinner />
                            </motion.span>
                        ) : leftIcon ? (
                            <span className="shrink-0">{leftIcon}</span>
                        ) : null}
                    </AnimatePresence>

                    {/* Content */}
                    {children && <span>{children}</span>}

                    {/* Right Icon */}
                    {!isLoading && rightIcon && (
                        <span className="shrink-0">{rightIcon}</span>
                    )}
                </span>
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
