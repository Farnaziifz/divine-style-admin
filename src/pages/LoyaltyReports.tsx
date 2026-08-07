import { useEffect, useState } from 'react';
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
import { Table, type Column } from '../components/common/Table';
import { Tabs } from '../components/common/Tabs';
import {
  loyaltyIncentiveReportService,
  type IncentiveReportRow,
  type IncentiveType,
  type ReportPeriod,
  type SegmentReportRow,
} from '../services/loyaltyIncentiveReport.service';
import { Loader2 } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  vip: 'مشتریان ویژه',
  new: 'مشتریان جدید',
  at_risk: 'در معرض ریزش',
  lost: 'از دست رفته',
  regular: 'مشتریان عادی',
};

const INCENTIVE_TYPE_LABELS: Record<IncentiveType, string> = {
  DISCOUNT_CODE: 'کد تخفیف',
  CASHBACK: 'کش‌بک',
  COUPON: 'کوپن',
};

const PERIOD_TABS: { id: ReportPeriod; label: string }[] = [
  { id: 'week', label: 'هفتگی' },
  { id: 'month', label: 'ماهانه' },
  { id: 'year', label: 'سالانه' },
];

const formatToman = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';

const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(Math.round(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value));

type IncentiveRow = IncentiveReportRow & { id: string };
type SegmentRow = SegmentReportRow & { id: string; segmentLabel: string };

const LoyaltyReports = () => {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [byIncentive, setByIncentive] = useState<IncentiveRow[]>([]);
  const [bySegment, setBySegment] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    loyaltyIncentiveReportService
      .getPerformance(period)
      .then((data) => {
        if (cancelled) return;
        setRange(data.range);
        setByIncentive(data.byIncentive.map((r) => ({ ...r, id: r.incentiveId })));
        setBySegment(
          data.bySegment.map((r) => ({
            ...r,
            id: r.segmentKey,
            segmentLabel: SEGMENT_LABELS[r.segmentKey] ?? r.segmentKey,
          })),
        );
      })
      .catch((e) => {
        console.error(e);
        if (cancelled) return;
        setError('خطا در دریافت گزارش عملکرد مشوق‌ها');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const incentiveColumns: Column<IncentiveRow>[] = [
    { key: 'title', title: 'مشوق', render: (r) => r.title },
    {
      key: 'type',
      title: 'نوع',
      render: (r) => (
        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">
          {INCENTIVE_TYPE_LABELS[r.type]}
        </span>
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
      key: 'redemptionsCount',
      title: 'تعداد استفاده',
      render: (r) => formatNumber(r.redemptionsCount),
    },
    {
      key: 'totalCost',
      title: 'هزینه',
      render: (r) => <span className="text-red-600 font-medium">{formatToman(r.totalCost)}</span>,
    },
    {
      key: 'totalRevenue',
      title: 'درآمد نسبت‌داده‌شده',
      render: (r) => (
        <span className="text-emerald-700 font-medium">{formatToman(r.totalRevenue)}</span>
      ),
    },
    {
      key: 'eligiblePoolSize',
      title: 'استخر واجد شرایط',
      render: (r) => formatNumber(r.eligiblePoolSize),
    },
    {
      key: 'successRatePercent',
      title: 'نرخ موفقیت',
      render: (r) => `${r.successRatePercent}%`,
    },
  ];

  const segmentColumns: Column<SegmentRow>[] = [
    { key: 'segmentLabel', title: 'سگمنت', render: (r) => r.segmentLabel },
    { key: 'segmentSize', title: 'تعداد مشتریان', render: (r) => formatNumber(r.segmentSize) },
    {
      key: 'redemptionsCount',
      title: 'تعداد استفاده',
      render: (r) => formatNumber(r.redemptionsCount),
    },
    {
      key: 'totalCost',
      title: 'هزینه',
      render: (r) => <span className="text-red-600 font-medium">{formatToman(r.totalCost)}</span>,
    },
    {
      key: 'totalRevenue',
      title: 'درآمد نسبت‌داده‌شده',
      render: (r) => (
        <span className="text-emerald-700 font-medium">{formatToman(r.totalRevenue)}</span>
      ),
    },
    {
      key: 'successRatePercent',
      title: 'نرخ موفقیت',
      render: (r) => `${r.successRatePercent}%`,
    },
  ];

  const reportBody = (
    <div className="space-y-8">
      {range && (
        <p className="text-xs text-gray-500 dir-ltr text-right">
          {formatDate(range.from)} — {formatDate(range.to)}
        </p>
      )}

      <div className="bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10 overflow-hidden">
        <div className="p-5 border-b border-zafting-accent/10">
          <h2 className="text-lg font-bold text-zafting-text">هزینه و درآمد به‌تفکیک مشوق</h2>
        </div>
        <div className="p-5">
          {byIncentive.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-500">
              مشوقی برای نمایش نیست
            </div>
          ) : (
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byIncentive}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis yAxisId="money" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numericValue = Number(value);
                      if (name === 'successRatePercent')
                        return [`${numericValue}%`, 'نرخ موفقیت'] as [string, string];
                      if (name === 'totalCost')
                        return [formatToman(numericValue), 'هزینه'] as [string, string];
                      return [formatToman(numericValue), 'درآمد'] as [string, string];
                    }}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === 'totalCost'
                        ? 'هزینه'
                        : value === 'totalRevenue'
                          ? 'درآمد'
                          : 'نرخ موفقیت'
                    }
                  />
                  <Bar yAxisId="money" dataKey="totalCost" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar
                    yAxisId="money"
                    dataKey="totalRevenue"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="successRatePercent"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table columns={incentiveColumns} data={byIncentive} emptyMessage="مشوقی ثبت نشده است" />
        )}
      </div>

      <div className="bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10 overflow-hidden">
        <div className="p-5 border-b border-zafting-accent/10">
          <h2 className="text-lg font-bold text-zafting-text">هزینه و درآمد به‌تفکیک سگمنت</h2>
        </div>
        <div className="p-5">
          {bySegment.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-500">
              داده‌ای برای نمایش نیست
            </div>
          ) : (
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bySegment}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="segmentLabel" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis yAxisId="money" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numericValue = Number(value);
                      if (name === 'successRatePercent')
                        return [`${numericValue}%`, 'نرخ موفقیت'] as [string, string];
                      if (name === 'totalCost')
                        return [formatToman(numericValue), 'هزینه'] as [string, string];
                      return [formatToman(numericValue), 'درآمد'] as [string, string];
                    }}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === 'totalCost'
                        ? 'هزینه'
                        : value === 'totalRevenue'
                          ? 'درآمد'
                          : 'نرخ موفقیت'
                    }
                  />
                  <Bar yAxisId="money" dataKey="totalCost" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar
                    yAxisId="money"
                    dataKey="totalRevenue"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="successRatePercent"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table columns={segmentColumns} data={bySegment} emptyMessage="داده‌ای ثبت نشده است" />
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-serif text-zafting-accent mb-6">
        گزارش‌ها — باشگاه مشتریان
      </h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <Tabs
        tabs={PERIOD_TABS.map((t) => ({ id: t.id, label: t.label, content: reportBody }))}
        activeTab={period}
        onTabChange={(id) => setPeriod(id as ReportPeriod)}
      />
    </div>
  );
};

export default LoyaltyReports;
