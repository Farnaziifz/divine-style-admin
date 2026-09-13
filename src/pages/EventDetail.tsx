import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  eventService,
  getEventLandingLink,
  type Event,
} from '../services/event.service';
import { AddEventModal } from '../components/event/AddEventModal';
import { getImageUrl } from '../utils/image';
import {
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  Pencil,
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getById(id);
      setEvent(data);
    } catch (e) {
      console.error(e);
      setError('خطا در دریافت اطلاعات رویداد');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    QRCode.toDataURL(getEventLandingLink(event.eventCode), {
      width: 320,
      margin: 1,
      color: { dark: '#2A2A2A', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [event]);

  const handleCopyLink = async () => {
    if (!event) return;
    try {
      await navigator.clipboard.writeText(getEventLandingLink(event.eventCode));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !event) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `event-qr-${event.eventCode}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-zafting-accent" size={40} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-20 text-center text-red-600">{error || 'رویداد یافت نشد'}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">{event.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono dir-ltr">{event.eventCode}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95"
        >
          <Pencil size={18} />
          ویرایش رویداد
        </button>
      </div>

      {event.bannerImageUrl && (
        <div className="rounded-2xl overflow-hidden h-40 sm:h-56 bg-gray-50 border border-gray-100">
          <img
            src={getImageUrl(event.bannerImageUrl)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-zafting-text flex items-center gap-2">
            <Calendar size={18} className="text-zafting-accent" />
            اطلاعات رویداد
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
                {event.logoImageUrl ? (
                  <img
                    src={getImageUrl(event.logoImageUrl)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon size={22} className="text-gray-300" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">وضعیت</p>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    event.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {event.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">تاریخ شروع</p>
              <p className="text-sm font-bold text-zafting-text">{formatDate(event.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">تاریخ پایان</p>
              <p className="text-sm font-bold text-zafting-text">{formatDate(event.endDate)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">تاریخ ایجاد</p>
              <p className="text-sm text-gray-600 dir-ltr">{formatDate(event.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">آخرین ویرایش</p>
              <p className="text-sm text-gray-600 dir-ltr">{formatDate(event.updatedAt)}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">لینک عمومی لندینگ</p>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="flex items-center gap-1.5 text-sm text-zafting-accent hover:opacity-80 transition-opacity"
              >
                <span dir="ltr">{getEventLandingLink(event.eventCode)}</span>
                {linkCopied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              </button>
              {linkCopied && <p className="text-xs text-green-600 mt-0.5">کپی شد</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center gap-3">
          <h3 className="text-sm font-bold text-zafting-text self-start">کد QR رویداد</h3>
          <p className="text-xs text-gray-400 self-start -mt-2">اسکن برای باز شدن لینک عمومی رویداد</p>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR رویداد" className="w-48 h-48 rounded-xl border border-gray-100" />
          ) : (
            <div className="w-48 h-48 rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />
          )}
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={!qrDataUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-zafting-accent bg-zafting-accent/10 hover:bg-zafting-accent/20 transition-colors disabled:opacity-40"
          >
            <Download size={16} />
            دانلود تصویر QR
          </button>
        </div>
      </div>

      <AddEventModal
        isOpen={editOpen}
        event={event}
        onClose={() => setEditOpen(false)}
        onSaved={() => void fetchEvent()}
      />
    </div>
  );
};

export default EventDetail;
