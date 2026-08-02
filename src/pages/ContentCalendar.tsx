import { useCallback, useEffect, useMemo, useState } from 'react';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import {
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ImageIcon,
  Loader2,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import {
  contentCalendarService,
  type ContentCalendarEntry,
  type ContentEntryType,
} from '../services/contentCalendar.service';
import { SearchableProductMultiSelect } from '../components/common/SearchableProductMultiSelect';
import { Modal } from '../components/common/Modal';
import { getImageUrl } from '../utils/image';

const WEEKDAY_LABELS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

function makeToday(): DateObject {
  return new DateObject({ calendar: persian, locale: persian_fa });
}

function toGregorianYmd(d: DateObject): string {
  // convert() mutates in place and returns `this` — clone first so callers can
  // keep using their original (often shared) DateObject afterward.
  const g = new DateObject(d).convert(gregorian);
  return `${String(g.year).padStart(4, '0')}-${String(g.month.number).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`;
}

function startOfWeek(d: DateObject): DateObject {
  const idx = d.weekDay.index; // 0 = شنبه
  return new DateObject(d).subtract(idx, 'day');
}

function buildMonthGrid(anchor: DateObject): DateObject[] {
  // toFirstOfMonth()/toLastOfMonth() mutate in place and return `this`, so each
  // needs its own clone of anchor — reusing one clone for both would make them alias.
  const first = new DateObject(anchor).toFirstOfMonth();
  const last = new DateObject(anchor).toLastOfMonth();
  const gridStart = startOfWeek(first);
  const gridEnd = new DateObject(last).add(6 - last.weekDay.index, 'day');

  const days: DateObject[] = [];
  const cursor = new DateObject(gridStart);
  while (cursor.toDate().getTime() <= gridEnd.toDate().getTime()) {
    days.push(new DateObject(cursor));
    cursor.add(1, 'day');
  }
  return days;
}

function buildWeekGrid(anchor: DateObject): DateObject[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => new DateObject(start).add(i, 'day'));
}

function entryLabel(entry: ContentCalendarEntry): string {
  if (entry.title) return entry.title;
  if (entry.products.length === 0) return 'بدون عنوان';
  const names = entry.products.slice(0, 2).map((p) => p.title).join('، ');
  const extra = entry.products.length - 2;
  return extra > 0 ? `${names} +${extra}` : names;
}

const TYPE_LABEL: Record<ContentEntryType, string> = { POST: 'پست', STORY: 'استوری' };

function TypeIcon({ type, size = 12 }: { type: ContentEntryType; size?: number }) {
  return type === 'POST' ? <ImageIcon size={size} /> : <Camera size={size} />;
}

type ViewMode = 'month' | 'week';

