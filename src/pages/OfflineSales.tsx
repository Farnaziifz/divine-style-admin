import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Table, type Column } from '../components/common/Table';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { offlineSaleService, type OfflineSale } from '../services/offlineSale.service';

const formatPrice = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const OfflineSales = () => {
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedSale, setSelectedSale] = useState<OfflineSale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<OfflineSale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await offlineSaleService.getAll({
        page,
        limit,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      setSales(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch offline sales', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, searchQuery]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleDelete = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      await offlineSaleService.remove(saleToDelete.id);
      setSaleToDelete(null);
      fetchSales();
    } catch (error) {
      console.error('Failed to delete offline sale', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<OfflineSale>[] = [
    { key: 'channel', title: 'محل فروش', render: (s) => s.channel },
    { key: 'soldAt', title: 'تاریخ', render: (s) => formatDateTime(s.soldAt) },
    {
      key: 'items',
      title: 'تعداد آیتم',
      render: (s) => s.items.reduce((sum, i) => sum + i.quantity, 0),
    },
    { key: 'discountAmount', title: 'تخفیف', render: (s) => formatPrice(s.discountAmount) },
    {
      key: 'commissionPercent',
      title: 'کمیسیون',
      render: (s) => (s.commissionPercent != null ? `${s.commissionPercent}٪` : '—'),
    },
    { key: 'netAmount', title: 'مبلغ خالص', render: (s) => formatPrice(s.netAmount) },
    {
      key: 'actions',
      title: 'عملیات',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSale(s);
            }}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
          >
            جزئیات
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSaleToDelete(s);
            }}
            className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            aria-label="حذف"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">فروش حضوری / اینستا</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
            تعداد کل: <span className="font-bold text-[#2A2A2A]">{total}</span>
          </div>
          <Link
            to="/offline-sales/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zafting-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            ثبت فروش جدید
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            onSearch={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            placeholder="جستجو بر اساس محل فروش (اینستاگرام، ایونت...)"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="animate-spin text-zafting-accent" size={32} />
        </div>
      ) : (
        <Table
          columns={columns}
          data={sales}
          emptyMessage="فروش دستی‌ای ثبت نشده"
          onRowClick={(s) => setSelectedSale(s)}
          pagination={{ page, limit, total, onPageChange: (p) => setPage(p) }}
        />
      )}

      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="جزئیات فروش"
        maxWidthClassName="max-w-2xl"
      >
        {selectedSale && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">محل فروش: </span>
                <span className="font-medium text-gray-900">{selectedSale.channel}</span>
              </div>
              <div>
                <span className="text-gray-500">تاریخ: </span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(selectedSale.soldAt)}
                </span>
              </div>
              {selectedSale.note && (
                <div className="col-span-2">
                  <span className="text-gray-500">یادداشت: </span>
                  <span className="font-medium text-gray-900">{selectedSale.note}</span>
                </div>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-right">محصول</th>
                    <th className="px-3 py-2 text-right">تعداد</th>
                    <th className="px-3 py-2 text-right">قیمت واحد</th>
                    <th className="px-3 py-2 text-right">جمع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-gray-900">{item.title}</td>
                      <td className="px-3 py-2 text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-700">{formatPrice(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-gray-900 font-medium">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">جمع فروش</span>
                <span className="text-gray-900">{formatPrice(selectedSale.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">تخفیف</span>
                <span className="text-gray-900">{formatPrice(selectedSale.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  کمیسیون{selectedSale.commissionPercent != null ? ` (${selectedSale.commissionPercent}٪)` : ''}
                </span>
                <span className="text-gray-900">{formatPrice(selectedSale.commissionAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <span className="text-gray-900">مبلغ خالص</span>
                <span className="text-zafting-accent">{formatPrice(selectedSale.netAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDelete}
        title="حذف فروش"
        message="با حذف این فروش، موجودی محصولات مربوطه به انبار برمی‌گردد. مطمئن هستید؟"
        confirmText="حذف"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default OfflineSales;
