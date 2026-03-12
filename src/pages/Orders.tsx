import { useEffect, useMemo, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { orderService, type Order } from '../services/order.service';
import { Loader2 } from 'lucide-react';

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

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getAll({ page, limit });
      setOrders(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        key: 'id',
        title: 'شناسه',
        render: (order) => (
          <span className="font-mono text-gray-500">{order.id}</span>
        ),
      },
      {
        key: 'user',
        title: 'کاربر',
        render: (order) => formatUser(order),
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
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">مدیریت سفارشات</h1>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
          تعداد کل: <span className="font-bold text-[#2A2A2A]">{total}</span>
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
