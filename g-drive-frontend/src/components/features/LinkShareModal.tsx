 

import { useState, useEffect, useRef } from 'react';
import { Link2, Copy, Check, Shield, Calendar, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LINK_EXPIRY_OPTIONS } from '@/lib/constants';
import { getExpiryDate } from '@/lib/utils';





interface LinkShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceName: string;
    resourceType: 'file' | 'folder';
    existingLink?: {
        token: string;
        url: string;
        role: 'viewer' | 'editor';
        passwordProtected: boolean;
        expiresAt?: string;
    } | null;
    onCreateLink: (options: {
        role: 'viewer' | 'editor';
        password?: string;
        expiresAt?: string;
    }) => Promise<void>;
    onDeleteLink?: () => Promise<void>;
}





export function LinkShareModal({
    isOpen,
    onClose,
    resourceName,
    resourceType: _resourceType,
    existingLink = null,
    onCreateLink,
    onDeleteLink,
}: LinkShareModalProps) {
    const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [expiryDays, setExpiryDays] = useState<number | null>(7);
    const [isCreating, setIsCreating] = useState(false);
    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    
    useEffect(() => {
        return () => {
            if (copiedTimerRef.current) {
                clearTimeout(copiedTimerRef.current);
            }
        };
    }, []);

    
    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setUsePassword(false);
            setCopied(false);
        }
    }, [isOpen]);

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await onCreateLink({
                role,
                password: usePassword && password ? password : undefined,
                expiresAt: expiryDays ? getExpiryDate(expiryDays) : undefined,
            });
        } catch (err) {
            console.error('Failed to create link:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopy = () => {
        if (existingLink?.url) {
            navigator.clipboard.writeText(existingLink.url);
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
            title={`Get link for "${resourceName}"`}
            size="md"
        >
            <div className="space-y-6">
                {existingLink ? (
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Input
                                value={existingLink.url}
                                readOnly
                                className="flex-1 font-mono text-sm"
                            />
                            <Button
                                variant="secondary"
                                onClick={handleCopy}
                                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>

                        { }
                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                            <span className="flex items-center gap-1">
                                <Link2 className="h-4 w-4" />
                                {existingLink.role === 'editor' ? 'Can edit' : 'Can view'}
                            </span>
                            {existingLink.passwordProtected && (
                                <span className="flex items-center gap-1">
                                    <Shield className="h-4 w-4" />
                                    Password protected
                                </span>
                            )}
                            {existingLink.expiresAt && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Expires: {new Date(existingLink.expiresAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        { }
                        {onDeleteLink && (
                            <Button
                                variant="ghost"
                                onClick={onDeleteLink}
                                leftIcon={<Trash2 className="h-4 w-4" />}
                                className="text-[var(--color-danger)]"
                            >
                                Delete link
                            </Button>
                        )}
                    </div>
                ) : (
                    
                    <div className="space-y-4">
                        { }
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                                Anyone with link can:
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
                                aria-label="Permission level"
                            >
                                <option value="viewer">View only</option>
                                <option value="editor">Edit</option>
                            </select>
                        </div>

                        { }
                        <div>
                            <label className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={usePassword}
                                    onChange={(e) => setUsePassword(e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-border)]"
                                />
                                <span className="text-sm font-medium text-[var(--color-text)]">
                                    Password protect
                                </span>
                            </label>
                            {usePassword && (
                                <Input
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    leftIcon={<Shield className="h-5 w-5" />}
                                />
                            )}
                        </div>

                        { }
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                                Link expires in:
                            </label>
                            <select
                                value={expiryDays ?? ''}
                                onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
                                aria-label="Link expiration"
                            >
                                <option value="">Never</option>
                                {LINK_EXPIRY_OPTIONS.map((opt) => (
                                    <option key={opt.days} value={opt.days || ''}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        { }
                        <Button
                            onClick={handleCreate}
                            isLoading={isCreating}
                            fullWidth
                            leftIcon={<Link2 className="h-4 w-4" />}
                        >
                            Create link
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default LinkShareModal;
