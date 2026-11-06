import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { OrderChangeImpact, OrderDetails, OrderItem } from '../../services/order.service';

const fmt = (n: number) => new Intl.NumberFormat('fa-IR').format(Math.round(n)) + ' تومان';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#6B5B54] transition-all';

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message ?? 'خطا در انجام عملیات';
const asText = (m: string | string[]) => (Array.isArray(m) ? m.join('، ') : m);

function ReturnToStock({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Actions({
  onClose,
  onSubmit,
  loading,
  submitText,
  danger,
}: {
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitText: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onClose}
        disabled={loading}
        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50"
      >
        انصراف
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70 ${
          danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6B5B54] hover:bg-[#5a4b45]'
        }`}
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        {submitText}
      </button>
    </div>
  );
}

/** یادآوری اینکه برگرداندن پول خودکار نیست و فقط برای سفارش‌های پرداخت‌شده نمایش داده می‌شود */
function PaidNotice() {
  return (
    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>
        این سفارش پرداخت شده است. مبالغ سفارش و گزارش‌های فروش/سود اصلاح می‌شوند، اما برگرداندن پول به مشتری
        خودکار نیست؛ مبلغ قابل بازپرداخت بعد از ثبت نمایش داده می‌شود.
      </span>
    </div>
  );
}

export function ImpactBanner({ impact, onClose }: { impact: OrderChangeImpact; onClose: () => void }) {
  const needsRefund = impact.gatewayRefundDue > 0 || impact.walletRefundDue > 0;
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        needsRefund ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold">تغییرات ثبت شد</div>
          <div>
            قابل پرداخت: {fmt(impact.previous.payableAmount)} ← {fmt(impact.current.payableAmount)}
          </div>
          {impact.gatewayRefundDue > 0 && (
            <div className="font-bold">
              مبلغ قابل بازپرداخت به مشتری (درگاه/کارت): {fmt(impact.gatewayRefundDue)}
            </div>
          )}
          {impact.walletRefundDue > 0 && (
            <div className="font-bold">مبلغ قابل بازگشت به کیف پول مشتری: {fmt(impact.walletRefundDue)}</div>
          )}
          {impact.warnings.map((w) => (
            <div key={w} className="text-xs">
              ⚠ {w}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="text-xs underline shrink-0">
          بستن
        </button>
      </div>
    </div>
  );
}

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (impact: OrderChangeImpact) => void;
}

export function EditItemModal({
  isOpen,
  onClose,
  onDone,
  order,
  item,
  run,
}: BaseProps & {
  order: OrderDetails;
  item: OrderItem | null;
  run: (data: {
    quantity?: number;
    unitPrice?: number;
    unitDiscountPrice?: number | null;
    returnToStock?: boolean;
  }) => Promise<OrderChangeImpact>;
}) {
  if (!item) return null;
  return (
    <EditItemForm
      key={item.id}
      isOpen={isOpen}
      onClose={onClose}
      onDone={onDone}
      order={order}
      item={item}
      run={run}
    />
  );
}

function EditItemForm({
  isOpen,
  onClose,
  onDone,
  order,
  item,
  run,
}: BaseProps & {
  order: OrderDetails;
  item: OrderItem;
  run: (data: {
    quantity?: number;
    unitPrice?: number;
    unitDiscountPrice?: number | null;
    returnToStock?: boolean;
  }) => Promise<OrderChangeImpact>;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState(String(item.unitPrice));
  const [unitDiscountPrice, setUnitDiscountPrice] = useState(
    item.unitDiscountPrice != null ? String(item.unitDiscountPrice) : '',
  );
  const [returnToStock, setReturnToStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantity);
  const qtyChanged = Number.isInteger(qty) && qty !== item.quantity;

  const submit = async () => {
    setError(null);
    if (!Number.isInteger(qty) || qty < 1) return setError('تعداد باید عدد صحیح و حداقل ۱ باشد');
    const price = Number(unitPrice);
    if (!Number.isFinite(price) || price < 0) return setError('قیمت واحد نامعتبر است');
    const discount = unitDiscountPrice.trim() === '' ? null : Number(unitDiscountPrice);
    if (discount !== null && (!Number.isFinite(discount) || discount < 0)) {
      return setError('قیمت بعد از تخفیف نامعتبر است');
    }
    setLoading(true);
    try {
      const impact = await run({
        quantity: qty,
        unitPrice: price,
        unitDiscountPrice: discount,
        returnToStock: qtyChanged ? returnToStock : undefined,
      });
      onDone(impact);
    } catch (e) {
      setError(asText(errMsg(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ویرایش آیتم سفارش">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {item.title} <span className="font-mono text-xs text-gray-400 dir-ltr">{item.sku}</span>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">تعداد</label>
          <input className={inputCls} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">قیمت واحد (تومان)</label>
            <input className={inputCls} inputMode="numeric" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">قیمت بعد از تخفیف (اختیاری)</label>
            <input
              className={inputCls}
              inputMode="numeric"
              value={unitDiscountPrice}
              onChange={(e) => setUnitDiscountPrice(e.target.value)}
              placeholder="بدون تخفیف"
            />
          </div>
        </div>
        {qtyChanged && (
          <ReturnToStock
            checked={returnToStock}
            onChange={setReturnToStock}
            label={
              qty < item.quantity
                ? `${item.quantity - qty} عدد کم‌شده به موجودی انبار برگردد`
                : `${qty - item.quantity} عدد اضافه از موجودی انبار کم شود`
            }
          />
        )}
        <div className="text-xs text-gray-500">
          تخفیف سفارش، ارسال و بسته‌بندی ثابت می‌مانند (از «ویرایش مبالغ» قابل تغییرند).
        </div>
        {order.paymentStatus === 'PAID' && <PaidNotice />}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Actions onClose={onClose} onSubmit={submit} loading={loading} submitText="ذخیره" />
      </div>
    </Modal>
  );
}

export function DeleteItemModal({
  isOpen,
  onClose,
  onDone,
  order,
  item,
  run,
}: BaseProps & {
  order: OrderDetails;
  item: OrderItem | null;
  run: (returnToStock: boolean) => Promise<OrderChangeImpact>;
}) {
  const [returnToStock, setReturnToStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!item) return null;

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      onDone(await run(returnToStock));
    } catch (e) {
      setError(asText(errMsg(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="حذف آیتم از سفارش">
      <div className="space-y-4">
        <p className="text-gray-700">
          «{item.title}» ({item.quantity} عدد) از سفارش حذف می‌شود و جمع و مبلغ قابل پرداخت دوباره محاسبه می‌شود.
        </p>
        <ReturnToStock
          checked={returnToStock}
          onChange={setReturnToStock}
          label={`${item.quantity} عدد به موجودی انبار برگردد`}
        />
        {order.paymentStatus === 'PAID' && <PaidNotice />}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Actions onClose={onClose} onSubmit={submit} loading={loading} submitText="حذف آیتم" danger />
      </div>
    </Modal>
  );
}

export function EditAmountsModal({
  isOpen,
  onClose,
  onDone,
  order,
  run,
}: BaseProps & {
  order: OrderDetails;
  run: (data: { discountAmount: number; shippingCost: number; packagingCost: number }) => Promise<OrderChangeImpact>;
}) {
  const [discount, setDiscount] = useState(String(order.discountAmount ?? 0));
  const [shipping, setShipping] = useState(String(order.shippingCost ?? 0));
  const [packaging, setPackaging] = useState(String(order.packagingCost ?? 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const d = Number(discount);
    const s = Number(shipping);
    const p = Number(packaging);
    if ([d, s, p].some((n) => !Number.isFinite(n) || n < 0)) return setError('مبالغ باید عدد معتبر و غیرمنفی باشند');
    setLoading(true);
    try {
      onDone(await run({ discountAmount: d, shippingCost: s, packagingCost: p }));
    } catch (e) {
      setError(asText(errMsg(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ویرایش مبالغ سفارش">
      <div className="space-y-4">
        {[
          ['تخفیف سفارش (تومان)', discount, setDiscount],
          ['هزینهٔ ارسال (تومان)', shipping, setShipping],
          ['هزینهٔ بسته‌بندی (تومان)', packaging, setPackaging],
        ].map(([label, value, set]) => (
          <div key={label as string}>
            <label className="block text-sm text-gray-700 mb-1">{label as string}</label>
            <input
              className={inputCls}
              inputMode="numeric"
              value={value as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
            />
          </div>
        ))}
        {order.paymentStatus === 'PAID' && <PaidNotice />}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Actions onClose={onClose} onSubmit={submit} loading={loading} submitText="ذخیره" />
      </div>
    </Modal>
  );
}

export function DeleteOrderModal({
  isOpen,
  onClose,
  onDone,
  order,
  run,
}: BaseProps & {
  order: OrderDetails;
  run: (returnToStock: boolean) => Promise<OrderChangeImpact>;
}) {
  const [returnToStock, setReturnToStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const holdsStock = order.paymentStatus !== 'FAILED';

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      onDone(await run(returnToStock));
    } catch (e) {
      setError(asText(errMsg(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="حذف کامل سفارش">
      <div className="space-y-4">
        <p className="text-gray-700">
          سفارش <span className="font-mono dir-ltr">{order.orderCode}</span> به‌طور کامل حذف می‌شود و از گزارش‌های
          فروش و سود کنار می‌رود. این کار قابل بازگشت نیست.
        </p>
        {holdsStock ? (
          <ReturnToStock
            checked={returnToStock}
            onChange={setReturnToStock}
            label="تعداد همهٔ آیتم‌ها به موجودی انبار برگردد"
          />
        ) : (
          <div className="text-xs text-gray-500">موجودی این سفارش قبلاً آزاد شده است و دوباره تغییر نمی‌کند.</div>
        )}
        {order.paymentStatus === 'PAID' && <PaidNotice />}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Actions onClose={onClose} onSubmit={submit} loading={loading} submitText="حذف سفارش" danger />
      </div>
    </Modal>
  );
}
