

import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';





interface ConfirmDeleteModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}





export function ConfirmDeleteModal({ isOpen, itemName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title="Move to Trash?"
            size="sm"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-[var(--color-text-secondary)]">
                        This will move <span className="font-medium text-[var(--color-text)]">"{itemName}"</span> to the trash. It will be permanently deleted after 30 days.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onConfirm}
                        className="bg-red-500 text-white hover:bg-red-600 border-none"
                    >
                        Move to Trash
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default ConfirmDeleteModal;
