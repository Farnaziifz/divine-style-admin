import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { orderService, type Order } from '../services/order.service';
import { Loader2 } from 'lucide-react';
import { SearchInput } from '../components/common/SearchInput';
import { toEnglishDigits } from '../utils/digits';
import { Link } from 'react-router-dom';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatUser = (order: Order) => {
  if (!order.user) return order.userId;
  const fullName = `${order.user.name || ''} ${order.user.lastName || ''}`.trim();
  return fullName ? `${fullName} (${order.user.mobile})` : order.user.mobile;
};

const highlightMatch = (text: string, query: string) => {
  if (!query) return <span className="font-mono text-gray-700">{text}</span>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) return <span className="font-mono text-gray-700">{text}</span>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <span className="font-mono text-gray-700">
      {before}
      <span className="bg-yellow-200 text-zafting-accent px-1 rounded-md">
        {match}
      </span>
      {after}
    </span>
  );
};

const statusBadge = (status?: Order['orderStatus']) => {
  if (status === 'DELIVERED') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'CANCELED') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'SHIPPED') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'CONFIRMED') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (status === 'PAID') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const statusLabel = (status?: Order['orderStatus']) => {
  if (status === 'PENDING_PAYMENT') return 'در انتظار پرداخت';
  if (status === 'PAID') return 'پرداخت شده';
  if (status === 'CONFIRMED') return 'تایید شده';
  if (status === 'SHIPPED') return 'ارسال شده';
  if (status === 'DELIVERED') return 'دریافت شده';
  if (status === 'CANCELED') return 'لغو شده';
  return 'در انتظار پرداخت';
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = useMemo(() => {
    return toEnglishDigits(searchQuery.trim()).toLowerCase();
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getAll({
        page,
        limit,
        ...(normalizedQuery ? { q: normalizedQuery } : {}),
      });
      setOrders(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, normalizedQuery, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        key: 'orderCode',
        title: 'کد سفارش',
        render: (order) => (
          order.orderCode ? highlightMatch(order.orderCode, normalizedQuery) : '-'
        ),
      },
      {
        key: 'user',
        title: 'کاربر',
        render: (order) => formatUser(order),
      },
      {
        key: 'orderStatus',
        title: 'وضعیت',
        render: (order) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(order.orderStatus)}`}
          >
            {statusLabel(order.orderStatus)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        title: 'تاریخ ثبت',
        render: (order) => formatDateTime(order.createdAt),
      },
      {
        key: 'updatedAt',
        title: 'آخرین بروزرسانی',
        render: (order) => formatDateTime(order.updatedAt),
      },
      {
        key: 'actions',
        title: 'عملیات',
        render: (order) => (
          <Link
            to={`/orders/${encodeURIComponent(order.orderCode)}`}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
          >
            جزئیات
          </Link>
        ),
      },
    ],
    [normalizedQuery]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">مدیریت سفارشات</h1>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
          تعداد کل: <span className="font-bold text-[#2A2A2A]">{total}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            onSearch={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            placeholder="جستجو بر اساس کد سفارش (مثلاً 123456)"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="animate-spin text-zafting-accent" size={32} />
        </div>
      ) : (
        <Table
          columns={columns}
          data={orders}
          emptyMessage="سفارشی یافت نشد"
          pagination={{
            page,
            limit,
            total,
            onPageChange: (p) => setPage(p),
          }}
        />
      )}
    </div>
  );
};

export default Orders;
