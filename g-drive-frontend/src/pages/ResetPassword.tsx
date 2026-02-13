 

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Cloud, Check, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';





export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { resetPassword } = useAuth();

    
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    
    
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    
    
    

    const validateForm = (): boolean => {
        const newErrors: { password?: string; confirmPassword?: string } = {};

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    
    
    

    useEffect(() => {
        if (!userId || !secret) {
            setError('Invalid or missing reset link. Please request a new password reset.');
        }
    }, [userId, secret]);

    
    
    

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!userId || !secret) {
            setError('Invalid reset link');
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            await resetPassword({ userId, secret, password });
            setSuccess(true);
        } catch (error) {
            if (error instanceof Error) {
                
                if (error.message.includes('expired')) {
                    setError('This reset link has expired. Please request a new password reset.');
                } else if (error.message.includes('invalid')) {
                    setError('Invalid reset link. Please request a new password reset.');
                } else {
                    setError(error.message);
                }
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    
    
    

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
                { }
                <div className="auth-background" aria-hidden="true" />

                { }
                <div className="w-full max-w-[420px] page-scale">
                    { }
                    <div className="flex flex-col items-center mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3.5 rounded-2xl bg-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/30">
                                <Cloud className="h-8 w-8 text-[var(--color-primary-foreground)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] tracking-tight">
                                G-Drive
                            </h1>
                        </div>
                    </div>

                    { }
                    <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
                        <div className="h-16 w-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-6">
                            <Check className="h-8 w-8 text-[var(--color-success)]" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] mb-3">
                            Password Reset Successful
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-base mb-8">
                            Your password has been changed. You can now sign in with your new password.
                        </p>
                        <Button
                            fullWidth
                            size="lg"
                            onClick={() => navigate(ROUTES.login)}
                            rightIcon={<ArrowRight className="h-5 w-5" />}
                            className="rounded-xl font-semibold text-base shadow-lg shadow-[var(--color-primary)]/30"
                        >
                            Sign in
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    
    
    

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
            { }
            <div className="auth-background" aria-hidden="true" />

            { }
            <div className="w-full max-w-[420px] page-scale">
                { }
                <div className="flex flex-col items-center mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3.5 rounded-2xl bg-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/30">
                            <Cloud className="h-8 w-8 text-[var(--color-primary-foreground)]" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] tracking-tight">
                            G-Drive
                        </h1>
                    </div>
                </div>

                { }
                <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="h-14 w-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-5">
                            <KeyRound className="h-7 w-7 text-[var(--color-primary)]" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] mb-2">
                            Reset Password
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-base">
                            Enter your new password below
                        </p>
                    </div>

                    { }
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30">
                            <p className="text-sm text-[var(--color-danger)] flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </p>
                        </div>
                    )}

                    { }
                    {userId && secret ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                label="New Password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={errors.password}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                }
                                autoComplete="new-password"
                            />

                            <Input
                                type={showPassword ? 'text' : 'password'}
                                label="Confirm New Password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={errors.confirmPassword}
                                autoComplete="new-password"
                            />

                            <p className="text-sm text-[var(--color-text-muted)]">
                                Password must be at least 8 characters long
                            </p>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={isSubmitting}
                                rightIcon={!isSubmitting && <ArrowRight className="h-5 w-5" />}
                                className="rounded-xl font-semibold text-base shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-xl hover:shadow-[var(--color-primary)]/40"
                            >
                                Reset Password
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center">
                            <Link
                                to={ROUTES.forgotPassword}
                                className="text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-hover)] transition-colors"
                            >
                                Request a new password reset
                            </Link>
                        </div>
                    )}

                    { }
                    <p className="mt-8 text-center text-base text-[var(--color-text-secondary)]">
                        Remember your password?{' '}
                        <Link
                            to={ROUTES.login}
                            className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-primary-hover)] transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
