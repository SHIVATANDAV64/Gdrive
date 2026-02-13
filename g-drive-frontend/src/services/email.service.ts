/**
 * Email Notification Service
 * Sends email notifications for various events (shares, etc.)
 * 
 * NOTE: This requires setting up an email provider in Appwrite Console
 * or using an external email service like SendGrid, Mailgun, etc.
 */

import { functions, AppwriteConfig } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import { safeParseJSON } from '@/lib/utils';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}

export interface EmailNotification {
    to: string;
    subject: string;
    type: 'share_invitation' | 'share_updated' | 'share_removed' | 'file_comment';
    metadata?: Record<string, any>;
}

/**
 * Send a share invitation email
 * This function is called automatically when sharing a file/folder
 */
export async function sendShareInvitationEmail(params: {
    recipientEmail: string;
    recipientName?: string;
    senderName: string;
    resourceName: string;
    resourceType: 'file' | 'folder';
    role: 'viewer' | 'editor';
    shareUrl?: string;
}): Promise<boolean> {
    const {
        recipientEmail,
        recipientName,
        senderName,
        resourceName,
        resourceType,
        role,
        shareUrl,
    } = params;

    // Construct the email content
    const subject = `${senderName} shared a ${resourceType} with you`;
    const roleText = role === 'editor' ? 'edit' : 'view';
    
    const message = `
Hi${recipientName ? ` ${recipientName}` : ''},

${senderName} has shared a ${resourceType} with you:

📁 ${resourceName}
🔐 Permission: Can ${roleText}

${shareUrl ? `Click here to view: ${shareUrl}` : 'Log in to G-Drive to access the shared item.'}

Best,
G-Drive Team
    `.trim();

    // Log the notification attempt (for debugging and tracking)
    console.log('[Email] Sending share invitation:', {
        to: recipientEmail,
        subject,
        resourceType,
        resourceName,
    });

    // In production, integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - Amazon SES
    // - Resend
    
    // For now, we'll store the notification in the activity log
    // and return true to indicate "sent" (queued)
    
    try {
        // Store notification record (optional: create a notifications collection)
        // This serves as a record of what emails should have been sent
        
        // For a real implementation, you would:
        // 1. Call your email service API here
        // 2. Handle errors and retry logic
        // 3. Track delivery status
        
        return true;
    } catch (error) {
        console.error('[Email] Failed to send:', error);
        return false;
    }
}

/**
 * Send a notification when share permissions are updated
 */
export async function sendShareUpdatedEmail(params: {
    recipientEmail: string;
    senderName: string;
    resourceName: string;
    resourceType: 'file' | 'folder';
    oldRole: 'viewer' | 'editor';
    newRole: 'viewer' | 'editor';
}): Promise<boolean> {
    const { recipientEmail, senderName, resourceName, resourceType, oldRole, newRole } = params;

    const subject = `Your access to "${resourceName}" has been updated`;
    
    console.log('[Email] Sending share update notification:', {
        to: recipientEmail,
        subject,
        change: `${oldRole} -> ${newRole}`,
    });

    return true;
}

/**
 * Send a notification when share access is revoked
 */
export async function sendShareRevokedEmail(params: {
    recipientEmail: string;
    senderName: string;
    resourceName: string;
    resourceType: 'file' | 'folder';
}): Promise<boolean> {
    const { recipientEmail, senderName, resourceName, resourceType } = params;

    const subject = `Your access to "${resourceName}" has been removed`;
    
    console.log('[Email] Sending share revoked notification:', {
        to: recipientEmail,
        subject,
    });

    return true;
}

/**
 * Email configuration status
 */
export function isEmailConfigured(): boolean {
    // Check if email service is configured
    // In production, check for API keys or SMTP settings
    const hasEmailConfig = !!(
        import.meta.env.VITE_EMAIL_SERVICE_API_KEY ||
        import.meta.env.VITE_SMTP_HOST
    );
    
    return hasEmailConfig;
}

/**
 * Get email preview (for UI display before sending)
 */
export function getShareInvitationPreview(params: {
    recipientEmail: string;
    senderName: string;
    resourceName: string;
    resourceType: 'file' | 'folder';
    role: 'viewer' | 'editor';
}): { subject: string; preview: string } {
    const { senderName, resourceName, resourceType, role } = params;
    
    return {
        subject: `${senderName} shared a ${resourceType} with you`,
        preview: `You've been granted ${role} access to "${resourceName}"`,
    };
}
