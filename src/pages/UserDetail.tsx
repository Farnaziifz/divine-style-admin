import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, type UserProfile } from '../services/user.service';
import { orderService, type Order } from '../services/order.service';
import {
  paymentTransactionService,
  type PaymentTransaction,
} from '../services/paymentTransaction.service';
import { Tabs } from '../components/common/Tabs';
import { Table, type Column } from '../components/common/Table';
import { OrderDetailsModal } from '../components/features/OrderDetailsModal';
import {
  ArrowRight,
  User,
  ShoppingBag,
  CreditCard,
  Loader2,
} from 'lucide-react';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
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

const formatPrice = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
};

const paymentProviderLabel = (provider?: string) => {
  if (provider === 'ZARINPAL') return 'زرین‌پال';
  return provider || '-';
};

const paymentStatusLabel = (status?: PaymentTransaction['status']) => {
  if (status === 'PAID') return 'موفق';
  if (status === 'FAILED') return 'ناموفق';
  if (status === 'INITIATED') return 'در انتظار';
  return status || '—';
};

const paymentStatusBadge = (status?: PaymentTransaction['status']) => {
  if (status === 'PAID') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'FAILED') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotal, setPaymentsTotal] = useState(0);

  useEffect(() => {
    if (id) fetchUser(id);
  }, [id]);

  const fetchUser = async (userId: string) => {
    try {
      const data = await userService.getUserById(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!id) return;
    setOrdersLoading(true);
    try {
      const response = await orderService.getAll({
        page: ordersPage,
        limit: 10,
        userId: id,
      });
      setOrders(response.data);
      setOrdersTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [id, ordersPage]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  const fetchPayments = useCallback(async () => {
    if (!id) return;
    setPaymentsLoading(true);
    try {
      const response = await paymentTransactionService.getAll({
        page: paymentsPage,
        limit: 10,
        userId: id,
      });
      setPayments(response.data);
      setPaymentsTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setPaymentsLoading(false);
    }
  }, [id, paymentsPage]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, fetchPayments]);

  const orderColumns: Column<Order>[] = useMemo(
    () => [
      {
        key: 'orderCode',
        title: 'کد سفارش',
        render: (order) => <span className="font-mono text-gray-700">{order.orderCode}</span>,
      },
      {
        key: 'createdAt',
        title: 'تاریخ',
        render: (order) => formatDateTime(order.createdAt),
      },
      {
        key: 'payableAmount',
        title: 'مبلغ کل',
        render: (order) => formatPrice(order.payableAmount),
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
        key: 'actions',
        title: 'عملیات',
        render: (order) => (
          <button
            onClick={() => setSelectedOrderCode(order.orderCode)}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
          >
            جزئیات
          </button>
        ),
      },
    ],
    []
  );

  const paymentColumns: Column<PaymentTransaction>[] = useMemo(
    () => [
      {
        key: 'orderCode',
        title: 'کد سفارش',
        render: (tx) => (
          <span className="font-mono text-gray-700">
            {tx.order?.orderCode || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        title: 'تاریخ',
        render: (tx) => formatDateTime(tx.createdAt),
      },
      {
        key: 'amount',
        title: 'مبلغ (تومان)',
        render: (tx) => formatPrice(tx.amount),
      },
      {
        key: 'provider',
        title: 'درگاه',
        render: (tx) => paymentProviderLabel(tx.provider),
      },
      {
        key: 'status',
        title: 'وضعیت',
        render: (tx) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${paymentStatusBadge(
              tx.status,
            )}`}
          >
            {paymentStatusLabel(tx.status)}
          </span>
        ),
      },
      {
        key: 'refId',
        title: 'RefID',
        render: (tx) => (
          <span className="font-mono text-gray-700">{tx.refId || '—'}</span>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <Loader2 className="animate-spin text-[#6B5B54]" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
            <p className="text-gray-500">کاربر یافت نشد</p>
            <Link to="/users" className="text-[#6B5B54] underline">بازگشت به لیست کاربران</Link>
        </div>
    );
  }

  const tabs = [
    {
      id: 'orders',
      label: 'سفارشات',
      icon: <ShoppingBag size={18} />,
      content: ordersLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#6B5B54]" size={32} />
        </div>
      ) : (
        <Table
          columns={orderColumns}
          data={orders}
          emptyMessage="سفارشی یافت نشد"
          pagination={{
            page: ordersPage,
            limit: 10,
            total: ordersTotal,
            onPageChange: setOrdersPage,
          }}
        />
      ),
    },
    {
      id: 'payments',
      label: 'تراکنش‌ها',
      icon: <CreditCard size={18} />,
      content: paymentsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#6B5B54]" size={32} />
        </div>
      ) : (
        <Table
          columns={paymentColumns}
          data={payments}
          emptyMessage="تراکنشی یافت نشد"
          pagination={{
            page: paymentsPage,
            limit: 10,
            total: paymentsTotal,
            onPageChange: setPaymentsPage,
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/users" className="p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-gray-600">
            <ArrowRight size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#2A2A2A]">جزئیات کاربر</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#6B5B54]/10 flex items-center justify-center text-[#6B5B54]">
                <User size={40} />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                    <span className="text-xs text-gray-400">نام و نام خانوادگی</span>
                    <p className="font-bold text-[#2A2A2A]">{user.name || user.lastName ? `${user.name || ''} ${user.lastName || ''}` : '-'}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-xs text-gray-400">شماره موبایل</span>
                    <p className="font-bold text-[#2A2A2A] dir-ltr text-right">{user.mobile}</p>
                </div>
                 <div className="space-y-1">
                    <span className="text-xs text-gray-400">کد ملی</span>
                    <p className="font-bold text-[#2A2A2A]">{user.nationalCode || '-'}</p>
                </div>
                 <div className="space-y-1">
                    <span className="text-xs text-gray-400">شغل</span>
                    <p className="font-bold text-[#2A2A2A]">{user.job || '-'}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {selectedOrderCode && (
        <OrderDetailsModal
          orderCode={selectedOrderCode}
          onClose={() => {
            setSelectedOrderCode(null);
            fetchOrders(); // Refresh orders list in case status changed
          }}
        />
      )}
    </div>
  );
};

export default UserDetail;
