/**
 * تقویم شمسی یکدست برای پنل ادمین — برای هر فیلد تاریخ جدید از همین کامپوننت استفاده کنید.
 * خروجی onChange همیشه میلادی YYYY-MM-DD است (سازگار با API).
 *
 * نکته: با calendar=persian نباید رشتهٔ میلادی را مستقیم به value بدهیم؛ همیشه از DateObject
 * (میلادی → شمسی) استفاده می‌کنیم تا پارس اشتباه نشود.
 */
import { useMemo } from 'react';
import DatePicker from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';

import 'react-multi-date-picker/styles/layouts/prime.css';
import 'react-multi-date-picker/styles/colors/teal.css';

function gregorianYmdToPersianDateObject(ymd: string): DateObject | undefined {
  if (!ymd?.trim()) return undefined;
  try {
    return new DateObject({
      date: ymd.trim(),
      format: 'YYYY-MM-DD',
      calendar: gregorian,
    }).convert(persian);
  } catch {
    return undefined;
  }
}

/** میلادی YYYY-MM-DD → Date محلی (نیاز کتابخانه برای min/max پایدار) */
function ymdToLocalNoonDate(ymd: string): Date | undefined {
  if (!ymd?.trim()) return undefined;
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function persianPickToGregorianYmd(selected: DateObject): string {
  const g = selected.convert(gregorian);
  const y = g.year;
  const m = g.month.number;
  const day = g.day;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface PersianDatePickerProps {
  /** میلادی YYYY-MM-DD */
  value: string;
  onChange: (gregorianYmd: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** محدودیت میلادی YYYY-MM-DD */
  minDate?: string;
  maxDate?: string;
  id?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  className = '',
  disabled,
  minDate,
  maxDate,
  id,
}: PersianDatePickerProps) {
  const dateValue = useMemo(
    () => gregorianYmdToPersianDateObject(value),
    [value],
  );

  const minDateProp = useMemo(
    () => ymdToLocalNoonDate(minDate ?? '') ?? undefined,
    [minDate],
  );

  const maxDateProp = useMemo(
    () => ymdToLocalNoonDate(maxDate ?? '') ?? undefined,
    [maxDate],
  );

  return (
    <DatePicker
      id={id}
      value={dateValue}
      onChange={(d: DateObject | DateObject[] | null) => {
        if (d == null) {
          onChange('');
          return;
        }
        const selected = Array.isArray(d) ? d[0] : d;
        if (!selected || typeof selected.convert !== 'function') {
          onChange('');
          return;
        }
        onChange(persianPickToGregorianYmd(selected));
      }}
      calendar={persian}
      locale={persian_fa}
      format="YYYY/MM/DD"
      calendarPosition="bottom-center"
      portal
      portalTarget={typeof document !== 'undefined' ? document.body : undefined}
      zIndex={10000}
      minDate={minDateProp}
      maxDate={maxDateProp}
      disabled={disabled}
      editable={false}
      hideOnScroll={false}
      scrollSensitive={false}
      inputClass={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-zafting-accent focus:ring-2 focus:ring-zafting-accent/20 outline-none transition-all text-right font-medium ${className}`}
      containerClassName="w-full"
      className="rmdp-prime teal rmdp-rtl"
      placeholder={placeholder}
    />
  );
}
