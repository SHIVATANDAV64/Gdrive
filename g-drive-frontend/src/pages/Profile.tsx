

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Shield, Check, AlertCircle, Settings, Eye, EyeOff, Save, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { account } from '@/lib/appwrite';





export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout, logoutAll, isLoggingOut, isLoggingOutAll, refetchUser } = useAuth();




    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');


    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name ?? '');
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState(false);


    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);





    const handleUpdateName = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) {
            setNameError('Name cannot be empty');
            return;
        }

        setIsUpdatingName(true);
        setNameError(null);
        setNameSuccess(false);

        try {
            await account.updateName(newName.trim());
            await refetchUser();
            setIsEditingName(false);
            setNameSuccess(true);
            setTimeout(() => setNameSuccess(false), 3000);
        } catch (error) {
            setNameError(error instanceof Error ? error.message : 'Failed to update name');
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);


        if (!currentPassword) {
            setPasswordError('Current password is required');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);

        try {
            await account.updatePassword(newPassword, currentPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordSuccess(true);
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error) {
            setPasswordError(
                error instanceof Error ? error.message : 'Failed to change password'
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.login);
    };

    const handleLogoutAllSessions = async () => {
        try {
            await logoutAll();
            navigate(ROUTES.login);
        } catch (error) {
            console.error('Failed to logout all sessions:', error);
        }
    };





    return (
        <div className="max-w-2xl mx-auto page-enter px-6 py-8">
            { }
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-3">
                    <Settings className="h-6 w-6 text-[var(--color-primary)]" />
                    Settings
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1 max-w-lg">
                    Manage your account settings and preferences
                </p>
            </div>

            { }
            <div className="flex gap-1 mb-6 p-1 bg-[var(--color-surface)] rounded-lg w-fit border border-[var(--color-border)]">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile'
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                        }`}
                >
                    <User className="h-4 w-4" />
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'security'
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                        }`}
                >
                    <Shield className="h-4 w-4" />
                    Security
                </button>
            </div>

            { }
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    { }
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                            Profile Information
                        </h2>

                        { }
                        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[var(--color-border-subtle)]">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-blue-500/20">
                                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[var(--color-text)] mb-0.5">
                                    {user?.name ?? 'User'}
                                </p>
                                <p className="text-[var(--color-text-secondary)] flex items-center gap-2">
                                    <Mail className="h-4 w-4 opacity-70" />
                                    {user?.email ?? ''}
                                </p>
                            </div>
                        </div>

                        { }
                        <div>
                            <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                                Display Name
                            </label>
                            {isEditingName ? (
                                <form onSubmit={handleUpdateName} className="flex flex-col sm:flex-row gap-4 w-full">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Enter your name"
                                            error={nameError ?? undefined}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            isLoading={isUpdatingName}
                                            leftIcon={!isUpdatingName && <Save className="h-4 w-4" />}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEditingName(false);
                                                setNewName(user?.name ?? '');
                                                setNameError(null);
                                            }}
                                            leftIcon={<X className="h-4 w-4" />}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] w-full">
                                    <span className="text-[var(--color-text)] font-medium">
                                        {user?.name ?? 'Not set'}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            )}
                            {nameSuccess && (
                                <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 w-full">
                                    <Check className="h-4 w-4 text-[var(--color-success)]" />
                                    <span className="text-sm text-[var(--color-success)] font-medium">
                                        Name updated successfully
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    { }
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                            Account Actions
                        </h2>

                        <div>
                            <Button
                                variant="danger"
                                onClick={handleLogout}
                                isLoading={isLoggingOut}
                                leftIcon={<LogOut className="h-4 w-4" />}
                            >
                                Sign out
                            </Button>
                            <p className="text-sm text-[var(--color-text-muted)] mt-3">
                                Sign out of your account on this device
                            </p>
                        </div>
                    </div>
                </div>
            )}

            { }
            {activeTab === 'security' && (
                <div className="space-y-6">
                    { }
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                            Change Password
                        </h2>

                        <form onSubmit={handleChangePassword} className="space-y-[24px] w-full">
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                label="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPasswords ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                }
                            />

                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                label="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Create a strong password"
                                helperText="Must be at least 8 characters"
                            />

                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                            />

                            {passwordError && (
                                <div className="p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30">
                                    <p className="text-sm text-[var(--color-danger)] flex items-center gap-2 font-medium">
                                        <AlertCircle className="h-4 w-4" />
                                        {passwordError}
                                    </p>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="p-4 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/30">
                                    <p className="text-sm text-[var(--color-success)] flex items-center gap-2 font-medium">
                                        <Check className="h-4 w-4" />
                                        Password changed successfully
                                    </p>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    isLoading={isChangingPassword}
                                >
                                    Update password
                                </Button>
                            </div>
                        </form>
                    </div>

                    { }
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                            Sessions
                        </h2>

                        <div>
                            <Button
                                variant="secondary"
                                onClick={handleLogoutAllSessions}
                                isLoading={isLoggingOutAll}
                                leftIcon={!isLoggingOutAll && <LogOut className="h-4 w-4" />}
                                className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5"
                            >
                                Sign out of all devices
                            </Button>
                            <p className="text-sm text-[var(--color-text-muted)] mt-3">
                                This will sign you out of all devices including this one
                            </p>
                        </div>
                    </div>

                    { }
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                            Email Verification
                        </h2>

                        <div className="flex items-center gap-4">
                            {user?.emailVerification ? (
                                <>
                                    <div className="h-12 w-12 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center">
                                        <Check className="h-6 w-6 text-[var(--color-success)]" />
                                    </div>
                                    <div>
                                        <p className="text-[var(--color-text)] font-bold">
                                            Email verified
                                        </p>
                                        <p className="text-[var(--color-text-secondary)]">
                                            Your email address has been verified
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-12 w-12 rounded-2xl bg-[var(--color-warning)]/10 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-[var(--color-warning)]" />
                                    </div>
                                    <div>
                                        <p className="text-[var(--color-text)] font-bold">
                                            Email not verified
                                        </p>
                                        <p className="text-[var(--color-text-secondary)]">
                                            Please verify your email address
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
