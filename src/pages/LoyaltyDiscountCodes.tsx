import { useEffect, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Select } from '../components/common/Select';
import { PersianDatePicker } from '../components/common/PersianDatePicker';
import {
  loyaltyDiscountIncentiveService,
  type DiscountIncentive,
  type IncentiveTierType,
  type IncentiveUsageType,
  type IncentiveValueType,
} from '../services/loyaltyDiscountIncentive.service';
import { loyaltySegmentService, type LoyaltySegment } from '../services/loyaltySegment.service';
import { gregorianYmdToday } from '../utils/persianDate';
import { Plus, Edit2, Power, Loader2, X } from 'lucide-react';

const DEFAULT_USAGE_STAGES = [10, 15, 20];

function startOfDayIso(ymd: string): string {
  const d = new Date(ymd);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayIso(ymd: string): string {
  const d = new Date(ymd);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const formatToman = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value));

const LoyaltyDiscountCodes = () => {
  const [rows, setRows] = useState<DiscountIncentive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [segments, setSegments] = useState<LoyaltySegment[]>([]);

  const [toggleModal, setToggleModal] = useState<{
    isOpen: boolean;
    row: DiscountIncentive | null;
  }>({ isOpen: false, row: null });
  const [isToggling, setIsToggling] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [valueType, setValueType] = useState<IncentiveValueType>('PERCENTAGE');
  const [value, setValue] = useState<string>('');
  const [tierType, setTierType] = useState<IncentiveTierType>('FLAT');
  const [usageType, setUsageType] = useState<IncentiveUsageType>('SINGLE_USE');
  const [usageStageValues, setUsageStageValues] = useState<string[]>(
    DEFAULT_USAGE_STAGES.map(String),
  );
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>('');
  const [targetSegmentId, setTargetSegmentId] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchRows();
  }, [page]);

  useEffect(() => {
    loyaltySegmentService
      .list()
      .then(setSegments)
      .catch((error) => console.error(error));
  }, []);

  const fetchRows = async () => {
    setIsLoading(true);
    try {
      const response = await loyaltyDiscountIncentiveService.list({ page, limit: 10 });
      setRows(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCode('');
    setValueType('PERCENTAGE');
    setValue('');
    setTierType('FLAT');
    setUsageType('SINGLE_USE');
    setUsageStageValues(DEFAULT_USAGE_STAGES.map(String));
    setMinPurchaseAmount('');
    setTargetSegmentId('');
    setStartsAt(gregorianYmdToday());
    setEndsAt('');
    setEditingId(null);
    setFormError(null);
  };

  const handleEdit = (row: DiscountIncentive) => {
    setEditingId(row.id);
    setTitle(row.title);
    setCode(row.discountCodeDetail?.code ?? '');
    setValueType(row.discountCodeDetail?.valueType ?? 'PERCENTAGE');
    setValue(String(row.discountCodeDetail?.value ?? ''));
    setTierType(row.discountCodeDetail?.tierType ?? 'FLAT');
    setUsageType(row.discountCodeDetail?.usageType ?? 'SINGLE_USE');
    setUsageStageValues(
      row.discountCodeDetail?.tierType === 'USAGE_STEPPED' &&
        row.discountCodeDetail.tiers.length
        ? [...row.discountCodeDetail.tiers]
            .sort((a, b) => (a.usageIndex ?? 0) - (b.usageIndex ?? 0))
            .map((t) => String(t.value))
        : DEFAULT_USAGE_STAGES.map(String),
    );
    setMinPurchaseAmount(
      row.discountCodeDetail?.minPurchaseAmount != null
        ? String(row.discountCodeDetail.minPurchaseAmount)
        : '',
    );
    setTargetSegmentId(row.targetSegmentId ?? '');
    setStartsAt(row.startsAt.slice(0, 10));
    setEndsAt(row.endsAt.slice(0, 10));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = (row: DiscountIncentive) => {
    setToggleModal({ isOpen: true, row });
  };

  const onConfirmToggle = async () => {
    const row = toggleModal.row;
    if (!row) return;
    setIsToggling(true);
    try {
      if (row.isActive) {
        await loyaltyDiscountIncentiveService.deactivate(row.id);
      } else {
        await loyaltyDiscountIncentiveService.update(row.id, { isActive: true });
      }
      setToggleModal({ isOpen: false, row: null });
      fetchRows();
    } catch (error) {
      console.error(error);
      alert('خطا در تغییر وضعیت');
    } finally {
      setIsToggling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isUsageStepped = tierType === 'USAGE_STEPPED';
    if (
      !title.trim() ||
      !code.trim() ||
      (!isUsageStepped && !value.trim()) ||
      !startsAt ||
      !endsAt
    ) {
      setFormError('عنوان، کد، مقدار و بازهٔ زمانی الزامی است');
      return;
    }
    if (isUsageStepped && usageStageValues.some((v) => !v.trim())) {
      setFormError('مقدار همهٔ مراحل باید مشخص باشد');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        code: code.trim(),
        valueType,
        value: isUsageStepped ? Number(usageStageValues[0]) : Number(value),
        tierType,
        usageType: isUsageStepped ? 'MULTI_USE' : usageType,
        tiers: isUsageStepped
          ? usageStageValues.map((v, i) => ({ usageIndex: i + 1, value: Number(v) }))
          : undefined,
        targetSegmentId: targetSegmentId || undefined,
        minPurchaseAmount: minPurchaseAmount.trim() ? Number(minPurchaseAmount) : undefined,
        startsAt: startOfDayIso(startsAt),
        endsAt: endOfDayIso(endsAt),
      };

      if (editingId) {
        await loyaltyDiscountIncentiveService.update(editingId, payload);
      } else {
        await loyaltyDiscountIncentiveService.create(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchRows();
    } catch (error: unknown) {
      console.error(error);
      const msg =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
          ? String((error.response.data as { message: unknown }).message)
          : 'خطا در ذخیره‌سازی';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<DiscountIncentive>[] = [
    { key: 'title', title: 'عنوان', render: (r) => r.title },
    {
      key: 'code',
      title: 'کد',
      render: (r) => (
        <span className="font-mono dir-ltr text-left inline-block">
          {r.discountCodeDetail?.code}
        </span>
      ),
    },
    {
      key: 'value',
      title: 'مقدار',
      render: (r) => {
        const detail = r.discountCodeDetail;
        if (!detail) return '-';
        const suffix = detail.valueType === 'PERCENTAGE' ? '%' : ' تومان';
        const fmt = (v: number) =>
          detail.valueType === 'PERCENTAGE' ? `${v}%` : formatToman(v);
        if (detail.tierType === 'USAGE_STEPPED' && detail.tiers.length) {
          const sorted = [...detail.tiers].sort(
            (a, b) => (a.usageIndex ?? 0) - (b.usageIndex ?? 0),
          );
          return (
            <span className="text-xs">
              {sorted.map((t) => `${t.value}${suffix}`).join(' ← ')}
            </span>
          );
        }
        return fmt(detail.value);
      },
    },
    {
      key: 'targetSegment',
      title: 'سگمنت هدف',
      render: (r) =>
        r.targetSegment ? (
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-zafting-accent/10 text-zafting-accent border border-zafting-accent/20">
            {r.targetSegment.label}
          </span>
        ) : (
          <span className="text-gray-500 text-xs">همهٔ مشتریان</span>
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
      key: 'range',
      title: 'بازهٔ زمانی',
      render: (r) => (
        <span className="text-xs text-gray-600 dir-ltr inline-block">
          {formatShortDate(r.startsAt)} — {formatShortDate(r.endsAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(r)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="ویرایش"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleToggle(r)}
            className={`p-1 rounded hover:bg-gray-50 ${r.isActive ? 'text-amber-600' : 'text-green-600'}`}
            title={r.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
          >
            <Power size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">کدهای تخفیف — باشگاه مشتریان</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
        >
          <Plus size={20} />
          <span>افزودن کد تخفیف</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table
            data={rows}
            columns={columns}
            emptyMessage="کد تخفیفی ثبت نشده است"
            pagination={{
              page,
              limit: 10,
              total,
              onPageChange: setPage,
            }}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'ویرایش کد تخفیف' : 'افزودن کد تخفیف جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">کد تخفیف</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left font-mono"
              placeholder="CODE"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="نوع مقدار"
                value={valueType}
                onChange={(e) => setValueType(e.target.value as IncentiveValueType)}
                options={[
                  { label: 'درصدی', value: 'PERCENTAGE' },
                  { label: 'مبلغ ثابت', value: 'FIXED_AMOUNT' },
                ]}
              />
            </div>
            {tierType !== 'USAGE_STEPPED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {valueType === 'PERCENTAGE' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={valueType === 'PERCENTAGE' ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="نوع پله‌بندی"
                value={tierType}
                onChange={(e) => {
                  const next = e.target.value as IncentiveTierType;
                  setTierType(next);
                  if (next === 'USAGE_STEPPED') setUsageType('MULTI_USE');
                }}
                options={[
                  { label: 'ثابت (بدون پله)', value: 'FLAT' },
                  { label: 'پلکانی بر اساس مبلغ سفارش', value: 'STEPPED' },
                  { label: 'پلکانی بر اساس دفعهٔ خرید (کد چندمرحله‌ای)', value: 'USAGE_STEPPED' },
                ]}
              />
              {tierType === 'STEPPED' && (
                <p className="text-xs text-amber-600 mt-1">
                  تعریف پله‌ها در این نسخهٔ فرم پیاده‌سازی نشده — ثبت با این گزینه رد خواهد شد.
                </p>
              )}
            </div>
            <div>
              {tierType === 'USAGE_STEPPED' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع استفاده
                  </label>
                  <p className="px-3 py-2 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    چندبار مصرف (خودکار — به تعداد مراحل زیر)
                  </p>
                </div>
              ) : (
                <Select
                  label="نوع استفاده"
                  value={usageType}
                  onChange={(e) => setUsageType(e.target.value as IncentiveUsageType)}
                  options={[
                    { label: 'یک‌بار مصرف', value: 'SINGLE_USE' },
                    { label: 'چندبار مصرف', value: 'MULTI_USE' },
                  ]}
                />
              )}
            </div>
          </div>

          {tierType === 'USAGE_STEPPED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                درصد/مبلغ هر مرحلهٔ خرید (مرحلهٔ اول = اولین باری که مشتری این کد را استفاده می‌کند)
              </label>
              <div className="space-y-2">
                {usageStageValues.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-sm text-gray-600">
                      خرید {i + 1}‌ام
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={valueType === 'PERCENTAGE' ? 100 : undefined}
                      value={v}
                      onChange={(e) =>
                        setUsageStageValues((prev) =>
                          prev.map((p, idx) => (idx === i ? e.target.value : p)),
                        )
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
                      required
                    />
                    {usageStageValues.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setUsageStageValues((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="حذف این مرحله"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setUsageStageValues((prev) => [...prev, ''])}
                className="mt-2 text-sm text-zafting-accent hover:underline"
              >
                + افزودن مرحله
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              حداقل مبلغ سفارش (تومان، اختیاری)
            </label>
            <input
              type="number"
              min={0}
              value={minPurchaseAmount}
              onChange={(e) => setMinPurchaseAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
              placeholder="بدون حداقل"
            />
          </div>

          <div>
            <Select
              label="سگمنت هدف"
              value={targetSegmentId}
              onChange={(e) => setTargetSegmentId(String(e.target.value))}
              options={[
                { label: 'همهٔ مشتریان', value: '' },
                ...segments.map((s) => ({ label: s.label, value: s.id })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاریخ شروع
              </label>
              <PersianDatePicker
                value={startsAt}
                onChange={setStartsAt}
                placeholder="تاریخ شروع"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاریخ پایان
              </label>
              <PersianDatePicker
                value={endsAt}
                onChange={setEndsAt}
                placeholder="تاریخ پایان"
                minDate={startsAt || undefined}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-zafting-accent text-white rounded-lg hover:bg-zafting-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}
              {editingId ? 'ویرایش' : 'ایجاد'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        onClose={() => setToggleModal({ isOpen: false, row: null })}
        onConfirm={onConfirmToggle}
        title={toggleModal.row?.isActive ? 'غیرفعال‌سازی کد تخفیف' : 'فعال‌سازی کد تخفیف'}
        message={
          toggleModal.row?.isActive
            ? 'آیا از غیرفعال کردن این کد تخفیف مطمئن هستید؟'
            : 'آیا از فعال کردن این کد تخفیف مطمئن هستید؟'
        }
        confirmText={toggleModal.row?.isActive ? 'غیرفعال کن' : 'فعال کن'}
        isLoading={isToggling}
        type={toggleModal.row?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};

export default LoyaltyDiscountCodes;
