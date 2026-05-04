import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyColumn: string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyColumn,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  className = ''
}: TableProps<T>) {
  console.log('📊 [TABLE] Renderizado con datos:', data.length, 'filas');
  console.log('📊 [TABLE] Columnas:', columns);
  console.log('📊 [TABLE] KeyColumn:', keyColumn);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`
        overflow-x-auto
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar]:h-2
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:hover:bg-gray-400
        ${className}
      `}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.className || ''}
                `}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => {
            console.log(`📊 [TABLE] Renderizando fila ${index}:`, item);
            return (
              <tr
                key={(item as any)[keyColumn] || index}
                className={`
                  ${onRowClick ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}
                `}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => {
                  const value = (item as any)[column.key];
                  console.log(`📊 [TABLE] Celda ${column.key}:`, value, 'Render:', column.render);
                  return (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(value, item, index)
                        : (value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
