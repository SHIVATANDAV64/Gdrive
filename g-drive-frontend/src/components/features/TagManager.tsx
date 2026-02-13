/**
 * TagManager Component
 * Modal/Dropdown for managing tags on a resource
 */

import { useState, useCallback } from 'react';
import { Tag as TagIcon, Plus, X, Check, Loader2 } from 'lucide-react';
import { useTags, useResourceTags, useTagMutations } from '@/hooks/useTags';
import { TAG_COLORS, type Tag } from '@/services/tag.service';
import { cn } from '@/lib/utils';

interface TagManagerProps {
    resourceType: 'file' | 'folder';
    resourceId: string;
    onClose?: () => void;
}

export function TagManager({ resourceType, resourceId, onClose }: TagManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[10]); // Default blue

    const { data: tagsData, isLoading: isLoadingTags } = useTags();
    const { data: resourceTags = [], isLoading: isLoadingResourceTags } = useResourceTags(resourceType, resourceId);
    const { createTag, assignTag, unassignTag, isCreating: isCreatingTag, isAssigning, isUnassigning } = useTagMutations();

    const allTags = tagsData?.tags ?? [];
    const assignedTagIds = new Set(resourceTags.map((t: Tag) => t.$id));

    const handleCreateTag = useCallback(async () => {
        if (!newTagName.trim()) return;

        try {
            const tag = await createTag({ name: newTagName.trim(), color: newTagColor });
            // Assign it to the resource immediately
            await assignTag({ tagId: tag.$id, resourceType, resourceId });
            setNewTagName('');
            setIsCreating(false);
        } catch (err) {
            console.error('Failed to create tag:', err);
        }
    }, [newTagName, newTagColor, createTag, assignTag, resourceType, resourceId]);

    const handleToggleTag = useCallback(async (tag: Tag) => {
        try {
            if (assignedTagIds.has(tag.$id)) {
                await unassignTag({ tagId: tag.$id, resourceType, resourceId });
            } else {
                await assignTag({ tagId: tag.$id, resourceType, resourceId });
            }
        } catch (err) {
            console.error('Failed to toggle tag:', err);
        }
    }, [assignedTagIds, assignTag, unassignTag, resourceType, resourceId]);

    const isLoading = isLoadingTags || isLoadingResourceTags;
    const isBusy = isCreatingTag || isAssigning || isUnassigning;

    return (
        <div className="w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                    <TagIcon className="h-4 w-4" />
                    Tags
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Tag List */}
            <div className="max-h-48 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-muted)]" />
                    </div>
                ) : allTags.length === 0 && !isCreating ? (
                    <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                        No tags yet. Create one!
                    </p>
                ) : (
                    <div className="space-y-1">
                        {allTags.map((tag) => (
                            <button
                                key={tag.$id}
                                onClick={() => handleToggleTag(tag)}
                                disabled={isBusy}
                                className={cn(
                                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left',
                                    'hover:bg-[var(--color-surface-hover)]',
                                    isBusy && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-sm text-[var(--color-text)] flex-1 truncate">
                                    {tag.name}
                                </span>
                                {assignedTagIds.has(tag.$id) && (
                                    <Check className="h-4 w-4 text-[var(--color-success)]" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Create New Tag */}
            <div className="border-t border-[var(--color-border)] p-2">
                {isCreating ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="Tag name..."
                            className="w-full px-2 py-1.5 text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateTag();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                        />
                        
                        {/* Color Picker */}
                        <div className="flex flex-wrap gap-1">
                            {TAG_COLORS.slice(0, 12).map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewTagColor(color)}
                                    className={cn(
                                        'w-5 h-5 rounded-full transition-transform',
                                        newTagColor === color && 'ring-2 ring-offset-1 ring-[var(--color-primary)] scale-110'
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 px-2 py-1 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTag}
                                disabled={!newTagName.trim() || isCreatingTag}
                                className="flex-1 px-2 py-1 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                            >
                                {isCreatingTag ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Create new tag
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Small tag badge component for displaying on file/folder cards
 */
export function TagBadge({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
    return (
        <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
        >
            {tag.name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-white/20 rounded-full p-0.5"
                >
                    <X className="h-2.5 w-2.5" />
                </button>
            )}
        </span>
    );
}

/**
 * Tags display component for showing tags on items
 */
export function TagsDisplay({
    resourceType,
    resourceId,
    maxDisplay = 2,
}: {
    resourceType: 'file' | 'folder';
    resourceId: string;
    maxDisplay?: number;
}) {
    const { data: tags = [] } = useResourceTags(resourceType, resourceId);

    if (tags.length === 0) return null;

    const displayTags = tags.slice(0, maxDisplay);
    const remaining = tags.length - maxDisplay;

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {displayTags.map((tag: Tag) => (
                <span
                    key={tag.$id}
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                    title={tag.name}
                />
            ))}
            {remaining > 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">
                    +{remaining}
                </span>
            )}
        </div>
    );
}

export default TagManager;
