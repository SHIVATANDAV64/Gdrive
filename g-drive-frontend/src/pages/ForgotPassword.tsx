 

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Check, ArrowLeft, Send, Mail } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { isValidEmail } from '@/lib/utils';





export default function ForgotPasswordPage() {
    const { requestPasswordReset } = useAuth();

    
    
    
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    
    
    

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        
        if (!email) {
            setError('Email is required');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            await requestPasswordReset(email);
            setSuccess(true);
        } catch (error) {
            
            
            if (error instanceof Error && error.message.includes('rate limit')) {
                setError('Too many requests. Please try again later.');
            } else {
                
                setSuccess(true);
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
                            Check your email
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-base mb-8">
                            If an account exists for{' '}
                            <span className="font-medium text-[var(--color-text)]">{email}</span>,
                            you'll receive a password reset link shortly.
                        </p>

                        <div className="space-y-4">
                            <Button
                                variant="secondary"
                                fullWidth
                                size="lg"
                                className="rounded-xl font-medium"
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                }}
                            >
                                Send another link
                            </Button>
                            <Link
                                to={ROUTES.login}
                                className="flex items-center justify-center gap-2 text-base text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-hover)] transition-colors py-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // Render - Form State
    // ========================================

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
                </div>

                { }
                <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="h-14 w-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-5">
                            <Mail className="h-7 w-7 text-[var(--color-primary)]" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] mb-2">
                            Forgot password?
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-base">
                            No worries, we'll send you reset instructions.
                        </p>
                    </div>

                    { }
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={error ?? undefined}
                            autoComplete="email"
                            autoFocus
                        />

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isSubmitting}
                            rightIcon={!isSubmitting && <Send className="h-5 w-5" />}
                            className="rounded-xl font-semibold text-base shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-xl hover:shadow-[var(--color-primary)]/40"
                        >
                            Send reset link
                        </Button>
                    </form>

                    { }
                    <Link
                        to={ROUTES.login}
                        className="flex items-center justify-center gap-2 mt-8 text-base text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text)] transition-colors py-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
