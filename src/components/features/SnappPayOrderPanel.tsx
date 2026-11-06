import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { Modal } from '../common/Modal';
import { snappPayService } from '../../services/snappPay.service';
import type { OrderItem, OrderPayment } from '../../services/order.service';

const errMessage = (e: unknown, fallback: string) => {
  const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof msg === 'string' ? msg : fallback;
};

const STATUS_LABELS: Record<string, string> = {
  SETTLE: 'تسویه‌شده (SETTLE)',
  VERIFY: 'تأیید شده، منتظر تسویه (VERIFY)',
  PENDING: 'در انتظار تأیید (PENDING)',
  CANCEL: 'لغو شده (CANCEL)',
  REVERT: 'برگشت‌خورده (REVERT)',
};

interface Props {
  payment: OrderPayment;
  items: OrderItem[];
  canWrite: boolean;
  /** Refetch the order after anything that changes it. */
  onChanged: () => void;
}

/**
 * Snapp Pay actions for one transaction. Cancel and "reduce amount" are
 * irreversible on Snapp's side, so both go through a confirmation dialog
 * (Snapp's docs require an explicit admin approval before calling them).
 */
export const SnappPayOrderPanel = ({ payment, items, canWrite, onChanged }: Props) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [confirmEdit, setConfirmEdit] = useState(false);

  const gatewayStatus = payment.gatewayStatus ?? null;
  const canceled = gatewayStatus === 'CANCEL';
  const paid = payment.status === 'PAID';
  const needsAttention = !paid && gatewayStatus !== null && gatewayStatus !== 'FAILED';

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await fn() });
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: errMessage(e, 'عملیات ناموفق بود') });
    } finally {
      setBusy(null);
    }
  };

  const openEdit = () => {
    setQuantities(Object.fromEntries(items.map((i) => [i.id, i.quantity])));
    setEditOpen(true);
  };

  const changedItems = items.filter((i) => (quantities[i.id] ?? i.quantity) !== i.quantity);
  const allRemoved = items.every((i) => (quantities[i.id] ?? i.quantity) === 0);

  return (
    <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/60 p-3 space-y-3">
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between gap-2">
          <span>وضعیت در اسنپ‌پی</span>
          <span className="font-medium text-gray-800">
            {gatewayStatus ? (STATUS_LABELS[gatewayStatus] ?? gatewayStatus) : '—'}
          </span>
        </div>
        {payment.gatewayTransactionId ? (
          <div className="flex justify-between gap-2">
            <span>شناسهٔ تراکنش (transactionId)</span>
            <span className="font-mono dir-ltr">{payment.gatewayTransactionId}</span>
          </div>
        ) : null}
      </div>

      {needsAttention ? (
        <p className="text-xs text-amber-700 leading-6">
          این پرداخت هنوز نهایی نشده. اگر مشتری پرداخت کرده ولی به سایت برنگشته (یا تسویه نیمه‌کاره
          مانده)، «تطبیق با اسنپ‌پی» را بزنید.
        </p>
      ) : null}

      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              run('status', async () => {
                const r = await snappPayService.getRemoteStatus(payment.id);
                return `وضعیت فعلی در اسنپ‌پی: ${STATUS_LABELS[r.status] ?? r.status}`;
              })
            }
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === 'status' ? <Loader2 className="inline animate-spin" size={12} /> : null} استعلام
            وضعیت
          </button>

          {!paid ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run('reconcile', async () => {
                  const r = await snappPayService.reconcile(payment.id);
                  return r.finalized
                    ? 'پرداخت در اسنپ‌پی تسویه شده بود و سفارش به «پرداخت‌شده» تغییر کرد'
                    : `وضعیت در اسنپ‌پی: ${STATUS_LABELS[r.status] ?? r.status} — پرداختی برای نهایی‌کردن وجود نداشت`;
                })
              }
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy === 'reconcile' ? <Loader2 className="inline animate-spin" size={12} /> : null}{' '}
              تطبیق با اسنپ‌پی
            </button>
          ) : null}

          {paid && !canceled ? (
            <>
              <button
                type="button"
                disabled={busy !== null || items.length === 0}
                onClick={openEdit}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                کاهش مبلغ / حذف اقلام
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmCancel(true)}
                className="px-3 py-1.5 rounded-lg border border-red-300 bg-white text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                لغو خرید و بازگشت وجه
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div className={`text-xs ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </div>
      ) : null}

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        isLoading={busy === 'cancel'}
        title="لغو خرید اسنپ‌پی"
        message="این کار برگشت‌ناپذیر است: خرید در اسنپ‌پی لغو و مبلغ به مشتری برگردانده می‌شود و سفارش «لغو شده» می‌شود. موجودی انبار به‌صورت خودکار برنمی‌گردد. ادامه می‌دهید؟"
        confirmText="بله، لغو شود"
        onConfirm={async () => {
          await run('cancel', async () => {
            await snappPayService.cancel(payment.id);
            return 'خرید در اسنپ‌پی لغو شد';
          });
          setConfirmCancel(false);
        }}
      />

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="کاهش مبلغ سفارش اسنپ‌پی">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-7">
            تعداد جدید هر آیتم را وارد کنید (۰ یعنی حذف آیتم). مبلغ جدید باید کمتر از مبلغ فعلی
            باشد. این عمل برگشت‌ناپذیر است و موجودی انبار به‌صورت خودکار برنمی‌گردد.
          </p>
          <div className="space-y-2">
            {items.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-2"
              >
                <span className="text-sm text-gray-800 flex-1">{i.title}</span>
                <span className="text-xs text-gray-500">از {i.quantity}</span>
                <input
                  type="number"
                  min={0}
                  max={i.quantity}
                  value={quantities[i.id] ?? i.quantity}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [i.id]: Math.max(0, Math.min(i.quantity, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm dir-ltr"
                />
              </div>
            ))}
          </div>
          {allRemoved ? (
            <p className="text-xs text-red-600">
              برای حذف همهٔ آیتم‌ها از «لغو خرید و بازگشت وجه» استفاده کنید.
            </p>
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={changedItems.length === 0 || allRemoved}
              onClick={() => setConfirmEdit(true)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50"
            >
              ادامه
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmEdit}
        onClose={() => setConfirmEdit(false)}
        isLoading={busy === 'update'}
        type="warning"
        title="تأیید کاهش مبلغ"
        message="مبلغ خرید در اسنپ‌پی کم می‌شود و این کار قابل بازگشت نیست. مطمئن هستید؟"
        confirmText="بله، اعمال شود"
        onConfirm={async () => {
          await run('update', async () => {
            const r = await snappPayService.updateOrder(
              payment.id,
              changedItems.map((i) => ({ orderItemId: i.id, quantity: quantities[i.id] ?? i.quantity })),
            );
            setEditOpen(false);
            return `مبلغ جدید ثبت شد: ${new Intl.NumberFormat('fa-IR').format(Math.round(r.payableAmount))} تومان`;
          });
          setConfirmEdit(false);
        }}
      />
    </div>
  );
};
