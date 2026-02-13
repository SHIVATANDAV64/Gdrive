
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';


type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    clearAllToasts: () => void;
}


const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}


interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    useEffect(() => {
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, onRemove]);

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        error: <XCircle className="h-5 w-5 text-red-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        info: <Info className="h-5 w-5 text-blue-600" />,
    };

    const styles = {
        success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        error: 'border-red-200 bg-red-50 text-red-900',
        warning: 'border-amber-200 bg-amber-50 text-amber-900',
        info: 'border-blue-200 bg-blue-50 text-blue-900',
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border shadow-sm',
                'animate-in slide-in-from-right duration-300',
                styles[toast.type]
            )}
        >
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.description && (
                    <p className="mt-1 text-sm opacity-90">
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className={cn(
                    "flex-shrink-0 p-1 rounded-md transition-colors",
                    "hover:bg-black/5"
                )}
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4 opacity-60" />
            </button>
        </div>
    );
}


function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div
            aria-label="Notifications"
            className="fixed bottom-6 right-6 z-[120] flex flex-col gap-3 max-w-sm w-full"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}


interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}



let globalAddToast: ((toast: Omit<Toast, 'id'>) => string) | null = null;

export function setGlobalToast(addToast: (toast: Omit<Toast, 'id'>) => string) {
    globalAddToast = addToast;
}

export function toast(options: Omit<Toast, 'id'>) {
    if (globalAddToast) {
        return globalAddToast(options);
    }
    console.warn('Toast system not initialized');
    return '';
}

export function toastSuccess(title: string, description?: string) {
    return toast({ type: 'success', title, description });
}

export function toastError(title: string, description?: string) {
    return toast({ type: 'error', title, description });
}

export function toastWarning(title: string, description?: string) {
    return toast({ type: 'warning', title, description });
}

export function toastInfo(title: string, description?: string) {
    return toast({ type: 'info', title, description });
}

export default ToastProvider;
