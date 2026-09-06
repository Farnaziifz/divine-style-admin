import { useCallback, useEffect, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  walletService,
  type WalletWithdrawal,
  type WalletWithdrawalStatus,
} from '../services/wallet.service';
import { Banknote, Check, Loader2, X } from 'lucide-react';

const statusLabel = (s: WalletWithdrawalStatus) => {
  switch (s) {
    case 'PENDING':
      return <span className="text-amber-600 text-sm font-bold">در انتظار</span>;
    case 'PAID':
      return <span className="text-green-700 text-sm font-bold">پرداخت شد</span>;
    case 'REJECTED':
      return <span className="text-red-600 text-sm font-bold">رد شد</span>;
    default:
      return s;
  }
};

const WalletWithdrawals = () => {
  const [rows, setRows] = useState<WalletWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [payId, setPayId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletService.listWithdrawals({ page, limit });
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

  const handleResolve = async (id: string, action: 'PAID' | 'REJECTED') => {
    setResolving(true);
    try {
      await walletService.resolveWithdrawal(id, { action });
      setPayId(null);
      setRejectId(null);
      void fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const columns: Column<WalletWithdrawal>[] = [
    {
      key: 'user',
      title: 'کاربر',
      render: (r) => (
        <span>
          {r.user?.name || '—'}
          <span className="text-gray-500 text-xs mr-1 dir-ltr">({r.user?.mobile})</span>
        </span>
      ),
    },
    {
      key: 'amount',
      title: 'مبلغ',
      render: (r) => `${r.amount.toLocaleString('fa-IR')} تومان`,
    },
    {
      key: 'cardNumber',
      title: 'شماره کارت/شبا',
      render: (r) => <span className="font-mono dir-ltr text-left inline-block">{r.cardNumber}</span>,
    },
    {
      key: 'requestedAt',
      title: 'تاریخ درخواست',
      render: (r) =>
        new Date(r.requestedAt).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      key: 'status',
      title: 'وضعیت',
      render: (r) => statusLabel(r.status),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (r) =>
        r.status === 'PENDING' ? (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setPayId(r.id)}
              className="p-2 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
              title="پرداخت شد"
            >
              <Check size={18} />
            </button>
            <button
              type="button"
              onClick={() => setRejectId(r.id)}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              title="رد کردن"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
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
            <Banknote size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">درخواست‌های برداشت کیف‌پول</h1>
            <p className="text-gray-500 text-sm mt-1">
              درخواست‌های برداشت کاربران از موجودی کیف‌پول — واریز دستی و تعیین وضعیت
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-zafting-accent" size={40} />
          </div>
        ) : (
          <Table columns={columns} data={rows} emptyMessage="درخواست برداشتی ثبت نشده است" />
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

      <ConfirmModal
        isOpen={!!payId}
        onClose={() => setPayId(null)}
        onConfirm={() => payId && handleResolve(payId, 'PAID')}
        title="تایید پرداخت"
        message="یعنی مبلغ رو دستی به کارت کاربر واریز کردی؟ این عملیات قابل بازگشت نیست."
        confirmText="بله، پرداخت شد"
        isLoading={resolving}
        type="info"
      />

      <ConfirmModal
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={() => rejectId && handleResolve(rejectId, 'REJECTED')}
        title="رد درخواست برداشت"
        message="با رد این درخواست، مبلغ به کیف‌پول کاربر برمی‌گردد."
        confirmText="رد کن"
        isLoading={resolving}
        type="danger"
      />
    </div>
  );
};

export default WalletWithdrawals;
