 

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Cloud, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { isValidEmail } from '@/lib/utils';





export default function LoginPage() {
    const navigate = useNavigate();
    const { login, loginWithGoogle, isLoggingIn, loginError } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

    const validateField = (name: 'email' | 'password', value: string): string | undefined => {
        if (name === 'email') {
            if (!value) return 'Email is required';
            if (!isValidEmail(value)) return 'Please enter a valid email';
        }
        if (name === 'password') {
            if (!value) return 'Password is required';
        }
        return undefined;
    };

    const handleBlur = (field: 'email' | 'password') => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, field === 'email' ? email : password);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleChange = (field: 'email' | 'password', value: string) => {
        if (field === 'email') setEmail(value);
        if (field === 'password') setPassword(value);

        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const validateForm = (): boolean => {
        const emailError = validateField('email', email);
        const passwordError = validateField('password', password);

        setErrors({ email: emailError, password: passwordError });

        if (emailError) {
            document.getElementById('email-input')?.focus();
            return false;
        }
        if (passwordError) {
            document.getElementById('password-input')?.focus();
            return false;
        }

        return !emailError && !passwordError;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched({ email: true, password: true });

        if (!validateForm()) return;

        try {
            await login({ email, password });
            navigate(ROUTES.dashboard);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[var(--color-background)] to-[var(--color-surface-muted)]">
            { }
            <motion.div
                className="w-full max-w-[440px]" 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                { }
                <div className="flex flex-col items-center mb-[40px]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-blue-500/30">
                            <Cloud className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-[var(--color-text)] tracking-tight font-display">
                            G-Drive
                        </h1>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">
                        Secure cloud storage for everyone
                    </p>
                </div>

                { }
                <div className="bg-white rounded-[24px] p-[48px] shadow-xl shadow-black/5 border border-[var(--color-border-subtle)]">
                    <div className="text-center mb-[32px]">
                        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-[8px]">
                            Welcome back
                        </h2>
                        <p className="text-[var(--color-text-muted)]">
                            Sign in to access your files
                        </p>
                    </div>

                    { }
                    {loginError && (
                        <motion.div
                            className="mb-[24px] p-[16px] rounded-xl bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20"
                            role="alert"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <p className="text-sm text-[var(--color-danger)] text-center font-medium">
                                {loginError.message ?? 'Invalid email or password'}
                            </p>
                        </motion.div>
                    )}

                    { }
                    <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]" noValidate>
                        <Input
                            id="email-input"
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            error={touched.email ? errors.email : undefined}
                            autoComplete="email"
                        />

                        <div className="flex flex-col gap-[24px]">
                            <Input
                                id="password-input"
                                type={showPassword ? 'text' : 'password'}
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                onBlur={() => handleBlur('password')}
                                error={touched.password ? errors.password : undefined}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
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
                                autoComplete="current-password"
                            />
                            <div className="flex justify-end -mt-2">
                                <Link
                                    to={ROUTES.forgotPassword}
                                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isLoggingIn}
                            rightIcon={!isLoggingIn && <ArrowRight className="h-5 w-5" />}
                            className="mt-[8px]" 
                        >
                            Sign in
                        </Button>
                    </form>

                    { }
                    <div className="relative my-[32px]">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--color-border)]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 text-sm text-[var(--color-text-muted)] bg-white">
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
                        className="gap-[12px]" 
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
                    <p className="mt-[32px] text-center text-[var(--color-text-secondary)]">
                        Don't have an account?{' '}
                        <Link
                            to={ROUTES.signup}
                            className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-primary-hover)] transition-colors"
                        >
                            Create account
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-[24px] text-center text-xs text-[var(--color-text-muted)]">
                    By signing in, you agree to our{' '}
                    <a href="#" className="underline hover:text-[var(--color-text)]">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="underline hover:text-[var(--color-text)]">
                        Privacy Policy
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
