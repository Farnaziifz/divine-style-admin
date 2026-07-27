import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, Plus, Settings2, Truck, Edit2, Trash2, Power } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  shippingMethodService,
  type ShippingMethod,
} from '../../services/shippingMethod.service';
import api from '../../services/api';

const tabs = [
  { key: 'shipping', label: 'تنظیمات ارسال', icon: Truck },
  { key: 'general', label: 'عمومی', icon: Settings2 },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const getAuthContext = () => {
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw
      ? (JSON.parse(raw) as { role?: string; permissions?: string[] })
      : null;
    const role = parsed?.role ?? null;
    const permissions = Array.isArray(parsed?.permissions) ? parsed?.permissions : [];
    return { role, permissions };
  } catch {
    return { role: null, permissions: [] as string[] };
  }
};

const canManageSiteSettings = (auth: { role: string | null; permissions: string[] }) =>
  auth.role === 'ADMIN' ||
  (auth.role === 'OPERATOR' && auth.permissions.includes('SITE_SETTINGS_MANAGE'));

const formatPriceToman = (value: number) => value.toLocaleString('fa-IR');

const parsePriceInput = (input: string): number | null => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let normalized = input.replace(/[^\d۰-۹]/g, '');
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(persianDigits[i], 'g'), String(i));
  }
  if (!normalized) return null;
  const n = Number.parseInt(normalized, 10);
  return Number.isFinite(n) ? n : null;
};

