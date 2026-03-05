import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, type UserProfile } from '../services/user.service';
import { Tabs } from '../components/common/Tabs';
import { Table } from '../components/common/Table';
import {
  ArrowRight,
  User,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Heart,
  Loader2,
} from 'lucide-react';

// Mock Data
const mockOrders = [
  { id: 'ORD-1001', date: '1402/12/01', total: '12,500,000', status: 'تکمیل شده', items: 3 },
  { id: 'ORD-1002', date: '1402/11/15', total: '8,200,000', status: 'لغو شده', items: 1 },
];

const mockPayments = [
  { id: 'PAY-5001', date: '1402/12/01', amount: '12,500,000', method: 'درگاه زرین‌پال', status: 'موفق' },
  { id: 'PAY-5002', date: '1402/11/15', amount: '8,200,000', method: 'کارت به کارت', status: 'ناموفق' },
];

const mockComments = [
  { id: 'CMT-1', product: 'مانتو کتان کرم', content: 'کیفیت دوخت عالی بود، ممنون.', date: '1402/12/05', status: 'تایید شده' },
  { id: 'CMT-2', product: 'شلوار جین راسته', content: 'سایزش کمی بزرگ بود.', date: '1402/11/20', status: 'در انتظار بررسی' },
];

const mockWishlist = [
  { id: 'PRD-1', title: 'شومیز مجلسی سفید', price: '1,800,000', addedAt: '1402/10/01' },
  { id: 'PRD-2', title: 'کت چرم مشکی', price: '4,500,000', addedAt: '1402/10/15' },
];

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

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
      content: (
        <Table
          columns={[
            { key: 'id', title: 'شماره سفارش' },
            { key: 'date', title: 'تاریخ' },
            { key: 'items', title: 'تعداد اقلام' },
            { key: 'total', title: 'مبلغ کل (تومان)' },
            { key: 'status', title: 'وضعیت' },
          ]}
          data={mockOrders}
          emptyMessage="سفارشی یافت نشد"
        />
      ),
    },
    {
      id: 'payments',
      label: 'تراکنش‌ها',
      icon: <CreditCard size={18} />,
      content: (
        <Table
          columns={[
            { key: 'id', title: 'شماره تراکنش' },
            { key: 'date', title: 'تاریخ' },
            { key: 'amount', title: 'مبلغ (تومان)' },
            { key: 'method', title: 'روش پرداخت' },
            { key: 'status', title: 'وضعیت' },
          ]}
          data={mockPayments}
          emptyMessage="تراکنشی یافت نشد"
        />
      ),
    },
    {
      id: 'comments',
      label: 'دیدگاه‌ها',
      icon: <MessageSquare size={18} />,
      content: (
        <Table
          columns={[
            { key: 'product', title: 'محصول' },
            { key: 'content', title: 'متن دیدگاه' },
            { key: 'date', title: 'تاریخ' },
            { key: 'status', title: 'وضعیت' },
          ]}
          data={mockComments}
          emptyMessage="دیدگاهی یافت نشد"
        />
      ),
    },
    {
      id: 'wishlist',
      label: 'علاقمندی‌ها',
      icon: <Heart size={18} />,
      content: (
        <Table
          columns={[
            { key: 'title', title: 'محصول' },
            { key: 'price', title: 'قیمت (تومان)' },
            { key: 'addedAt', title: 'تاریخ افزودن' },
          ]}
          data={mockWishlist}
          emptyMessage="لیست علاقمندی خالی است"
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
    </div>
  );
};

export default UserDetail;
