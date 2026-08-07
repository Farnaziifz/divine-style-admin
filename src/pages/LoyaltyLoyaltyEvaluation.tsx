import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  loyaltyBiEvaluationService,
  type LoyaltySnapshot,
} from '../services/loyaltyBiEvaluation.service';
import { Loader2 } from 'lucide-react';

const formatNumber = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(value);
};

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(new Date(value));

const formatFullDate = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );

const LoyaltyLoyaltyEvaluation = () => {
  const [latest, setLatest] = useState<LoyaltySnapshot | null>(null);
  const [history, setHistory] = useState<LoyaltySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    Promise.all([
      loyaltyBiEvaluationService.getLoyaltyLatest(),
      loyaltyBiEvaluationService.getLoyaltyHistory(),
    ])
      .then(([latestData, historyData]) => {
        if (cancelled) return;
        setLatest(latestData);
        setHistory(historyData);
      })
      .catch((e) => {
        console.error(e);
        if (cancelled) return;
        setError('خطا در دریافت ارزیابی وفاداری مشتریان');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-serif text-zafting-accent mb-6">
        ارزیابی وفاداری مشتریان — باشگاه مشتریان
      </h1>

      {loading ? (
        <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="animate-spin text-zafting-accent" size={32} />
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">نرخ وفاداری فعلی</h3>
              <p className="text-3xl font-bold text-emerald-700">
                {latest ? `${latest.loyaltyRatePercent}%` : '-'}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {latest ? `آخرین محاسبه: ${formatFullDate(latest.computedAt)}` : 'هنوز محاسبه نشده'}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">کل مشتریان</h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatNumber(latest?.totalCustomers)}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">مشتریان وفادار (vip)</h3>
              <p className="text-3xl font-bold text-amber-600">
                {formatNumber(latest?.loyalCount)}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">امیدوارکننده</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatNumber(latest?.promisingCount)}
              </p>
            </div>
          </div>

          <div className="mt-8 bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10 overflow-hidden">
            <div className="p-5 border-b border-zafting-accent/10">
              <h2 className="text-lg font-bold text-zafting-text">روند نرخ وفاداری</h2>
            </div>
            <div className="p-5">
              {history.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-gray-500">
                  هنوز اسنپ‌شاتی ثبت نشده است
                </div>
              ) : (
                <div className="h-72" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="computedAt"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => formatShortDate(v)}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(value) =>
                          [`${value}%`, 'نرخ وفاداری'] as [string, string]
                        }
                        labelFormatter={(v) => formatFullDate(String(v))}
                      />
                      <Line
                        type="monotone"
                        dataKey="loyaltyRatePercent"
                        stroke="#059669"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
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

export default LoyaltyLoyaltyEvaluation;
