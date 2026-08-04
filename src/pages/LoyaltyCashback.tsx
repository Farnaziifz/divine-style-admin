import { useEffect, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Select } from '../components/common/Select';
import { PersianDatePicker } from '../components/common/PersianDatePicker';
import {
  loyaltyCashbackIncentiveService,
  type CashbackIncentive,
  type IncentiveValueType,
} from '../services/loyaltyCashbackIncentive.service';
import { loyaltySegmentService, type LoyaltySegment } from '../services/loyaltySegment.service';
import { gregorianYmdToday } from '../utils/persianDate';
import { Plus, Edit2, Power, Loader2 } from 'lucide-react';

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

const LoyaltyCashback = () => {
  const [rows, setRows] = useState<CashbackIncentive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [segments, setSegments] = useState<LoyaltySegment[]>([]);

  const [toggleModal, setToggleModal] = useState<{
    isOpen: boolean;
    row: CashbackIncentive | null;
  }>({ isOpen: false, row: null });
  const [isToggling, setIsToggling] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [valueType, setValueType] = useState<IncentiveValueType>('PERCENTAGE');
  const [value, setValue] = useState<string>('');
  const [expiresAfterDays, setExpiresAfterDays] = useState<string>('');
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
      const response = await loyaltyCashbackIncentiveService.list({ page, limit: 10 });
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
    setValueType('PERCENTAGE');
    setValue('');
    setExpiresAfterDays('');
    setMinPurchaseAmount('');
    setTargetSegmentId('');
    setStartsAt(gregorianYmdToday());
    setEndsAt('');
    setEditingId(null);
    setFormError(null);
  };

  const handleEdit = (row: CashbackIncentive) => {
    setEditingId(row.id);
    setTitle(row.title);
    setValueType(row.cashbackDetail?.valueType ?? 'PERCENTAGE');
    setValue(String(row.cashbackDetail?.value ?? ''));
    setExpiresAfterDays(
      row.cashbackDetail?.expiresAfterDays != null
        ? String(row.cashbackDetail.expiresAfterDays)
        : '',
    );
    setMinPurchaseAmount(
      row.cashbackDetail?.minPurchaseAmount != null
        ? String(row.cashbackDetail.minPurchaseAmount)
        : '',
    );
    setTargetSegmentId(row.targetSegmentId ?? '');
    setStartsAt(row.startsAt.slice(0, 10));
    setEndsAt(row.endsAt.slice(0, 10));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = (row: CashbackIncentive) => {
    setToggleModal({ isOpen: true, row });
  };

  const onConfirmToggle = async () => {
    const row = toggleModal.row;
    if (!row) return;
    setIsToggling(true);
    try {
      if (row.isActive) {
        await loyaltyCashbackIncentiveService.deactivate(row.id);
      } else {
        await loyaltyCashbackIncentiveService.update(row.id, { isActive: true });
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

    if (!title.trim() || !value.trim() || !startsAt || !endsAt) {
      setFormError('عنوان، مقدار و بازهٔ زمانی الزامی است');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        valueType,
        value: Number(value),
        targetSegmentId: targetSegmentId || undefined,
        expiresAfterDays: expiresAfterDays.trim() ? Number(expiresAfterDays) : undefined,
        minPurchaseAmount: minPurchaseAmount.trim() ? Number(minPurchaseAmount) : undefined,
        startsAt: startOfDayIso(startsAt),
        endsAt: endOfDayIso(endsAt),
      };

      if (editingId) {
        await loyaltyCashbackIncentiveService.update(editingId, payload);
      } else {
        await loyaltyCashbackIncentiveService.create(payload);
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

  const columns: Column<CashbackIncentive>[] = [
    { key: 'title', title: 'عنوان', render: (r) => r.title },
    {
      key: 'value',
      title: 'مقدار کش‌بک',
      render: (r) =>
        r.cashbackDetail?.valueType === 'PERCENTAGE'
          ? `${r.cashbackDetail.value}%`
          : formatToman(r.cashbackDetail?.value ?? 0),
    },
    {
      key: 'expiresAfterDays',
      title: 'انقضا',
      render: (r) =>
        r.cashbackDetail?.expiresAfterDays != null ? (
          <span className="text-xs text-gray-600">
            {r.cashbackDetail.expiresAfterDays} روز پس از اعطا
          </span>
        ) : (
          <span className="text-xs text-gray-400">بدون انقضا</span>
        ),
    },
    {
      key: 'minPurchaseAmount',
      title: 'حداقل سفارش',
      render: (r) =>
        r.cashbackDetail?.minPurchaseAmount != null ? (
          formatToman(r.cashbackDetail.minPurchaseAmount)
        ) : (
          <span className="text-xs text-gray-400">بدون حداقل</span>
        ),
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
        <h1 className="text-2xl font-bold text-gray-800">کش‌بک — باشگاه مشتریان</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
        >
          <Plus size={20} />
          <span>افزودن کش‌بک</span>
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
            emptyMessage="کش‌بکی ثبت نشده است"
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
        title={editingId ? 'ویرایش کش‌بک' : 'افزودن کش‌بک جدید'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {valueType === 'PERCENTAGE' ? 'درصد کش‌بک' : 'مبلغ کش‌بک (تومان)'}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                انقضای اعتبار (روز، اختیاری)
              </label>
              <input
                type="number"
                min={1}
                value={expiresAfterDays}
                onChange={(e) => setExpiresAfterDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
                placeholder="بدون انقضا"
              />
            </div>
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
        title={toggleModal.row?.isActive ? 'غیرفعال‌سازی کش‌بک' : 'فعال‌سازی کش‌بک'}
        message={
          toggleModal.row?.isActive
            ? 'آیا از غیرفعال کردن این کش‌بک مطمئن هستید؟'
            : 'آیا از فعال کردن این کش‌بک مطمئن هستید؟'
        }
        confirmText={toggleModal.row?.isActive ? 'غیرفعال کن' : 'فعال کن'}
        isLoading={isToggling}
        type={toggleModal.row?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};

export default LoyaltyCashback;
