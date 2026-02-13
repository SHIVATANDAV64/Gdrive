 

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Users, Trash2, Link2, Copy, Check, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidEmail } from '@/lib/utils';





interface SharedUser {
    id: string;
    email: string;
    name?: string;
    role: 'viewer' | 'editor';
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceName: string;
    resourceType: 'file' | 'folder';
    sharedWith?: SharedUser[];
    onAddShare?: (email: string, role: 'viewer' | 'editor') => Promise<void>;
    onRemoveShare?: (userId: string) => Promise<void>;
    onChangeRole?: (userId: string, role: 'viewer' | 'editor') => Promise<void>;
    publicLink?: string | null;
    onCreateLink?: () => Promise<string>;
    onDeleteLink?: () => Promise<void>;
}





export function ShareModal({
    isOpen,
    onClose,
    resourceName,
    resourceType: _resourceType,
    sharedWith = [],
    onAddShare,
    onRemoveShare,
    onChangeRole,
    publicLink = null,
    onCreateLink,
    onDeleteLink,
}: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [notificationSent, setNotificationSent] = useState(false);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    
    useEffect(() => {
        return () => {
            if (copiedTimerRef.current) {
                clearTimeout(copiedTimerRef.current);
            }
            if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
            }
        };
    }, []);

    
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setRole('viewer');
            setError(null);
            setCopied(false);
            setNotificationSent(false);
        }
    }, [isOpen]);

    const handleAddShare = async () => {
        if (!onAddShare) return;

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email');
            return;
        }

        setIsAdding(true);
        setError(null);

        try {
            await onAddShare(email.trim(), role);
            setEmail('');
            // Show notification sent indicator
            setNotificationSent(true);
            if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
            }
            notificationTimerRef.current = setTimeout(() => setNotificationSent(false), 3000);
        } catch {
            setError('Failed to share. User may not exist.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleCopyLink = () => {
        if (publicLink) {
            navigator.clipboard.writeText(publicLink);
            setCopied(true);
            if (copiedTimerRef.current) {
                clearTimeout(copiedTimerRef.current);
            }
            copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Share "${resourceName}"`}
            size="lg"
        >
            <div className="space-y-6">
                { }
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Share with people
                    </label>

                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={error || undefined}
                            leftIcon={<UserPlus className="h-5 w-5" />}
                            className="flex-1"
                        />

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                            className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                            aria-label="Permission level"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>

                        <Button onClick={handleAddShare} isLoading={isAdding}>
                            Share
                        </Button>
                    </div>

                    {/* Notification sent indicator */}
                    {notificationSent && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-[var(--color-success)]">
                            <Mail className="h-4 w-4" />
                            <span>Invitation sent! They'll receive an email notification.</span>
                        </div>
                    )}
                </div>

                { }
                {sharedWith.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-[var(--color-text-secondary)]" />
                            <span className="text-sm font-medium text-[var(--color-text)]">
                                People with access
                            </span>
                        </div>

                        <div className="space-y-2">
                            {sharedWith.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-elevated)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-medium">
                                            {(user.name || user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text)]">
                                                {user.name || user.email}
                                            </p>
                                            {user.name && (
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {user.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={user.role}
                                            onChange={(e) => onChangeRole?.(user.id, e.target.value as 'viewer' | 'editor')}
                                            className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                                            aria-label={`Change role for ${user.name || user.email}`}
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                        </select>

                                        <button
                                            onClick={() => onRemoveShare?.(user.id)}
                                            className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                                            aria-label={`Remove ${user.name || user.email}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                { }
                <div className="border-t border-[var(--color-border)] pt-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Link2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text)]">
                            Public link
                        </span>
                    </div>

                    {publicLink ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={publicLink}
                                readOnly
                                className="flex-1 font-mono text-sm"
                            />
                            <Button
                                variant="secondary"
                                onClick={handleCopyLink}
                                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onDeleteLink}
                                className="text-[var(--color-danger)]"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="secondary"
                            onClick={onCreateLink}
                            leftIcon={<Link2 className="h-4 w-4" />}
                        >
                            Create public link
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default ShareModal;
