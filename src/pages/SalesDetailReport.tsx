import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { SearchInput } from '../components/common/SearchInput';
import {
  salesDetailReportService,
  type SalesDetailRow,
} from '../services/salesDetailReport.service';

type Row = SalesDetailRow & { id: string };

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatToman = (value: string | number | null | undefined) => {
  if (value == null) return '-';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(num)) + ' تومان';
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const SalesDetailReport = () => {
  const now = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(
    () => toDateInputValue(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    [now],
  );
  const defaultTo = useMemo(() => toDateInputValue(now), [now]);

  const [fromInput, setFromInput] = useState(defaultFrom);
  const [toInput, setToInput] = useState(defaultTo);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [fromInput, toInput, search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = fromInput ? new Date(`${fromInput}T00:00:00`).toISOString() : undefined;
      const to = toInput ? new Date(`${toInput}T23:59:59`).toISOString() : undefined;
      const res = await salesDetailReportService.getDetail({
        from,
        to,
        search: search || undefined,
        page,
        pageSize,
      });
      setRows(res.data.map((r) => ({ ...r, id: r.orderId })));
      setTotal(res.total);
    } catch {
      setError('خطا در دریافت ریز فروش');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fromInput, toInput, search, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<Row>[] = [
    {
      key: 'paidAt',
      title: 'تاریخ پرداخت',
      render: (row) => formatDateTime(row.paidAt),
    },
    { key: 'orderCode', title: 'شماره سفارش' },
    {
      key: 'customer',
      title: 'مشتری',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customerName || '—'}</div>
          <div className="text-xs text-gray-500">{row.customerMobile || '—'}</div>
        </div>
      ),
    },
    { key: 'products', title: 'محصولات' },
    { key: 'quantity', title: 'تعداد' },
    {
      key: 'totalAmount',
      title: 'فروش (قبل تخفیف)',
      render: (row) => formatToman(row.totalAmount),
    },
    {
      key: 'discountAmount',
      title: 'تخفیف',
      render: (row) => formatToman(row.discountAmount),
    },
    {
      key: 'shippingCost',
      title: 'هزینه ارسال',
      render: (row) => formatToman(row.shippingCost),
    },
    {
      key: 'payableAmount',
      title: 'پرداختی نهایی',
      render: (row) => formatToman(row.payableAmount),
      className: 'font-medium',
    },
    {
      key: 'costOfGoods',
      title: 'بهای تمام‌شده',
      render: (row) => formatToman(row.costOfGoods),
    },
    {
      key: 'netProfit',
      title: 'سود خالص',
      render: (row) => (
        <span className="font-medium text-emerald-700">{formatToman(row.netProfit)}</span>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-serif text-zafting-accent mb-6">ریز فروش</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchInput
          onSearch={setSearch}
          placeholder="جستجو با نام مشتری، موبایل یا شماره سفارش..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">از</label>
          <input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
          />
          <label className="text-sm text-gray-500">تا</label>
          <input
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
          />
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : null}

      <Table
        columns={columns}
        data={rows}
        isLoading={loading}
        emptyMessage="سفارشی برای نمایش وجود ندارد"
        pagination={{
          page,
          limit: pageSize,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};

export default SalesDetailReport;
