 

import { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Cloud, ArrowRight, Check, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { isValidEmail, isValidPassword, cn } from '@/lib/utils';





interface PasswordStrength {
    score: number; 
    label: string;
    color: string;
    requirements: {
        minLength: boolean;
        hasLetter: boolean;
        hasNumber: boolean;
        hasSpecial: boolean;
    };
}

function getPasswordStrength(password: string): PasswordStrength {
    const requirements = {
        minLength: password.length >= 8,
        hasLetter: /[a-zA-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedCount = Object.values(requirements).filter(Boolean).length;
    
    let score = 0;
    let label = 'Very weak';
    let color = 'var(--color-danger)';

    if (passedCount === 4 && password.length >= 12) {
        score = 4;
        label = 'Strong';
        color = 'var(--color-success)';
    } else if (passedCount >= 3) {
        score = 3;
        label = 'Good';
        color = '#22c55e';
    } else if (passedCount >= 2) {
        score = 2;
        label = 'Fair';
        color = '#f59e0b';
    } else if (passedCount >= 1) {
        score = 1;
        label = 'Weak';
        color = '#ef4444';
    }

    return { score, label, color, requirements };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
    const strength = useMemo(() => getPasswordStrength(password), [password]);

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2" role="status" aria-live="polite">
            { }
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="h-1 flex-1 rounded-full transition-colors duration-200"
                        style={{
                            backgroundColor: index < strength.score
                                ? strength.color
                                : 'var(--color-border)',
                        }}
                    />
                ))}
            </div>
            
            {/* Strength label */}
            <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                </span>
            </div>

            {/* Requirements checklist */}
            <ul className="space-y-1 text-xs">
                <li className={cn(
                    "flex items-center gap-1.5",
                    strength.requirements.minLength ? "text-green-500" : "text-[var(--color-text-muted)]"
                )}>
                    {strength.requirements.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    At least 8 characters
                </li>
                <li className={cn(
                    "flex items-center gap-1.5",
                    strength.requirements.hasLetter ? "text-green-500" : "text-[var(--color-text-muted)]"
                )}>
                    {strength.requirements.hasLetter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Contains a letter
                </li>
                <li className={cn(
                    "flex items-center gap-1.5",
                    strength.requirements.hasNumber ? "text-green-500" : "text-[var(--color-text-muted)]"
                )}>
                    {strength.requirements.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Contains a number
                </li>
                <li className={cn(
                    "flex items-center gap-1.5",
                    strength.requirements.hasSpecial ? "text-green-500" : "text-[var(--color-text-muted)]"
                )}>
                    {strength.requirements.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Contains a special character
                </li>
            </ul>
        </div>
    );
}

// ============================================================
// Component
// ============================================================

export default function SignupPage() {
    const navigate = useNavigate();
    const { signup, loginWithGoogle, isSigningUp, signupError } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (!isValidPassword(password)) {
            newErrors.password = 'Password must be at least 8 characters with a letter and number';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await signup({ email, password, name: name.trim() });
            navigate(ROUTES.dashboard);
        } catch (error) {
            console.error('Signup failed:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Background gradient */}
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
                    <p className="text-[var(--color-text-secondary)] text-sm">
                        Secure cloud storage for everyone
                    </p>
                </div>

                {/* Card */}
                <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] mb-2">
                            Create your account
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-base">
                            Get started with free cloud storage
                        </p>
                    </div>

                    { }
                    {signupError && (
                        <div className="mb-6 p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30">
                            <p className="text-sm text-[var(--color-danger)] text-center">
                                {signupError.message ?? 'Failed to create account'}
                            </p>
                        </div>
                    )}

                    { }
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            type="text"
                            label="Full name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            error={errors.name}
                            autoComplete="name"
                        />

                        <Input
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                            autoComplete="email"
                        />

                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
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
                            aria-describedby="password-strength"
                        />
                        <div id="password-strength">
                            <PasswordStrengthIndicator password={password} />
                        </div>

                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Confirm password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={errors.confirmPassword}
                            autoComplete="new-password"
                        />

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isSigningUp}
                            rightIcon={!isSigningUp && <ArrowRight className="h-5 w-5" />}
                            className="mt-6 rounded-xl font-semibold text-base shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-xl hover:shadow-[var(--color-primary)]/40"
                        >
                            Create account
                        </Button>
                    </form>

                    { }
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--color-border)]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 text-sm text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-full">
                                or continue with
                            </span>
                        </div>
                    </div>

                    { }
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        size="lg"
                        onClick={loginWithGoogle}
                        className="rounded-xl font-medium text-base"
                        leftIcon={
                            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        }
                    >
                        Continue with Google
                    </Button>

                    { }
                    <p className="mt-8 text-center text-base text-[var(--color-text-secondary)]">
                        Already have an account?{' '}
                        <Link
                            to={ROUTES.login}
                            className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-primary-hover)] transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="underline hover:text-[var(--color-text-secondary)]">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="underline hover:text-[var(--color-text-secondary)]">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}
