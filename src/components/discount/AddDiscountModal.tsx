import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Loader2, RefreshCw, TicketPercent } from 'lucide-react';
import {
  discountService,
  type CreateDiscountCodeDto,
  type DiscountValueType,
} from '../../services/discount.service';
import { userService, type UserProfile } from '../../services/user.service';
import { PersianDatePicker } from '../common/PersianDatePicker';
import {
  formatGregorianYmdToPersianLong,
  gregorianYmdAddDays,
  gregorianYmdToday,
} from '../../utils/persianDate';

type UsageMode = 'public' | 'single_user';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function endOfDayIso(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

interface AddDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AddDiscountModal = ({
  isOpen,
  onClose,
  onSaved,
}: AddDiscountModalProps) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [valueType, setValueType] = useState<DiscountValueType>('PERCENT');
  const [usageMode, setUsageMode] = useState<UsageMode>('public');
  const [expirationDate, setExpirationDate] = useState('');
  const [value, setValue] = useState<number>(10);
  const [maxUses, setMaxUses] = useState<string>('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode((c) => c || generateCode());
    setExpirationDate((d) => (d ? d : gregorianYmdAddDays(30)));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || usageMode !== 'single_user') return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await userService.getUsers(1, 100, {});
        if (!cancelled) setUsers(res.data);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, usageMode]);

  const preview = useMemo(() => {
    const v = Number(value) || 0;
    const valueLabel =
      valueType === 'PERCENT' ? `${v}%` : `${v.toLocaleString('fa-IR')} تومان`;
    const usageLabel = usageMode === 'public' ? 'عمومی' : 'اختصاصی کاربر';
    const titleLabel = title.trim() || 'عنوان تخفیف';
    const expLabel = expirationDate
      ? formatGregorianYmdToPersianLong(expirationDate)
      : 'بدون انقضا';
    const usesLabel =
      maxUses.trim() === ''
        ? '∞ استفاده'
        : `${Number(maxUses).toLocaleString('fa-IR')} استفاده`;
    return { valueLabel, usageLabel, titleLabel, expLabel, usesLabel };
  }, [title, value, valueType, usageMode, expirationDate, maxUses]);

  const reset = () => {
    setTitle('');
    setCode(generateCode());
    setValueType('PERCENT');
    setUsageMode('public');
    setExpirationDate('');
    setValue(10);
    setMaxUses('');
    setUserId('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('کد تخفیف را وارد کنید');
      return;
    }
    if (usageMode === 'single_user' && !userId) {
      setError('کاربر را انتخاب کنید');
      return;
    }
    if (!expirationDate) {
      setError('تاریخ انقضا را انتخاب کنید');
      return;
    }

    const payload: CreateDiscountCodeDto = {
      code: code.trim(),
      title: title.trim() || undefined,
      scope: usageMode === 'public' ? 'ALL_USERS' : 'SINGLE_USER',
      userId: usageMode === 'single_user' ? userId : undefined,
      valueType,
      value: Number(value),
      validFrom: startOfTodayIso(),
      validTo: endOfDayIso(expirationDate),
      maxTotalUses: maxUses.trim() === '' ? undefined : Math.max(1, Number(maxUses)),
      isActive: true,
    };

    setSaving(true);
    try {
      await discountService.create(payload);
      onSaved();
      handleClose();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message: unknown }).message)
          : 'خطا در ذخیره کد تخفیف';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="افزودن کد تخفیف جدید"
      maxWidthClassName="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* پیش‌نمایش — در RTL ستون اول سمت راست */}
          <div className="space-y-3 order-2 lg:order-1">
            <h3 className="text-sm font-bold text-gray-500">پیش‌نمایش کارت</h3>
            <div className="rounded-2xl overflow-hidden border border-zafting-accent/20 shadow-lg max-w-sm mx-auto lg:mx-0">
              <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 text-white p-6 relative min-h-[140px]">
                <TicketPercent
                  className="absolute left-4 top-4 opacity-30"
                  size={72}
                  strokeWidth={1}
                />
                <div className="relative z-10 text-center space-y-1 pt-2">
                  <p className="text-3xl font-black tracking-tight">
                    {preview.valueLabel}
                  </p>
                  <p className="text-sm opacity-90">تخفیف</p>
                  <p className="text-xs opacity-80 mt-2">{preview.usageLabel}</p>
                </div>
              </div>
              <div className="bg-white p-4 space-y-2 text-right">
                <p className="font-bold text-zafting-text">{preview.titleLabel}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{preview.expLabel}</span>
                  <span>{preview.usesLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* فرم */}
          <div className="space-y-4 order-1 lg:order-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                عنوان تخفیف
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
                placeholder="مثلاً جشنواره بهار"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">کد تخفیف</label>
              <div className="flex gap-2 flex-row-reverse">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none dir-ltr text-left font-mono"
                  placeholder="CODE"
                />
                <button
                  type="button"
                  onClick={() => setCode(generateCode())}
                  className="shrink-0 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-zafting-accent"
                  title="تولید کد تصادفی"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-gray-700">نوع تخفیف</span>
              <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setValueType('PERCENT')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    valueType === 'PERCENT'
                      ? 'bg-zafting-accent text-white shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  درصدی
                </button>
                <button
                  type="button"
                  onClick={() => setValueType('FIXED_AMOUNT')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    valueType === 'FIXED_AMOUNT'
                      ? 'bg-zafting-accent text-white shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  مبلغ ثابت
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-gray-700">نوع استفاده</span>
              <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setUsageMode('public');
                    setUserId('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    usageMode === 'public'
                      ? 'bg-zafting-accent text-white shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  عمومی
                </button>
                <button
                  type="button"
                  onClick={() => setUsageMode('single_user')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    usageMode === 'single_user'
                      ? 'bg-zafting-accent text-white shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  اختصاصی کاربر
                </button>
              </div>
            </div>

            {usageMode === 'single_user' && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">کاربر</label>
                {loadingUsers ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                    <Loader2 className="animate-spin" size={18} />
                    در حال بارگذاری…
                  </div>
                ) : (
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none bg-white"
                    required={usageMode === 'single_user'}
                  >
                    <option value="">انتخاب کاربر…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.mobile}
                        {u.name || u.lastName
                          ? ` — ${[u.name, u.lastName].filter(Boolean).join(' ')}`
                          : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                تاریخ انقضا (شمسی)
              </label>
              <PersianDatePicker
                value={expirationDate}
                onChange={setExpirationDate}
                placeholder="تاریخ را انتخاب کنید"
                minDate={gregorianYmdToday()}
                maxDate={gregorianYmdAddDays(365 * 10)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {valueType === 'PERCENT' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)'}
                </label>
                <input
                  type="number"
                  min={valueType === 'PERCENT' ? 1 : 1}
                  max={valueType === 'PERCENT' ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none dir-ltr text-left"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  تعداد قابل استفاده
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="نامحدود"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none dir-ltr text-left"
                />
                <p className="text-xs text-gray-400">خالی = نامحدود</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : null}
            ذخیره تخفیف
          </button>
        </div>
      </form>
    </Modal>
  );
};
