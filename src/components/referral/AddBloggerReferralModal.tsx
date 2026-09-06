import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Loader2, Share2 } from 'lucide-react';
import {
  referralService,
  MAX_COMBINED_REFERRAL_PERCENT,
} from '../../services/referral.service';

interface AddBloggerReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AddBloggerReferralModal = ({
  isOpen,
  onClose,
  onSaved,
}: AddBloggerReferralModalProps) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [cashbackPercent, setCashbackPercent] = useState<number>(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMobile('');
    setName('');
    setDiscountPercent(10);
    setCashbackPercent(5);
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const combined = Number(discountPercent) + Number(cashbackPercent);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^09\d{9}$/.test(mobile.trim())) {
      setError('شماره موبایل معتبر نیست');
      return;
    }
    if (!name.trim()) {
      setError('نام بلاگر را وارد کنید');
      return;
    }
    if (combined > MAX_COMBINED_REFERRAL_PERCENT) {
      setError(`مجموع تخفیف و کش‌بک نباید از ${MAX_COMBINED_REFERRAL_PERCENT}٪ بیشتر باشد`);
      return;
    }

    setSaving(true);
    try {
      await referralService.createForBlogger({
        mobile: mobile.trim(),
        name: name.trim(),
        discountPercent: Number(discountPercent),
        cashbackPercent: Number(cashbackPercent),
      });
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
          : 'خطا در ساخت کد ریفرال';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="ساخت کد ریفرال برای بلاگر"
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500 -mt-1">
          اگر شماره موبایل قبلاً در سیستم ثبت نشده باشد، یک حساب کاربری جدید برای بلاگر ساخته می‌شود.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">شماره موبایل بلاگر</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none dir-ltr text-left"
            placeholder="0912xxxxxxx"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">نام بلاگر</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
            placeholder="مثلاً سارا محمدی"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">درصد تخفیف خریدار</label>
            <input
              type="number"
              min={0}
              max={MAX_COMBINED_REFERRAL_PERCENT}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none dir-ltr text-left"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">درصد کش‌بک بلاگر</label>
            <input
              type="number"
              min={0}
              max={MAX_COMBINED_REFERRAL_PERCENT}
              value={cashbackPercent}
              onChange={(e) => setCashbackPercent(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none dir-ltr text-left"
            />
          </div>
        </div>

        <p
          className={`text-xs ${
            combined > MAX_COMBINED_REFERRAL_PERCENT ? 'text-red-600' : 'text-gray-400'
          }`}
        >
          مجموع: {combined}٪ (حداکثر مجاز {MAX_COMBINED_REFERRAL_PERCENT}٪)
        </p>

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
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={18} />}
            ساخت کد ریفرال
          </button>
        </div>
      </form>
    </Modal>
  );
};
