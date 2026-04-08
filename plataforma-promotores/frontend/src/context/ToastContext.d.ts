import React from 'react';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}
interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}
export declare const ToastProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useToast: () => ToastContextType;
export {};
//# sourceMappingURL=ToastContext.d.ts.map