const SiteSettings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useMemo(() => getAuthContext(), []);

  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'shipping';
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabs.some((t) => t.key === initialTab) ? initialTab : 'shipping',
  );

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isAddShippingOpen, setIsAddShippingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isSavingNewShipping, setIsSavingNewShipping] = useState(false);
  const [editTarget, setEditTarget] = useState<ShippingMethod | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [otpProvider, setOtpProvider] = useState<'ussdpanel' | 'sms_ir'>(
    'ussdpanel',
  );
  const [otpProviderLoading, setOtpProviderLoading] = useState(false);
  const [otpProviderSaving, setOtpProviderSaving] = useState(false);
  const [otpProviderError, setOtpProviderError] = useState<string | null>(null);

  const [paymentActiveProviders, setPaymentActiveProviders] = useState<
    Array<'ZARINPAL' | 'ZIBAL'>
  >(['ZARINPAL']);
  const [paymentDefaultProvider, setPaymentDefaultProvider] = useState<
    'ZARINPAL' | 'ZIBAL'
  >('ZARINPAL');
  const [paymentProvidersLoading, setPaymentProvidersLoading] = useState(false);
  const [paymentProvidersSaving, setPaymentProvidersSaving] = useState(false);
  const [paymentProvidersError, setPaymentProvidersError] = useState<string | null>(
    null,
  );

  const [packagingCost, setPackagingCost] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const fetchShippingMethods = useCallback(async () => {
    setShippingLoading(true);
    setShippingError(null);
    try {
      const list = await shippingMethodService.getAll();
      setShippingMethods(list);
    } catch {
      setShippingError('خطا در دریافت لیست روش‌های ارسال');
      setShippingMethods([]);
    } finally {
      setShippingLoading(false);
    }
  }, []);

  const fetchOtpProvider = useCallback(async () => {
    setOtpProviderLoading(true);
    setOtpProviderError(null);
    try {
      const { data } = await api.get<{
        provider: 'ussdpanel' | 'sms_ir';
        options: Array<'ussdpanel' | 'sms_ir'>;
      }>('/site-settings/otp-provider');
      setOtpProvider(data.provider);
    } catch {
      setOtpProviderError('خطا در دریافت تنظیمات سرویس OTP');
    } finally {
      setOtpProviderLoading(false);
    }
  }, []);

  const fetchPaymentProviders = useCallback(async () => {
    setPaymentProvidersLoading(true);
    setPaymentProvidersError(null);
    try {
      const { data } = await api.get<{
        options: Array<'ZARINPAL' | 'ZIBAL'>;
        activeProviders: Array<'ZARINPAL' | 'ZIBAL'>;
        defaultProvider: 'ZARINPAL' | 'ZIBAL';
      }>('/site-settings/payment-providers');
      setPaymentActiveProviders(data.activeProviders);
      setPaymentDefaultProvider(data.defaultProvider);
    } catch {
      setPaymentProvidersError('خطا در دریافت تنظیمات درگاه‌های پرداخت');
    } finally {
      setPaymentProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageSiteSettings(auth)) return;
    if (activeTab !== 'shipping') return;
    fetchShippingMethods();
  }, [activeTab, auth, fetchShippingMethods]);

  const fetchPricingSettings = useCallback(async () => {
    setPricingLoading(true);
    setPricingError(null);
    try {
      const { data } = await api.get<{ packagingCost: number; taxPercent: number }>(
        '/site-settings/pricing',
      );
      setPackagingCost(String(data.packagingCost ?? 0));
      setTaxPercent(String(data.taxPercent ?? 0));
    } catch {
      setPricingError('خطا در دریافت تنظیمات قیمت‌گذاری');
    } finally {
      setPricingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageSiteSettings(auth)) return;
    if (activeTab !== 'general') return;
    fetchOtpProvider();
    fetchPaymentProviders();
    fetchPricingSettings();
  }, [activeTab, auth, fetchOtpProvider, fetchPaymentProviders, fetchPricingSettings]);

  if (!canManageSiteSettings(auth)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-600">شما به تنظیمات سایت دسترسی ندارید.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zafting-accent/10 text-zafting-accent flex items-center justify-center">
            <Settings2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">تنظیمات سایت</h1>
            <p className="text-sm text-gray-500">تنظیمات کلی و بخش‌های قابل پیکربندی</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings/profile')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
        >
          <ArrowRight size={18} />
          بازگشت
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex gap-2 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setSearchParams({ tab: t.key });
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-zafting-accent text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'shipping' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#2A2A2A]">تنظیمات ارسال</h2>
              <p className="text-sm text-gray-500 mt-2">
                روش‌های ارسال را تعریف کنید تا در سایت نمایش داده شوند.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddShippingOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} />
              افزودن روش ارسال
            </button>
          </div>

          {shippingError ? (
            <div className="mt-4 text-sm text-red-600">{shippingError}</div>
          ) : null}

          {shippingLoading ? (
            <div className="mt-8 flex items-center justify-center text-gray-500">
              <Loader2 className="animate-spin" size={20} />
              <span className="ms-2 text-sm">در حال دریافت...</span>
            </div>
          ) : shippingMethods.length === 0 ? (
            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-6 text-gray-600 text-sm">
              هنوز روشی برای ارسال ثبت نشده است.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shippingMethods.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/70 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#2A2A2A] truncate">
                        {m.title}
                      </h3>
                      {m.description ? (
                        <p className="text-sm text-gray-600 mt-2 leading-7">
                          {m.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-2">
                          بدون توضیح
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                          m.isActive
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {m.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                      <button
                        type="button"
                        title={m.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                        onClick={async () => {
                          const updated = await shippingMethodService.toggle(m.id);
                          setShippingMethods((prev) =>
                            prev.map((x) => (x.id === m.id ? updated : x)),
                          );
                        }}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="ویرایش"
                        onClick={() => setEditTarget(m)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        title="حذف"
                        onClick={() => {
                          setEditTarget(m);
                          setIsDeleteOpen(true);
                        }}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-xs text-gray-400">قیمت</span>
                    {typeof m.price === 'number' ? (
                      <span className="text-sm text-gray-800">
                        {formatPriceToman(m.price)} تومان
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">اختیاری</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#2A2A2A]">عمومی</h2>
          <p className="text-sm text-gray-500 mt-2">
            تنظیمات عمومی سایت و سرویس‌های مورد استفاده.
          </p>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/70 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#2A2A2A]">سرویس ارسال OTP</h3>
                <p className="text-sm text-gray-600 mt-2 leading-7">
                  سرویس پیش‌فرض: USSD Panel (ارسال OTP با پیامک خدماتی). امکان سوییچ به
                  sms.ir هم وجود دارد.
                </p>
              </div>
            </div>

            {otpProviderError ? (
              <div className="mt-4 text-sm text-red-600">{otpProviderError}</div>
            ) : null}

            {otpProviderLoading ? (
              <div className="mt-6 flex items-center text-gray-500">
                <Loader2 className="animate-spin" size={20} />
                <span className="ms-2 text-sm">در حال دریافت...</span>
              </div>
            ) : (
              <div className="mt-6 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    انتخاب سرویس
                  </label>
                  <select
                    value={otpProvider}
                    onChange={(e) =>
                      setOtpProvider(e.target.value as 'ussdpanel' | 'sms_ir')
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent bg-white"
                  >
                    <option value="ussdpanel">USSD Panel (پیش‌فرض)</option>
                    <option value="sms_ir">sms.ir</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={otpProviderSaving}
                  onClick={async () => {
                    setOtpProviderSaving(true);
                    setOtpProviderError(null);
                    try {
                      await api.patch('/site-settings/otp-provider', {
                        provider: otpProvider,
                      });
                    } catch {
                      setOtpProviderError('خطا در ذخیره تنظیمات سرویس OTP');
                    } finally {
                      setOtpProviderSaving(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {otpProviderSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : null}
                  ذخیره
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/70 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#2A2A2A]">درگاه پرداخت</h3>
                <p className="text-sm text-gray-600 mt-2 leading-7">
                  درگاه‌های فعال را انتخاب کنید و یک درگاه را به عنوان پیش‌فرض تعیین
                  کنید.
                </p>
              </div>
            </div>

            {paymentProvidersError ? (
              <div className="mt-4 text-sm text-red-600">
                {paymentProvidersError}
              </div>
            ) : null}

            {paymentProvidersLoading ? (
              <div className="mt-6 flex items-center text-gray-500">
                <Loader2 className="animate-spin" size={20} />
                <span className="ms-2 text-sm">در حال دریافت...</span>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    { key: 'ZARINPAL', label: 'زرین‌پال' },
                    { key: 'ZIBAL', label: 'زیبال' },
                  ] as const).map((p) => {
                    const isActive = paymentActiveProviders.includes(p.key);
                    const isDefault = paymentDefaultProvider === p.key;
                    const disableUncheck =
                      isActive && paymentActiveProviders.length === 1;
                    return (
                      <div
                        key={p.key}
                        className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isActive}
                            disabled={paymentProvidersSaving || disableUncheck}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPaymentActiveProviders((prev) => {
                                const next = checked
                                  ? Array.from(new Set([...prev, p.key]))
                                  : prev.filter((x) => x !== p.key);
                                if (next.length === 0) return prev;
                                return next;
                              });
                              if (!checked && isDefault) {
                                setPaymentDefaultProvider('ZARINPAL');
                              }
                              if (checked && !isActive) {
                                setPaymentDefaultProvider((prev) =>
                                  prev ? prev : p.key,
                                );
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium text-gray-800">
                            {p.label}
                          </span>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="radio"
                            name="paymentDefaultProvider"
                            checked={isDefault}
                            disabled={!isActive || paymentProvidersSaving}
                            onChange={() => setPaymentDefaultProvider(p.key)}
                          />
                          پیش‌فرض
                        </label>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={paymentProvidersSaving || paymentActiveProviders.length === 0}
                  onClick={async () => {
                    setPaymentProvidersSaving(true);
                    setPaymentProvidersError(null);
                    try {
                      const active = paymentActiveProviders.length
                        ? paymentActiveProviders
                        : (['ZARINPAL'] as Array<'ZARINPAL' | 'ZIBAL'>);
                      const defaultProvider = active.includes(paymentDefaultProvider)
                        ? paymentDefaultProvider
                        : active[0];
                      await api.patch('/site-settings/payment-providers', {
                        activeProviders: active,
                        defaultProvider,
                      });
                      setPaymentActiveProviders(active);
                      setPaymentDefaultProvider(defaultProvider);
                    } catch {
                      setPaymentProvidersError('خطا در ذخیره تنظیمات درگاه‌های پرداخت');
                    } finally {
                      setPaymentProvidersSaving(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {paymentProvidersSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : null}
                  ذخیره
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/70 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#2A2A2A]">قیمت‌گذاری</h3>
                <p className="text-sm text-gray-600 mt-2 leading-7">
                  هزینه بسته‌بندی و درصد مالیات به‌صورت سراسری در محاسبهٔ قیمت نهایی همهٔ
                  محصولات اعمال می‌شود. ضریب سود هر محصول از دسته‌بندی آن گرفته می‌شود.
                </p>
              </div>
            </div>

            {pricingError ? (
              <div className="mt-4 text-sm text-red-600">{pricingError}</div>
            ) : null}

            {pricingLoading ? (
              <div className="mt-6 flex items-center text-gray-500">
                <Loader2 className="animate-spin" size={20} />
                <span className="ms-2 text-sm">در حال دریافت...</span>
              </div>
            ) : (
              <div className="mt-6 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    هزینه بسته‌بندی (تومان)
                  </label>
                  <input
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                    inputMode="numeric"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
                    placeholder="مثال: 50000"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    درصد مالیات
                  </label>
                  <input
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    inputMode="numeric"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
                    placeholder="مثال: 10"
                  />
                </div>

                <button
                  type="button"
                  disabled={pricingSaving}
                  onClick={async () => {
                    const parsedPackaging = parsePriceInput(packagingCost) ?? 0;
                    const parsedTax = parsePriceInput(taxPercent) ?? 0;
                    setPricingSaving(true);
                    setPricingError(null);
                    try {
                      await api.patch('/site-settings/pricing', {
                        packagingCost: parsedPackaging,
                        taxPercent: parsedTax,
                      });
                      setPackagingCost(String(parsedPackaging));
                      setTaxPercent(String(parsedTax));
                    } catch {
                      setPricingError('خطا در ذخیره تنظیمات قیمت‌گذاری');
                    } finally {
                      setPricingSaving(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pricingSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : null}
                  ذخیره
                </button>
              </div>
            )}
          </div>

        </div>
      )}


      <Modal
        isOpen={isAddShippingOpen}
        onClose={() => setIsAddShippingOpen(false)}
        title="افزودن روش ارسال"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان *
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              placeholder="مثال: ارسال با پیک"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              توضیح کوتاه
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              placeholder="مثال: ارسال در تهران (۲ تا ۴ ساعت)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              قیمت (تومان) - اختیاری
            </label>
            <input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              placeholder="مثال: 120000"
              inputMode="numeric"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddShippingOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={isSavingNewShipping || !newTitle.trim()}
              onClick={async () => {
                if (!newTitle.trim()) return;
                setIsSavingNewShipping(true);
                try {
                  const parsedPrice = parsePriceInput(newPrice);
                  const created = await shippingMethodService.create({
                    title: newTitle.trim(),
                    description: newDescription.trim() || undefined,
                    ...(parsedPrice != null ? { price: parsedPrice } : {}),
                  });
                  setShippingMethods((prev) => [created, ...prev]);
                  setNewTitle('');
                  setNewDescription('');
                  setNewPrice('');
                  setIsAddShippingOpen(false);
                } finally {
                  setIsSavingNewShipping(false);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingNewShipping ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Plus size={18} />
              )}
              افزودن
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="ویرایش روش ارسال"
      >
        {editTarget ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
              <input
                defaultValue={editTarget.title}
                onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیح کوتاه</label>
              <textarea
                defaultValue={editTarget.description || ''}
                onChange={(e) => setEditTarget({ ...editTarget, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان) - اختیاری</label>
              <input
                defaultValue={typeof editTarget.price === 'number' ? String(editTarget.price) : ''}
                onChange={(e) => {
                  const parsed = parsePriceInput(e.target.value);
                  setEditTarget({ ...editTarget, price: parsed });
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
                inputMode="numeric"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editTarget) return;
                  const updated = await shippingMethodService.update(editTarget.id, {
                    title: editTarget.title,
                    description: editTarget.description || undefined,
                    price: typeof editTarget.price === 'number' ? editTarget.price : null,
                  });
                  setShippingMethods((prev) =>
                    prev.map((x) => (x.id === editTarget.id ? updated : x)),
                  );
                  setEditTarget(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90"
              >
                ذخیره
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="حذف روش ارسال"
        message="آیا از حذف این روش ارسال مطمئن هستید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        cancelText="انصراف"
        onClose={() => {
          setIsDeleteOpen(false);
          setEditTarget(null);
        }}
        onConfirm={async () => {
          if (!editTarget) return;
          const removed = await shippingMethodService.remove(editTarget.id);
          setShippingMethods((prev) => prev.filter((x) => x.id !== removed.id));
          setIsDeleteOpen(false);
          setEditTarget(null);
        }}
      />
    </div>
  );
};

export default SiteSettings;
