import { useParams, Link } from 'react-router-dom';
import { Cloud, Loader2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button, Input } from '@/components/ui';
import { resolveLinkShare } from '@/services/share.service';
import { SharedResourceView } from '@/components/features/SharedResourceView';
import type { ResolvedLinkShare } from '@/types';

const TOKEN_REGEX = /^[a-zA-Z0-9]{10,100}$/;

function isValidToken(token: string | undefined): boolean {
    return !!token && TOKEN_REGEX.test(token);
}

export default function PublicLinkPage() {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [linkData, setLinkData] = useState<ResolvedLinkShare | null>(null);

    const isTokenValid = useMemo(() => isValidToken(token), [token]);

    useEffect(() => {
        if (!isTokenValid) {
            setError('Invalid link format');
            setIsLoading(false);
            return;
        }

        async function fetchLinkData() {
            try {
                const result = await resolveLinkShare(token!);
                if (result.link) {
                    setLinkData(result);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load link';
                if (message.toLowerCase().includes('password')) {
                    setNeedsPassword(true);
                } else {
                    setError(message);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchLinkData();
    }, [token, isTokenValid]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await resolveLinkShare(token!, password);
            if (result.link) {
                setNeedsPassword(false);
                setLinkData(result);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid password');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-background)]">
                <div className="text-center">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20">
                                <Cloud className="h-8 w-8 text-[var(--color-primary-foreground)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
                                G-Drive
                            </h1>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                            Loading shared content...
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-sm">
                            Please wait while we retrieve the file
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-background)]">
                <div className="text-center">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20">
                                <Cloud className="h-8 w-8 text-[var(--color-primary-foreground)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
                                G-Drive
                            </h1>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                            Link Error
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                            {error}
                        </p>
                        <Link to="/">
                            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Return to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Password protected state
    if (needsPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-background)]">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20">
                                <Cloud className="h-8 w-8 text-[var(--color-primary-foreground)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
                                G-Drive
                            </h1>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 sm:p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-8 w-8 text-[var(--color-warning)]" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                            Password Protected
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                            This content is password protected. Enter the password to view.
                        </p>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30">
                                <p className="text-sm text-[var(--color-danger)] flex items-center justify-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<Lock className="h-5 w-5" />}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                isLoading={isLoading}
                            >
                                Access Content
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Success state - show shared resource
    if (linkData) {
        return (
            <div className="min-h-screen bg-[var(--color-background)]">
                {/* Header */}
                <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20">
                                    <Cloud className="h-6 w-6 text-[var(--color-primary-foreground)]" />
                                </div>
                                <h1 className="text-xl font-bold text-[var(--color-text)]">
                                    G-Drive
                                </h1>
                            </div>
                            <Link to="/">
                                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                    Back to Drive
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SharedResourceView
                        resource={linkData.resource}
                        link={linkData.link}
                        downloadUrl={linkData.downloadUrl}
                        viewUrl={linkData.viewUrl}
                    />
                </main>
            </div>
        );
    }

    // Fallback - should not reach here
    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-background)]">
            <div className="text-center">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20">
                            <Cloud className="h-8 w-8 text-[var(--color-primary-foreground)]" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
                            G-Drive
                        </h1>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-8 w-8 text-[var(--color-warning)]" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                        Unable to load the shared content. Please try again later.
                    </p>
                    <Link to="/">
                        <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                            Return to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
