
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';


export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {

    leftIcon?: ReactNode;

    rightIcon?: ReactNode;

    error?: string;

    label?: string;

    helperText?: string;

    fullWidth?: boolean;

    size?: 'sm' | 'md' | 'lg';
}


const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
};

const baseStyles = `
  block w-full rounded-md
  bg-white text-[var(--color-text)]
  border border-[var(--color-border)]
  placeholder:text-[var(--color-text-muted)]
  transition-all duration-200
  focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10
  hover:border-[var(--color-text-muted)]
  disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-muted)]
`;

const errorStyles = `
  border-[var(--color-danger)]
  focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/10
  hover:border-[var(--color-danger)]
`;


export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            leftIcon,
            rightIcon,
            error,
            label,
            helperText,
            fullWidth = true,
            size = 'md',
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-[var(--color-text)] ml-0.5"
                    >
                        {label}
                    </label>
                )}

                {/* Input Wrapper */}
                <div className="relative flex items-center">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-0 bottom-0 flex items-center justify-center text-[var(--color-text-muted)] pointer-events-none">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input Field */}
                    <input
                        ref={ref}
                        id={inputId}
                        type={type}
                        disabled={disabled}
                        className={cn(
                            baseStyles,
                            sizeStyles[size],
                            leftIcon ? 'pl-9' : '',
                            rightIcon ? 'pr-9' : '',
                            error ? errorStyles : '',
                            className
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />

                    {/* Right Icon */}
                    {rightIcon && (
                        <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-[var(--color-text-muted)]">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {/* Error / Helper Text */}
                <div className="min-h-[20px]">
                    <AnimatePresence mode="wait">
                        {error ? (
                            <motion.div
                                id={`${inputId}-error`}
                                className="flex items-center gap-1.5"
                                role="alert"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <AlertCircle className="w-3.5 h-3.5 text-[var(--color-danger)] shrink-0" />
                                <span className="text-xs font-medium text-[var(--color-danger)]">
                                    {error}
                                </span>
                            </motion.div>
                        ) : helperText ? (
                            <p
                                id={`${inputId}-helper`}
                                className="text-xs text-[var(--color-text-muted)] ml-0.5"
                            >
                                {helperText}
                            </p>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
