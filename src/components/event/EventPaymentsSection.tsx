import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, Receipt, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { ProductSearchField } from '../common/ProductSearchField';
import type { Product } from '../../services/product.service';
import {
  eventPaymentAdminService,
  type EventPaymentRow,
  type EventPaymentStatus,
} from '../../services/event.service';

const PAGE_SIZE = 20;

type PaymentFilter = 'ALL' | EventPaymentStatus | 'UNASSIGNED';

const FILTER_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'ALL', label: 'همه تراکنش‌ها' },
  { value: 'PAID', label: 'موفق' },
  { value: 'UNASSIGNED', label: 'موفق و تعیین‌تکلیف‌نشده' },
  { value: 'FAILED', label: 'ناموفق' },
  { value: 'INITIATED', label: 'در انتظار پرداخت' },
];

const STATUS_BADGE: Record<EventPaymentStatus, { label: string; className: string }> = {
  PAID: { label: 'موفق', className: 'bg-green-100 text-green-700' },
  FAILED: { label: 'ناموفق', className: 'bg-red-100 text-red-700' },
  INITIATED: { label: 'در انتظار پرداخت', className: 'bg-gray-100 text-gray-600' },
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fa-IR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

interface DraftItem {
  key: string;
  productId: string;
  productVariantId: string;
  title: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
}

const toDraft = (payment: EventPaymentRow): DraftItem[] =>
  payment.items.map((i) => ({
    key: i.id,
    productId: i.productId,
    productVariantId: i.productVariantId,
    title: i.title,
    variantLabel: i.sku,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));

function AssignModal({
  eventId,
  payment,
  onClose,
  onSaved,
}: {
  eventId: string;
  payment: EventPaymentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!payment) return;
    setItems(toDraft(payment));
    setPickedProduct(null);
    setVariantId('');
    setQuantity('1');
    setUnitPrice('');
    setError(null);
  }, [payment]);

  const itemsTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items],
  );

  const handlePick = (product: Product) => {
    setPickedProduct(product);
    setVariantId(product.variants?.[0]?.id ?? '');
    setUnitPrice(String(product.discountPrice ?? product.finalPrice ?? 0));
    setQuantity('1');
  };

  const handleAdd = () => {
    if (!pickedProduct) return;
    const variant = pickedProduct.variants?.find((v) => v.id === variantId);
    if (!variant?.id) return;
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!Number.isInteger(qty) || qty < 1 || !Number.isFinite(price) || price < 0) return;

    const label = [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku;
    setItems((prev) => {
      const existing = prev.find((i) => i.productVariantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.productVariantId === variant.id ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [
        ...prev,
        {
          key: `${variant.id}-${Date.now()}`,
          productId: pickedProduct.id,
          productVariantId: variant.id!,
          title: pickedProduct.title,
          variantLabel: label,
          quantity: qty,
          unitPrice: price,
        },
      ];
    });
    setPickedProduct(null);
    setVariantId('');
    setQuantity('1');
    setUnitPrice('');
  };

  const handleSave = async () => {
    if (!payment) return;
    setSaving(true);
    setError(null);
    try {
      await eventPaymentAdminService.assignItems(
        eventId,
        payment.id,
        items.map(({ productId, productVariantId, quantity: q, unitPrice: p }) => ({
          productId,
          productVariantId,
          quantity: q,
          unitPrice: p,
        })),
      );
      onSaved();
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message;
      setError(Array.isArray(message) ? message.join('، ') : message || 'خطا در ثبت اقلام');
    } finally {
      setSaving(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="تعیین تکلیف پرداخت"
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="text-gray-500">خریدار: </span>
            <span dir="ltr">{payment.user.mobile}</span>
            {payment.user.name ? ` (${payment.user.name})` : ''}
          </span>
          <span>
            <span className="text-gray-500">مبلغ پرداختی: </span>
            <b>{formatPrice(payment.amount)}</b>
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        <ProductSearchField onSelect={handlePick} />

        {pickedProduct && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <div className="text-sm font-medium text-gray-800">{pickedProduct.title}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="سایز / رنگ"
                value={variantId}
                onChange={(e) => setVariantId(String(e.target.value))}
                options={(pickedProduct.variants ?? [])
                  .filter((v): v is typeof v & { id: string } => !!v.id)
                  .map((v) => ({
                    label:
                      ([v.size, v.color].filter(Boolean).join(' / ') || v.sku) +
                      ` (موجودی ${v.stock})`,
                    value: v.id,
                    className: v.stock <= 0 ? 'text-red-500' : undefined,
                  }))}
                placeholder="انتخاب واریانت"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تعداد</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  قیمت واحد (تومان)
                </label>
                <input
                  type="number"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!variantId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zafting-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={18} />
              افزودن به لیست
            </button>
          </div>
        )}

        {items.length > 0 ? (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-3 py-2 text-right">محصول</th>
                  <th className="px-3 py-2 text-right">تعداد</th>
                  <th className="px-3 py-2 text-right">قیمت واحد</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.key}>
                    <td className="px-3 py-2 text-gray-900">
                      {item.title}
                      <span className="text-gray-400 text-xs"> ({item.variantLabel})</span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-2 text-gray-700">{formatPrice(item.unitPrice)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        aria-label="حذف"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">هنوز قلمی اضافه نشده</p>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>جمع اقلام</span>
            <span>{formatPrice(itemsTotal)}</span>
          </div>
          {itemsTotal > 0 && itemsTotal !== payment.amount && (
            <p className="text-amber-600">
              جمع اقلام با مبلغ پرداختی برابر نیست؛ مبلغ پرداختی در گزارش‌ها ملاک است.
            </p>
          )}
          <p>
            با ذخیره، موجودی اقلام از سایت کم می‌شود. ذخیرهٔ دوباره، موجودی قبلی را برمی‌گرداند و
            از اول کم می‌کند؛ لیست خالی یعنی برگرداندن موجودی.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zafting-accent text-white font-bold hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="animate-spin" size={18} />}
            ذخیره و کسر از موجودی
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function EventPaymentsSection({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<EventPaymentRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<PaymentFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<EventPaymentRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventPaymentAdminService.list(eventId, {
        page,
        limit: PAGE_SIZE,
        status: filter === 'ALL' || filter === 'UNASSIGNED' ? undefined : filter,
        unassignedOnly: filter === 'UNASSIGNED' || undefined,
      });
      setRows(res.data);
      setLastPage(res.meta.lastPage);
      setTotal(res.meta.total);
    } catch (e) {
      console.error(e);
      setError('خطا در دریافت پرداخت‌ها');
    } finally {
      setLoading(false);
    }
  }, [eventId, page, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-zafting-text flex items-center gap-2">
          <Receipt size={18} className="text-zafting-accent" />
          تراکنش‌های ایونت
          <span className="text-xs font-normal text-gray-400">({total})</span>
        </h3>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as PaymentFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-zafting-accent bg-white"
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-zafting-accent" size={28} />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">پرداختی یافت نشد</p>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-3 py-2 text-right">خریدار</th>
                <th className="px-3 py-2 text-right">مبلغ</th>
                <th className="px-3 py-2 text-right">وضعیت</th>
                <th className="px-3 py-2 text-right">زمان</th>
                <th className="px-3 py-2 text-right">اقلام</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <div dir="ltr" className="text-right">
                      {p.user.mobile}
                    </div>
                    {p.user.name && <div className="text-xs text-gray-400">{p.user.name}</div>}
                  </td>
                  <td className="px-3 py-2 font-medium">{formatPrice(p.amount)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[p.status].className}`}
                    >
                      {STATUS_BADGE[p.status].label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {formatDateTime(p.verifiedAt ?? p.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    {p.isAssigned ? (
                      <div className="space-y-0.5">
                        {p.items.map((i) => (
                          <div key={i.id} className="text-gray-700">
                            {i.title}
                            <span className="text-gray-400 text-xs">
                              {' '}
                              ({i.sku}) × {i.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : p.status === 'PAID' ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        تعیین تکلیف نشده
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-left">
                    {p.status === 'PAID' && (
                      <button
                        type="button"
                        onClick={() => setActive(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zafting-accent bg-zafting-accent/10 hover:bg-zafting-accent/20"
                      >
                        {p.isAssigned && <Check size={14} />}
                        {p.isAssigned ? 'ویرایش' : 'تعیین تکلیف'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="text-gray-500">
            {page} از {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      )}

      <AssignModal
        eventId={eventId}
        payment={active}
        onClose={() => setActive(null)}
        onSaved={() => void load()}
      />
    </div>
  );
}
