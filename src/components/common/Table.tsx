import type { ReactNode } from 'react';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'داده‌ای یافت نشد',
  onRowClick,
  pagination,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-100">
        <Loader2 className="animate-spin text-[#6B5B54]" size={32} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
        <AlertCircle size={48} className="mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 font-bold ${col.headerClassName || ''}`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick && onRowClick(item)}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${col.key}`}
                    className={`px-6 py-4 whitespace-nowrap text-gray-700 ${
                      col.className || ''
                    }`}
                  >
                    {col.render
                      ? col.render(item)
                      : String(
                          (item as Record<string, unknown>)[col.key] || ''
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-sm text-gray-500">
            نمایش{' '}
            {Math.min(
              (pagination.page - 1) * pagination.limit + 1,
              pagination.total
            )}{' '}
            تا{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} از{' '}
            {pagination.total} مورد
          </div>
          <div className="flex items-center gap-2" dir="ltr">
            <button
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
              {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
            </div>
            <button
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.limit)
              }
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
