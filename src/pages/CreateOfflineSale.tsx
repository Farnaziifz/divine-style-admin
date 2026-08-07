import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import { Select } from '../components/common/Select';
import { productService, type Product } from '../services/product.service';
import {
  offlineSaleService,
  type CreateOfflineSaleItemPayload,
} from '../services/offlineSale.service';

const DEBOUNCE_MS = 350;

const formatPrice = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
};

interface SaleItemRow extends CreateOfflineSaleItemPayload {
  key: string;
  title: string;
  variantLabel: string;
}

/** جستجوی محصول و انتخاب یک آیتم (تک‌انتخابی) — برای افزودن به سبد فروش دستی */
function ProductSearchField({
  onSelect,
}: {
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchProducts = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const res = await productService.getAll({ search, limit: 30 });
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchProducts(debouncedQuery);
  }, [debouncedQuery, open, fetchProducts]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between gap-2 text-right hover:border-gray-300 transition-colors"
      >
        <span className="text-gray-400 text-sm truncate">جستجو و انتخاب محصول…</span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[1000] top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="نام محصول…"
              className="flex-1 min-w-0 py-2 px-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-zafting-accent" size={28} />
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">موردی یافت نشد</div>
            ) : (
              results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors hover:bg-gray-50 text-gray-800"
                >
                  <span className="truncate">{p.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CreateOfflineSale = () => {
  const navigate = useNavigate();

  const [channel, setChannel] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [note, setNote] = useState('');

  const [items, setItems] = useState<SaleItemRow[]>([]);

  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickProduct = (product: Product) => {
    setPickedProduct(product);
    setVariantId(product.variants?.[0]?.id ?? '');
    setUnitPrice(String(product.discountPrice ?? product.finalPrice ?? 0));
    setQuantity('1');
  };

  const handleAddItem = () => {
    if (!pickedProduct || !variantId) return;
    const variant = pickedProduct.variants?.find((v) => v.id === variantId);
    const safeVariantId = variant?.id;
    if (!variant || !safeVariantId) return;
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!Number.isFinite(qty) || qty < 1) return;
    if (!Number.isFinite(price) || price < 0) return;

    const variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku;

    setItems((prev) => [
      ...prev,
      {
        key: `${safeVariantId}-${Date.now()}`,
        productId: pickedProduct.id,
        productVariantId: safeVariantId,
        title: pickedProduct.title,
        variantLabel,
        quantity: qty,
        unitPrice: price,
      },
    ]);

    setPickedProduct(null);
    setVariantId('');
    setQuantity('1');
    setUnitPrice('');
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const summary = useMemo(() => {
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discount = Math.min(Number(discountAmount) || 0, totalAmount);
    const payableAmount = totalAmount - discount;
    const commission = Number(commissionPercent) || 0;
    const commissionAmount = commission ? (payableAmount * commission) / 100 : 0;
    const netAmount = payableAmount - commissionAmount;
    return { totalAmount, discount, payableAmount, commissionAmount, netAmount };
  }, [items, discountAmount, commissionPercent]);

  const handleSubmit = async () => {
    setError(null);
    if (!channel.trim()) {
      setError('محل فروش را وارد کنید');
      return;
    }
    if (items.length === 0) {
      setError('حداقل یک محصول به فروش اضافه کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      await offlineSaleService.create({
        channel: channel.trim(),
        commissionPercent: commissionPercent ? Number(commissionPercent) : undefined,
        discountAmount: discountAmount ? Number(discountAmount) : undefined,
        note: note.trim() || undefined,
        items: items.map(({ productId, productVariantId, quantity: qty, unitPrice: price }) => ({
          productId,
          productVariantId,
          quantity: qty,
          unitPrice: price,
        })),
      });
      navigate('/offline-sales');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setError(
        Array.isArray(message) ? message.join('، ') : message || 'خطا در ثبت فروش',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-[#2A2A2A]">ثبت فروش حضوری / اینستا</h1>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-gray-800">افزودن محصول</h2>
        <ProductSearchField onSelect={handlePickProduct} />

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
                    label: [v.size, v.color].filter(Boolean).join(' / ') || v.sku,
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
              onClick={handleAddItem}
              disabled={!variantId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zafting-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus size={18} />
              افزودن به لیست
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-3 py-2 text-right">محصول</th>
                  <th className="px-3 py-2 text-right">تعداد</th>
                  <th className="px-3 py-2 text-right">قیمت واحد</th>
                  <th className="px-3 py-2 text-right">جمع</th>
                  <th className="px-3 py-2"></th>
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
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
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
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-gray-800">اطلاعات فروش</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              محل فروش (اینستاگرام، حضوری، ایونت...)
            </label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="مثلاً: اینستاگرام یا ایونت تجریش"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              درصد کمیسیون محل فروش (اختیاری)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="مثلاً 20"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مبلغ تخفیف (تومان، اختیاری)
            </label>
            <input
              type="number"
              min={0}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              یادداشت (اختیاری)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-2">
        <h2 className="font-bold text-gray-800 mb-2">خلاصه</h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">جمع فروش</span>
          <span className="text-gray-900">{formatPrice(summary.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">تخفیف</span>
          <span className="text-gray-900">{formatPrice(summary.discount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">کمیسیون</span>
          <span className="text-gray-900">{formatPrice(summary.commissionAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2 mt-2">
          <span className="text-gray-900">مبلغ خالص</span>
          <span className="text-zafting-accent">{formatPrice(summary.netAmount)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/offline-sales')}
          className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zafting-accent text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="animate-spin" size={18} />}
          ثبت فروش
        </button>
      </div>
    </div>
  );
};

export default CreateOfflineSale;
