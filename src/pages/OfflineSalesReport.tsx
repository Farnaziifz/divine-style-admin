import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';
import { JALALI_MONTH_NAMES, getCurrentJalaliYearMonth } from '../utils/persianDate';

type OfflineSalesSummary = {
  range: { from: string; to: string };
  salesCount: number;
  totalAmount: string;
  discountAmount: string;
  commissionAmount: string;
  payableAmount: string;
  netAmount: string;
  costOfGoods: string;
  netProfit: string;
};

type ByChannelRow = {
  channel: string;
  salesCount: number;
  totalAmount: string;
  netAmount: string;
  netProfit: string;
};

type DailyJalaliRow = { day: number; salesCount: number; netAmount: number };
type DailyJalaliResponse = {
  year: number;
  month: number;
  monthName: string;
  monthLength: number;
  data: DailyJalaliRow[];
};

const formatToman = (value: string | number | null | undefined) => {
  if (value == null) return '-';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(num)) + ' تومان';
};

const formatNumber = (value: number | null | undefined) => {
  if (value == null) return '-';
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(value);
};

const OfflineSalesReport = () => {
  const now = useMemo(() => new Date(), []);
  const range = useMemo(() => {
    const to = new Date(now);
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [now]);

  const [summary, setSummary] = useState<OfflineSalesSummary | null>(null);
  const [byChannel, setByChannel] = useState<ByChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<OfflineSalesSummary>('/admin/reports/offline-sales/summary', { params: range }),
      api.get<{ data: ByChannelRow[] }>('/admin/reports/offline-sales/by-channel', {
        params: range,
      }),
    ])
      .then(([summaryRes, channelRes]) => {
        if (cancelled) return;
        setSummary(summaryRes.data);
        setByChannel(channelRes.data.data ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('خطا در دریافت گزارش فروش دستی');
        setSummary(null);
        setByChannel([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const currentJalali = useMemo(() => getCurrentJalaliYearMonth(), []);
  const jalaliYearOptions = useMemo(
    () => [currentJalali.year, currentJalali.year - 1, currentJalali.year - 2],
    [currentJalali.year],
  );

  const [dailyYear, setDailyYear] = useState(currentJalali.year);
  const [dailyMonth, setDailyMonth] = useState(currentJalali.month);
  const [dailyReport, setDailyReport] = useState<DailyJalaliResponse | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const maxDailyMonth = dailyYear === currentJalali.year ? currentJalali.month : 12;

  useEffect(() => {
    if (dailyMonth > maxDailyMonth) setDailyMonth(maxDailyMonth);
  }, [dailyMonth, maxDailyMonth]);

  const fetchDaily = useCallback(async (year: number, month: number) => {
    setDailyLoading(true);
    setDailyError(null);
    try {
      const { data } = await api.get<DailyJalaliResponse>(
        '/admin/reports/offline-sales/daily-jalali',
        { params: { year, month } },
      );
      setDailyReport(data);
    } catch {
      setDailyError('خطا در دریافت فروش روزانه');
      setDailyReport(null);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDaily(dailyYear, dailyMonth);
  }, [dailyYear, dailyMonth, fetchDaily]);

  return (
    <div>
      <h1 className="text-3xl font-serif text-zafting-accent mb-6">گزارش فروش دستی</h1>

      {loading ? (
        <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="animate-spin text-zafting-accent" size={32} />
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">
                فروش دستی ۳۰ روز اخیر
              </h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatToman(summary?.netAmount)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                تعداد فروش: {formatNumber(summary?.salesCount)}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">سود خالص</h3>
              <p className="text-3xl font-bold text-emerald-700">
                {formatToman(summary?.netProfit)}
              </p>
              <p className="mt-2 text-xs text-gray-500">پس از کسر بهای کالا</p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">مجموع تخفیف</h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatToman(summary?.discountAmount)}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">مجموع کمیسیون</h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatToman(summary?.commissionAmount)}
              </p>
            </div>
          </div>

          <div className="mt-8 bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10 overflow-hidden">
            <div className="p-5 border-b border-zafting-accent/10">
              <h2 className="text-lg font-bold text-zafting-text">
                فروش به تفکیک محل فروش (۳۰ روز اخیر)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="text-right text-gray-600">
                    <th className="px-5 py-3 font-medium">محل فروش</th>
                    <th className="px-5 py-3 font-medium">تعداد فروش</th>
                    <th className="px-5 py-3 font-medium">مبلغ خالص</th>
                    <th className="px-5 py-3 font-medium">سود خالص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byChannel.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                        داده‌ای برای نمایش وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    byChannel.map((row) => (
                      <tr key={row.channel} className="bg-white/40">
                        <td className="px-5 py-3 text-gray-900">{row.channel}</td>
                        <td className="px-5 py-3 text-gray-700">
                          {formatNumber(row.salesCount)}
                        </td>
                        <td className="px-5 py-3 text-gray-900 font-medium">
                          {formatToman(row.netAmount)}
                        </td>
                        <td className="px-5 py-3 text-emerald-700 font-medium">
                          {formatToman(row.netProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10 overflow-hidden">
            <div className="p-5 border-b border-zafting-accent/10 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold text-zafting-text">فروش دستی روزانه در ماه</h2>
              <div className="flex items-center gap-2">
                <select
                  value={dailyYear}
                  onChange={(e) => setDailyYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  {jalaliYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={dailyMonth}
                  onChange={(e) => setDailyMonth(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  {JALALI_MONTH_NAMES.map((name, idx) => {
                    const monthNum = idx + 1;
                    if (monthNum > maxDailyMonth) return null;
                    return (
                      <option key={monthNum} value={monthNum}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="p-5">
              {dailyLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <Loader2 className="animate-spin text-zafting-accent" size={28} />
                </div>
              ) : dailyError ? (
                <div className="h-72 flex items-center justify-center text-sm text-red-600">
                  {dailyError}
                </div>
              ) : (
                <div className="h-72" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyReport?.data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => formatNumber(v)}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip
                        formatter={(value: any, name: any) =>
                          name === 'netAmount'
                            ? [formatToman(value), 'فروش']
                            : [formatNumber(value), 'تعداد فروش']
                        }
                        labelFormatter={(day) => `روز ${formatNumber(Number(day))}`}
                      />
                      <Bar dataKey="netAmount" fill="#b08968" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OfflineSalesReport;