const ContentCalendar = () => {
  const [view, setView] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState<DateObject>(() => makeToday());
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const [entries, setEntries] = useState<ContentCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<ContentEntryType>('POST');
  const [newTitle, setNewTitle] = useState('');
  const [newProductIds, setNewProductIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [replanIntervalDays, setReplanIntervalDays] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    contentCalendarService
      .getSettings()
      .then((s) => setReplanIntervalDays(s.replanIntervalDays))
      .catch((e) => console.error(e));
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await contentCalendarService.updateSettings(replanIntervalDays);
      setReplanIntervalDays(updated.replanIntervalDays);
      setShowSettings(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const days = useMemo(
    () => (view === 'month' ? buildMonthGrid(anchor) : buildWeekGrid(anchor)),
    [view, anchor],
  );

  const todayYmd = useMemo(() => toGregorianYmd(makeToday()), []);

  const rangeFrom = useMemo(() => toGregorianYmd(days[0]), [days]);
  const rangeTo = useMemo(() => toGregorianYmd(days[days.length - 1]), [days]);

  const fetchRange = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const data = await contentCalendarService.getRange(from, to);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRange(rangeFrom, rangeTo);
  }, [rangeFrom, rangeTo, fetchRange]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, ContentCalendarEntry[]>();
    for (const entry of entries) {
      const key = entry.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const selectedEntries = selectedYmd ? (entriesByDate.get(selectedYmd) ?? []) : [];

  const handleToggle = async (entry: ContentCalendarEntry) => {
    setTogglingId(entry.id);
    try {
      const updated = await contentCalendarService.toggle(entry.id, !entry.isDone);
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (entry: ContentCalendarEntry) => {
    setDeletingId(entry.id);
    try {
      await contentCalendarService.remove(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewType('POST');
    setNewTitle('');
    setNewProductIds([]);
  };

  const handleCreate = async () => {
    if (!selectedYmd) return;
    setSaving(true);
    try {
      const created = await contentCalendarService.create({
        date: selectedYmd,
        type: newType,
        title: newTitle.trim() || undefined,
        productIds: newProductIds.length ? newProductIds : undefined,
      });
      setEntries((prev) => [...prev, created]);
      resetAddForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const goToday = () => {
    setAnchor(makeToday());
    setSelectedYmd(todayYmd);
  };
  const goPrev = () =>
    setAnchor((prev) => new DateObject(prev).subtract(view === 'month' ? 1 : 7, view === 'month' ? 'month' : 'day'));
  const goNext = () =>
    setAnchor((prev) => new DateObject(prev).add(view === 'month' ? 1 : 7, view === 'month' ? 'month' : 'day'));

  const headerLabel = useMemo(() => {
    if (view === 'month') return anchor.format('MMMM YYYY');
    const start = days[0];
    const end = days[days.length - 1];
    if (start.month.number === end.month.number) {
      return `${start.format('D')} تا ${end.format('D MMMM YYYY')}`;
    }
    return `${start.format('D MMMM')} تا ${end.format('D MMMM YYYY')}`;
  }, [view, anchor, days]);

  const renderDayCell = (day: DateObject) => {
    const ymd = toGregorianYmd(day);
    const dayEntries = entriesByDate.get(ymd) ?? [];
    const inMonth = view === 'week' || (day.month.number === anchor.month.number && day.year === anchor.year);
    const isToday = ymd === todayYmd;
    const isSelected = ymd === selectedYmd;
    const maxChips = view === 'month' ? 2 : 6;

    return (
      <button
        key={ymd}
        type="button"
        onClick={() => setSelectedYmd(ymd)}
        className={`flex flex-col items-stretch gap-1 border-b border-l border-gray-100 p-2 text-right transition-colors first:border-r last:border-l-0 hover:bg-gray-50 ${
          view === 'month' ? 'min-h-26' : 'min-h-70'
        } ${inMonth ? 'bg-white' : 'bg-gray-50/70'} ${isSelected ? 'ring-2 ring-inset ring-zafting-accent' : ''}`}
      >
        <div className="flex items-center justify-between">
          {view === 'week' && (
            <span className="text-[11px] font-bold text-gray-400">{day.weekDay.name}</span>
          )}
          <span
            className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
              isToday
                ? 'bg-zafting-accent text-white'
                : inMonth
                  ? 'text-zafting-text'
                  : 'text-gray-300'
            } ${view === 'month' ? '' : 'mr-auto'}`}
          >
            {day.format('D')}
          </span>
        </div>

        <div className="flex flex-col gap-1 overflow-hidden">
          {dayEntries.slice(0, maxChips).map((e) => (
            <span
              key={e.id}
              className={`inline-flex items-center gap-1 text-[11px] truncate px-1.5 py-0.5 rounded font-medium ${
                e.isDone ? 'bg-green-100 text-green-800' : 'bg-zafting-accent/10 text-zafting-accent'
              }`}
            >
              <TypeIcon type={e.type} size={10} />
              <span className="truncate">{entryLabel(e)}</span>
            </span>
          ))}
          {dayEntries.length > maxChips && (
            <span className="text-[11px] text-gray-400">
              +{dayEntries.length - maxChips} بیشتر
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zafting-accent/10 rounded-xl text-zafting-accent">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">تقویم محتوایی</h1>
            <p className="text-gray-500 text-sm mt-1">
              برنامه پست و استوری اینستاگرام — روزها را انتخاب کنید، انجام‌شده‌ها را تیک بزنید یا محتوای دلخواه اضافه کنید
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-zafting-accent transition-colors"
          aria-label="تنظیمات تقویم محتوایی"
        >
          <Settings size={20} />
        </button>
      </div>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="تنظیمات تقویم محتوایی">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              فاصله بازتولید محتوا (روز)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              اگر محصولی قبلاً حداقل یکبار برنامه محتوایی داشته، هنوز موجودی داره، و از آخرین برنامه‌اش این‌قدر روز گذشته باشه، هر شب دوباره به اولین روز خالی اضافه می‌شه.
            </p>
            <input
              type="number"
              min={1}
              value={replanIntervalDays}
              onChange={(e) => setReplanIntervalDays(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent text-sm"
            />
          </div>
          <button
            type="button"
            disabled={savingSettings}
            onClick={handleSaveSettings}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zafting-accent text-white font-bold text-sm hover:opacity-95 disabled:opacity-60"
          >
            {savingSettings && <Loader2 className="animate-spin" size={16} />}
            ذخیره
          </button>
        </div>
      </Modal>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToday}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-zafting-text hover:bg-gray-50"
          >
            امروز
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="قبلی"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="بعدی"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          <h2 className="text-lg font-bold text-zafting-text">{headerLabel}</h2>
        </div>

        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button
            type="button"
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              view === 'month' ? 'bg-white text-zafting-text shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ماه
          </button>
          <button
            type="button"
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              view === 'week' ? 'bg-white text-zafting-text shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            هفته
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-zafting-accent" size={28} />
            </div>
          )}

          <div className="grid grid-cols-7 border-t border-r border-gray-100 bg-gray-50/50 text-center text-xs font-bold text-gray-400">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-2 border-b border-l border-gray-100 first:border-r last:border-l-0">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-r border-gray-100">{days.map(renderDayCell)}</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit space-y-4">
          {!selectedYmd ? (
            <p className="text-gray-400 text-sm">یک روز از تقویم انتخاب کنید تا برنامه‌اش را ببینید.</p>
          ) : (
            <>
              {selectedEntries.length === 0 ? (
                <p className="text-gray-400 text-sm">برای این روز محتوایی برنامه‌ریزی نشده.</p>
              ) : (
                <div className="space-y-4">
                  {selectedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-100 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 ${
                              entry.type === 'POST'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <TypeIcon type={entry.type} />
                            {TYPE_LABEL[entry.type]}
                          </span>
                          <p className="font-bold text-zafting-text truncate">
                            {entry.title || (entry.products.length === 0 ? 'بدون عنوان' : null)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={deletingId === entry.id}
                          onClick={() => handleDelete(entry)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                          aria-label="حذف"
                        >
                          {deletingId === entry.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>

                      {entry.products.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.products.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700"
                            >
                              {p.images?.[0] && (
                                <img src={getImageUrl(p.images[0])} alt="" className="w-5 h-5 rounded object-cover" />
                              )}
                              {p.title}
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={togglingId === entry.id}
                        onClick={() => handleToggle(entry)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                          entry.isDone
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {togglingId === entry.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : entry.isDone ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Circle size={16} />
                        )}
                        {entry.isDone ? 'انجام شد' : 'علامت‌گذاری به عنوان انجام‌شده'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showAddForm ? (
                <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zafting-text">محتوای جدید</span>
                    <button
                      type="button"
                      onClick={resetAddForm}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
                      aria-label="بستن"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {(['POST', 'STORY'] as ContentEntryType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewType(t)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold border transition-colors ${
                          newType === t
                            ? 'bg-zafting-accent text-white border-zafting-accent'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <TypeIcon type={t} size={14} />
                        {TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="عنوان محتوا (مثلاً: چجوری استایل کنیم)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent text-sm"
                  />

                  <SearchableProductMultiSelect
                    label="محصولات (اختیاری)"
                    value={newProductIds}
                    onChange={setNewProductIds}
                  />

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCreate}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zafting-accent text-white font-bold text-sm hover:opacity-95 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    افزودن
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-zafting-accent hover:text-zafting-accent transition-colors text-sm font-bold"
                >
                  <Plus size={16} />
                  افزودن محتوا
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;
