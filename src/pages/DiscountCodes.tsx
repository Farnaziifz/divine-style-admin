import { useCallback, useEffect, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AddDiscountModal } from '../components/discount/AddDiscountModal';
import {
  discountService,
  type DiscountCode,
  type DiscountCodeScope,
} from '../services/discount.service';
import { Loader2, Plus, TicketPercent, Trash2 } from 'lucide-react';

const scopeLabel = (s: DiscountCodeScope) => {
  switch (s) {
    case 'ALL_USERS':
      return 'عمومی';
    case 'SINGLE_USER':
      return 'یک کاربر';
    case 'USER_GROUP':
      return 'گروه کاربران';
    default:
      return s;
  }
};

const DiscountCodes = () => {
  const [rows, setRows] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discountService.list({ page, limit });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await discountService.remove(deleteId);
      setDeleteId(null);
      void fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<DiscountCode>[] = [
    {
      key: 'code',
      title: 'کد',
      render: (r) => (
        <span className="font-mono dir-ltr text-left inline-block">{r.code}</span>
      ),
    },
    {
      key: 'title',
      title: 'عنوان',
      render: (r) => r.title || <span className="text-gray-400">—</span>,
    },
    {
      key: 'scope',
      title: 'مخاطب',
      render: (r) => (
        <span>
          {scopeLabel(r.scope)}
          {r.scope === 'SINGLE_USER' && r.user?.mobile && (
            <span className="text-gray-500 text-xs mr-1 dir-ltr">
              ({r.user.mobile})
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'value',
      title: 'مقدار',
      render: (r) =>
        r.valueType === 'PERCENT' ? `${r.value}%` : `${r.value.toLocaleString('fa-IR')} تومان`,
    },
    {
      key: 'validTo',
      title: 'انقضا',
      render: (r) =>
        new Date(r.validTo).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      key: 'uses',
      title: 'استفاده',
      render: (r) => (
        <span className="dir-ltr inline-block text-left">
          {r.usedCount} / {r.maxTotalUses ?? '∞'}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'وضعیت',
      render: (r) =>
        r.isActive ? (
          <span className="text-green-700 text-sm font-bold">فعال</span>
        ) : (
          <span className="text-gray-500 text-sm">غیرفعال</span>
        ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (r) => (
        <button
          type="button"
          onClick={() => setDeleteId(r.id)}
          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="حذف"
        >
          <Trash2 size={18} />
        </button>
      ),
      className: 'text-center',
      headerClassName: 'text-center',
    },
  ];

  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zafting-accent/10 rounded-xl text-zafting-accent">
            <TicketPercent size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">کدهای تخفیف</h1>
            <p className="text-gray-500 text-sm mt-1">
              ایجاد و مدیریت کدهای تخفیف برای عموم یا کاربر مشخص
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95"
        >
          <Plus size={20} />
          افزودن کد تخفیف
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-zafting-accent" size={40} />
          </div>
        ) : (
          <Table
            columns={columns}
            data={rows}
            emptyMessage="کد تخفیفی ثبت نشده است"
          />
        )}

        {!loading && total > limit && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-100">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              قبلی
            </button>
            <span className="text-sm text-gray-600">
              صفحه {page} از {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              بعدی
            </button>
          </div>
        )}
      </div>

      <AddDiscountModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => void fetchList()}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف کد تخفیف"
        message="آیا از حذف این کد تخفیف مطمئن هستید؟"
        confirmText="حذف"
        isLoading={deleting}
        type="danger"
      />
    </div>
  );
};

export default DiscountCodes;
