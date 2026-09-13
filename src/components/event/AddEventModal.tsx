import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PersianDatePicker } from '../common/PersianDatePicker';
import { gregorianYmdAddDays, gregorianYmdToday } from '../../utils/persianDate';
import { getImageUrl } from '../../utils/image';
import { uploadService } from '../../services/upload.service';
import {
  eventService,
  type CreateEventDto,
  type Event,
} from '../../services/event.service';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** وقتی مقدار داره، مودال در حالت ویرایش همین رویداد باز می‌شه */
  event?: Event | null;
}

export const AddEventModal = ({
  isOpen,
  onClose,
  onSaved,
  event,
}: AddEventModalProps) => {
  const isEditing = !!event;
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setName(event.name);
      setStartDate(event.startDate.slice(0, 10));
      setEndDate(event.endDate.slice(0, 10));
      setLogoImageUrl(event.logoImageUrl);
      setBannerImageUrl(event.bannerImageUrl);
      return;
    }
    setName('');
    setStartDate((d) => d || gregorianYmdToday());
    setEndDate((d) => d || gregorianYmdAddDays(7));
    setLogoImageUrl(null);
    setBannerImageUrl(null);
  }, [isOpen, event]);

  const reset = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setLogoImageUrl(null);
    setBannerImageUrl(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUploadImage = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadService.upload(file);
      setUrl(url);
    } catch {
      setError('آپلود تصویر ناموفق بود');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('نام رویداد را وارد کنید');
      return;
    }
    if (!startDate || !endDate) {
      setError('بازه تاریخ رویداد را انتخاب کنید');
      return;
    }
    if (startDate > endDate) {
      setError('تاریخ پایان باید بعد از تاریخ شروع باشد');
      return;
    }

    const payload: CreateEventDto = {
      name: name.trim(),
      startDate,
      endDate,
    };

    setSaving(true);
    try {
      let saved: Event;
      if (isEditing && event) {
        saved = await eventService.update(event.id, payload);
      } else {
        saved = await eventService.create(payload);
      }
      if (logoImageUrl !== (event?.logoImageUrl ?? null)) {
        await eventService.updateLogoImage(saved.id, logoImageUrl);
      }
      if (bannerImageUrl !== (event?.bannerImageUrl ?? null)) {
        await eventService.updateBannerImage(saved.id, bannerImageUrl);
      }
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
          : 'خطا در ذخیره رویداد';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'ویرایش رویداد' : 'افزودن رویداد جدید'}
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">نام رویداد</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
            placeholder="مثلاً جشنواره تابستانه"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">تاریخ شروع (شمسی)</label>
            <PersianDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="تاریخ شروع"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">تاریخ پایان (شمسی)</label>
            <PersianDatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="تاریخ پایان"
              minDate={startDate || undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">لوگو</label>
            <div className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
              {uploadingLogo ? (
                <Loader2 className="animate-spin text-zafting-accent" size={24} />
              ) : logoImageUrl ? (
                <img
                  src={getImageUrl(logoImageUrl)}
                  alt=""
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon size={24} className="text-gray-300" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadImage(file, setLogoImageUrl, setUploadingLogo);
              }}
              className="w-full text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">بنر</label>
            <div className="w-full aspect-video rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
              {uploadingBanner ? (
                <Loader2 className="animate-spin text-zafting-accent" size={24} />
              ) : bannerImageUrl ? (
                <img
                  src={getImageUrl(bannerImageUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={24} className="text-gray-300" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadImage(file, setBannerImageUrl, setUploadingBanner);
              }}
              className="w-full text-sm"
            />
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
            disabled={saving || uploadingLogo || uploadingBanner}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : null}
            {isEditing ? 'ذخیره تغییرات' : 'ذخیره رویداد'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
