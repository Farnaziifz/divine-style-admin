import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

type SalesSummary = {
  range: { from: string; to: string };
  ordersCount: number;
  itemsCount: number;
  orderItemsCount: number;
  totalAmount: string;
  discountAmount: string;
  shippingCost: string;
  payableAmount: string;
  averageOrderValue: string;
};

type TopProductRow = {
  productId: string;
  title: string;
  quantity: number;
  ordersCount: number;
  revenue: string;
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

const Dashboard = () => {
  const now = useMemo(() => new Date(), []);
  const range = useMemo(() => {
    const to = new Date(now);
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [now]);

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
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
      api.get<SalesSummary>('/admin/reports/sales/summary', { params: range }),
      api.get<{ data: TopProductRow[] }>('/admin/reports/sales/top-products', {
        params: { ...range, limit: 5 },
      }),
    ])
      .then(([summaryRes, topRes]) => {
        if (cancelled) return;
        setSummary(summaryRes.data);
        setTopProducts(topRes.data.data ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('خطا در دریافت گزارش فروش');
        setSummary(null);
        setTopProducts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div>
      <h1 className="text-3xl font-serif text-zafting-accent mb-6">داشبورد</h1>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">
                فروش ۳۰ روز اخیر
              </h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatToman(summary?.payableAmount)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                میانگین هر سفارش: {formatToman(summary?.averageOrderValue)}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">
                تعداد سفارش (پرداخت‌شده)
              </h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatNumber(summary?.ordersCount)}
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
              <h3 className="text-lg font-medium text-zafting-text mb-2">
                تعداد آیتم فروخته‌شده
              </h3>
              <p className="text-3xl font-bold text-zafting-accent">
                {formatNumber(summary?.itemsCount)}
              </p>
            </div>
          </div>

          <div className="mt-8 bg-white/60 rounded-xl shadow-sm border border-zafting-accent/10 overflow-hidden">
            <div className="p-5 border-b border-zafting-accent/10">
              <h2 className="text-lg font-bold text-zafting-text">
                پرفروش‌ترین محصولات (۳۰ روز اخیر)
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-6 text-center text-gray-500"
                      >
                        داده‌ای برای نمایش وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((row) => (
                      <tr key={row.productId} className="bg-white/40">
                        <td className="px-5 py-3 text-gray-900">{row.title}</td>
                        <td className="px-5 py-3 text-gray-700">
                          {formatNumber(row.quantity)}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {formatNumber(row.ordersCount)}
                        </td>
                        <td className="px-5 py-3 text-gray-900 font-medium">
                          {formatToman(row.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
