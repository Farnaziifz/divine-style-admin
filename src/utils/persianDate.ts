import DateObject from 'react-date-object';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

/** تاریخ میلادی YYYY-MM-DD را به رشتهٔ نمایشی شمسی (مثلاً برای پیش‌نمایش) تبدیل می‌کند */
export function formatGregorianYmdToPersianLong(ymd: string): string {
  if (!ymd?.trim()) return '—';
  try {
    const d = new DateObject({
      date: ymd,
      format: 'YYYY-MM-DD',
      calendar: gregorian,
    })
      .convert(persian)
      .setLocale(persian_fa);
    return d.format('DD MMMM YYYY');
  } catch {
    return ymd;
  }
}

/** امروز محلی به صورت YYYY-MM-DD میلادی */
export function gregorianYmdToday(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** n روز بعد از امروز (تقویم محلی کاربر) */
export function gregorianYmdAddDays(days: number): string {
  const t = new Date();
  t.setDate(t.getDate() + days);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
