import React from 'react';
interface Column<T> {
    key: string;
    label: string;
    className?: string;
}
interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    renderRow: (item: T, index: number) => React.ReactNode;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    className?: string;
}
export declare function Table<T>({ columns, data, renderRow, onRowClick, emptyMessage, className }: TableProps<T>): React.JSX.Element;
export {};
//# sourceMappingURL=Table.d.ts.map