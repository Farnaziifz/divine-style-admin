import { useCallback, useEffect, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AddBloggerReferralModal } from '../components/referral/AddBloggerReferralModal';
import { referralService, type ReferralCode } from '../services/referral.service';
import { Loader2, Plus, Share2, Trash2 } from 'lucide-react';

const ReferralCodes = () => {
  const [rows, setRows] = useState<ReferralCode[]>([]);
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
      const res = await referralService.list({ page, limit });
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
      await referralService.remove(deleteId);
      setDeleteId(null);
      void fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<ReferralCode>[] = [
    {
      key: 'code',
      title: 'کد',
      render: (r) => (
        <span className="font-mono dir-ltr text-left inline-block">{r.code}</span>
      ),
    },
    {
      key: 'owner',
      title: 'مالک',
      render: (r) => (
        <span>
          {r.owner?.name || '—'}
          <span className="text-gray-500 text-xs mr-1 dir-ltr">
            ({r.owner?.mobile})
          </span>
          {r.createdByAdmin && (
            <span className="block text-xs text-zafting-accent mt-0.5">بلاگر (ادمین)</span>
          )}
        </span>
      ),
    },
    {
      key: 'discountPercent',
      title: 'تخفیف خریدار',
      render: (r) => `${r.discountPercent}%`,
    },
    {
      key: 'cashbackPercent',
      title: 'کش‌بک معرف',
      render: (r) => `${r.cashbackPercent}%`,
    },
    {
      key: 'usedCount',
      title: 'تعداد استفاده',
      render: (r) => (
        <span className="dir-ltr inline-block text-left">{r.stats.usedCount}</span>
      ),
    },
    {
      key: 'cashback',
      title: 'کش‌بک واریزشده',
      render: (r) => (
        <span className="dir-ltr inline-block text-left">
          {r.stats.totalCashbackCredited.toLocaleString('fa-IR')} تومان
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
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setDeleteId(r.id)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="غیرفعال‌سازی"
          >
            <Trash2 size={18} />
          </button>
        </div>
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
            <Share2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">کدهای ریفرال</h1>
            <p className="text-gray-500 text-sm mt-1">
              کدهایی که کاربران برای خودشان ساخته‌اند یا ادمین برای بلاگرها صادر کرده
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95"
        >
          <Plus size={20} />
          کد ریفرال برای بلاگر
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
            emptyMessage="کد ریفرالی ثبت نشده است"
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

      <AddBloggerReferralModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => void fetchList()}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="غیرفعال‌سازی کد ریفرال"
        message="آیا از غیرفعال‌سازی این کد ریفرال مطمئن هستید؟"
        confirmText="غیرفعال‌سازی"
        isLoading={deleting}
        type="danger"
      />
    </div>
  );
};

export default ReferralCodes;
