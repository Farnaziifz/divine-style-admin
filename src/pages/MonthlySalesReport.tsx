import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { JALALI_MONTH_NAMES, getCurrentJalaliYearMonth } from '../utils/persianDate';
import {
  monthlySalesReportService,
  type MonthlyReportResponse,
} from '../services/monthlySalesReport.service';

const formatToman = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
};

const formatNumber = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(value);
};

/** درصد تغییر نسبت به ماه قبل؛ اگر ماه قبل صفر بوده null */
const changePercent = (current: number, previous: number) => {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const Change = ({ current, previous, label }: { current: number; previous: number; label: string }) => {
  const pct = changePercent(current, previous);
  if (pct == null) {
    return <p className="mt-2 text-xs text-gray-500">ماه قبل ({label}) داده‌ای ندارد</p>;
  }
  const up = pct >= 0;
  return (
    <p className={`mt-2 text-xs ${up ? 'text-emerald-700' : 'text-red-600'}`}>
      {up ? '▲' : '▼'} {formatNumber(Math.abs(Math.round(pct * 10) / 10))}٪ نسبت به {label}
    </p>
  );
};

const Row = ({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: number;
  strong?: boolean;
  negative?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 py-2 text-sm">
    <span className={strong ? 'font-bold text-zafting-text' : 'text-gray-600'}>{label}</span>
    <span className={strong ? 'font-bold text-emerald-700' : 'text-gray-900'}>
      {negative ? '− ' : ''}
      {formatToman(value)}
    </span>
  </div>
);

const MonthlySalesReport = () => {
  const current = useMemo(() => getCurrentJalaliYearMonth(), []);
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => current.year - i),
    [current.year],
  );

  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maxMonth = year === current.year ? current.month : 12;

  useEffect(() => {
    if (month > maxMonth) setMonth(maxMonth);
  }, [month, maxMonth]);

  const fetchReport = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      setReport(await monthlySalesReportService.get(y, m));
    } catch {
      setError('خطا در دریافت گزارش فروش ماهانه');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(year, month);
  }, [year, month, fetchReport]);

  const card = 'bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-serif text-zafting-accent">گزارش فروش ماهانه</h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
          >
            {JALALI_MONTH_NAMES.map((name, idx) =>
              idx + 1 > maxMonth ? null : (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ),
            )}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="animate-spin text-zafting-accent" size={32} />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className={`${card} p-6`}>
              <h3 className="text-lg font-medium text-zafting-text mb-2">
                فروش کل {report.monthName} {report.year}
              </h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatToman(report.total.payableAmount)}
              </p>
              <Change
                current={report.total.payableAmount}
                previous={report.previous.payableAmount}
                label={report.previous.monthName}
              />
            </div>
            <div className={`${card} p-6`}>
              <h3 className="text-lg font-medium text-zafting-text mb-2">سود خالص</h3>
              <p className="text-3xl font-bold text-emerald-700">
                {formatToman(report.total.netProfit)}
              </p>
              <Change
                current={report.total.netProfit}
                previous={report.previous.netProfit}
                label={report.previous.monthName}
              />
            </div>
            <div className={`${card} p-6`}>
              <h3 className="text-lg font-medium text-zafting-text mb-2">تعداد فروش</h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatNumber(report.total.count)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                سایت: {formatNumber(report.online.ordersCount)} · حضوری/اینستا:{' '}
                {formatNumber(report.offline.salesCount)}
              </p>
            </div>
            <div className={`${card} p-6`}>
              <h3 className="text-lg font-medium text-zafting-text mb-2">حاشیه سود</h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {report.total.payableAmount > 0
                  ? `${formatNumber(
                      Math.round((report.total.netProfit / report.total.payableAmount) * 1000) / 10,
                    )}٪`
                  : '-'}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                میانگین هر سفارش سایت: {formatToman(report.online.averageOrderValue)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${card} p-5`}>
              <h2 className="text-lg font-bold text-zafting-text mb-2">جزئیات فروش سایت</h2>
              <div className="divide-y divide-gray-100">
                <Row label="فروش (قبل از تخفیف)" value={report.online.totalAmount} />
                <Row label="تخفیف" value={report.online.discountAmount} negative />
                <Row label="مبلغ پرداختی نهایی" value={report.online.payableAmount} />
                <Row label="بهای تمام‌شده کالا" value={report.online.costOfGoods} negative />
                <Row label="هزینه ارسال" value={report.online.shippingCost} negative />
                <Row label="هزینه بسته‌بندی" value={report.online.packagingCost} negative />
                <Row label="سود خالص سایت" value={report.online.netProfit} strong />
              </div>
              <p className="mt-3 text-xs text-gray-500">
                تعداد سفارش: {formatNumber(report.online.ordersCount)} · تعداد آیتم:{' '}
                {formatNumber(report.online.itemsCount)}
              </p>
            </div>

            <div className={`${card} p-5`}>
              <h2 className="text-lg font-bold text-zafting-text mb-2">
                جزئیات فروش حضوری/اینستا
              </h2>
              <div className="divide-y divide-gray-100">
                <Row label="فروش (قبل از تخفیف)" value={report.offline.totalAmount} />
                <Row label="تخفیف" value={report.offline.discountAmount} negative />
                <Row label="مبلغ پرداختی مشتری" value={report.offline.payableAmount} />
                <Row label="کمیسیون" value={report.offline.commissionAmount} negative />
                <Row label="خالص دریافتی" value={report.offline.netAmount} />
                <Row label="بهای تمام‌شده کالا" value={report.offline.costOfGoods} negative />
                <Row label="سود خالص حضوری/اینستا" value={report.offline.netProfit} strong />
              </div>
              <p className="mt-3 text-xs text-gray-500">
                تعداد فروش: {formatNumber(report.offline.salesCount)}
              </p>
            </div>
          </div>

          <div className={`mt-8 ${card} overflow-hidden`}>
            <div className="p-5 border-b border-zafting-accent/10">
              <h2 className="text-lg font-bold text-zafting-text">
                نمودار روزانه فروش و سود — {report.monthName}
              </h2>
            </div>
            <div className="p-5">
              <div className="h-80" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={report.daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                    <Tooltip
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          onlinePayableAmount: 'فروش سایت',
                          offlinePayableAmount: 'فروش حضوری/اینستا',
                          netProfit: 'سود خالص',
                        };
                        return [formatToman(Number(value)), labels[String(name)] ?? String(name)];
                      }}
                      labelFormatter={(day) => `روز ${formatNumber(Number(day))}`}
                    />
                    <Legend
                      formatter={(value) =>
                        value === 'onlinePayableAmount'
                          ? 'فروش سایت'
                          : value === 'offlinePayableAmount'
                            ? 'فروش حضوری/اینستا'
                            : 'سود خالص'
                      }
                    />
                    <Bar dataKey="onlinePayableAmount" stackId="sales" fill="#7c9885" />
                    <Bar
                      dataKey="offlinePayableAmount"
                      stackId="sales"
                      fill="#b08968"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="netProfit"
                      stroke="#047857"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={`mt-8 ${card} overflow-hidden`}>
            <div className="p-5 border-b border-zafting-accent/10">
              <h2 className="text-lg font-bold text-zafting-text">
                پرفروش‌ترین محصولات سایت — {report.monthName}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="text-right text-gray-600">
                    <th className="px-5 py-3 font-medium">محصول</th>
                    <th className="px-5 py-3 font-medium">تعداد</th>
                    <th className="px-5 py-3 font-medium">تعداد سفارش</th>
                    <th className="px-5 py-3 font-medium">درآمد</th>
                    <th className="px-5 py-3 font-medium">بهای تمام‌شده</th>
                    <th className="px-5 py-3 font-medium">سود ناخالص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-gray-500">
                        داده‌ای برای نمایش وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    report.topProducts.map((row) => (
                      <tr key={row.productId} className="bg-white/40">
                        <td className="px-5 py-3 text-gray-900">{row.title}</td>
                        <td className="px-5 py-3 text-gray-700">{formatNumber(row.quantity)}</td>
                        <td className="px-5 py-3 text-gray-700">{formatNumber(row.ordersCount)}</td>
                        <td className="px-5 py-3 text-gray-900 font-medium">
                          {formatToman(row.revenue)}
                        </td>
                        <td className="px-5 py-3 text-gray-700">{formatToman(row.costOfGoods)}</td>
                        <td className="px-5 py-3 text-emerald-700 font-medium">
                          {formatToman(row.grossProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`mt-8 ${card} overflow-hidden`}>
            <div className="p-5 border-b border-zafting-accent/10">
              <h2 className="text-lg font-bold text-zafting-text">
                فروش حضوری/اینستا به تفکیک محل فروش — {report.monthName}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="text-right text-gray-600">
                    <th className="px-5 py-3 font-medium">محل فروش</th>
                    <th className="px-5 py-3 font-medium">تعداد فروش</th>
                    <th className="px-5 py-3 font-medium">مبلغ پرداختی</th>
                    <th className="px-5 py-3 font-medium">سود خالص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.offlineChannels.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                        داده‌ای برای نمایش وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    report.offlineChannels.map((row) => (
                      <tr key={row.channel} className="bg-white/40">
                        <td className="px-5 py-3 text-gray-900">{row.channel}</td>
                        <td className="px-5 py-3 text-gray-700">{formatNumber(row.salesCount)}</td>
                        <td className="px-5 py-3 text-gray-900 font-medium">
                          {formatToman(row.payableAmount)}
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
        </>
      ) : null}
    </div>
  );
};

export default MonthlySalesReport;
