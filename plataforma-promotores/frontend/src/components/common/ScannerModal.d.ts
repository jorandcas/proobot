import React from 'react';
interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
    title?: string;
    instructions?: string;
    hint?: string;
}
export declare const ScannerModal: React.FC<ScannerModalProps>;
export {};
//# sourceMappingURL=ScannerModal.d.ts.map