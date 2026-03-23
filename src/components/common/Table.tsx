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

function renderCell<T>(col: Column<T>, item: T): ReactNode {
  if (col.render) {
    return col.render(item);
  }
  const v = (item as Record<string, unknown>)[col.key];
  return v != null && v !== '' ? String(v) : '—';
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
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-20">
        <Loader2 className="animate-spin text-[#6B5B54]" size={32} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20 text-gray-500">
        <AlertCircle size={48} className="mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* دسکتاپ و تبلت بزرگ: جدول کلاسیک */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase text-gray-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 lg:px-6 lg:py-4 ${col.headerClassName || ''}`}
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
                onClick={() => onRowClick?.(item)}
                className={`transition-colors hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${col.key}`}
                    className={`px-4 py-3 text-gray-700 lg:px-6 lg:py-4 ${col.className || ''} ${
                      col.render ? '' : 'whitespace-nowrap'
                    }`}
                  >
                    {renderCell(col, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* موبایل: هر ردیف یک کارت */}
      <div className="space-y-3 p-3 sm:p-4 md:hidden">
        {data.map((item) => (
          <article
            key={item.id}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(item)}
            onKeyDown={(e) => {
              if (!onRowClick) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick(item);
              }
            }}
            className={`rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-4 shadow-sm ring-1 ring-black/[0.02] ${
              onRowClick
                ? 'cursor-pointer transition active:scale-[0.99] hover:border-zafting-accent/25 hover:shadow-md'
                : ''
            }`}
          >
            <dl className="space-y-3">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex flex-col gap-1 border-b border-gray-100/90 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    {col.title}
                  </dt>
                  <dd
                    className={`min-w-0 break-words text-sm text-gray-900 ${col.className || ''}`}
                  >
                    {renderCell(col, item)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      {pagination && (
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-center text-sm text-gray-500 sm:text-right">
            نمایش{' '}
            {Math.min(
              (pagination.page - 1) * pagination.limit + 1,
              pagination.total,
            )}{' '}
            تا{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} از{' '}
            {pagination.total} مورد
          </div>
          <div className="flex items-center justify-center gap-2" dir="ltr">
            <button
              type="button"
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex min-w-[3rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
              {pagination.page} /{' '}
              {Math.ceil(pagination.total / pagination.limit) || 1}
            </div>
            <button
              type="button"
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.limit)
              }
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
