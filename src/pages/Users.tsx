import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { UserFilters } from '../components/users/UserFilters';
import { userService, type UserProfile } from '../services/user.service';
import { CheckCircle, XCircle, ShoppingBag, AlertCircle, Eye, Loader2, UserPlus } from 'lucide-react';

/** ارقام فارسی/عربی را به لاتین تبدیل می‌کند */
const toLatinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ name?: string; mobile?: string }>({});
  const limit = 10;
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const openAdd = () => {
    setNewMobile('');
    setNewName('');
    setNewLastName('');
    setAddError(null);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    setAddError(null);
    if (!/^09\d{9}$/.test(newMobile)) {
      setAddError('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود');
      return;
    }
    setIsAdding(true);
    try {
      const created = await userService.createUser({
        mobile: newMobile,
        name: newName.trim() || undefined,
        lastName: newLastName.trim() || undefined,
      });
      setAddOpen(false);
      navigate(`/users/${created.id}`);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message;
      setAddError(Array.isArray(message) ? message.join('، ') : message || 'خطا در افزودن کاربر');
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, filters);
  }, [page, filters]);

  const fetchUsers = async (
    pageNumber: number,
    currentFilters: { name?: string; mobile?: string }
  ) => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers(pageNumber, limit, currentFilters);
      setUsers(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = useCallback(
    (newFilters: { name?: string; mobile?: string }) => {
      setFilters(newFilters);
      setPage(1);
    },
    []
  );

  const columns: Column<UserProfile>[] = [
    {
      key: 'name',
      title: 'نام و نام خانوادگی',
      render: (user) => (
        <div className="font-medium text-[#2A2A2A]">
          {user.name || user.lastName 
            ? `${user.name || ''} ${user.lastName || ''}`.trim()
            : <span className="text-gray-400 italic">بدون نام</span>}
        </div>
      ),
    },
    {
      key: 'mobile',
      title: 'شماره موبایل',
      render: (user) => (
        <span className="font-mono dir-ltr">{user.mobile}</span>
      ),
      className: 'text-left',
    },
    {
      key: 'hasPassword',
      title: 'رمز عبور',
      render: (user) => (
        <div className="flex justify-center">
            {user.hasPassword ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle size={12} />
                    دارد
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
                    <XCircle size={12} />
                    ندارد
                </span>
            )}
        </div>
      ),
      className: 'text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'isProfileComplete',
      title: 'وضعیت پروفایل',
      render: (user) => (
        <div className="flex justify-center">
            {user.isProfileComplete ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle size={12} />
                    تکمیل
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <AlertCircle size={12} />
                    ناقص
                </span>
            )}
        </div>
      ),
      className: 'text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'ordersCount',
      title: 'تعداد سفارشات',
      render: (user) => (
        <div className="flex items-center gap-1 text-gray-600">
            <ShoppingBag size={16} />
            <span>{user.ordersCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (user) => (
        <div className="flex justify-center">
            <Link
                to={`/users/${user.id}`}
                className="p-2 text-gray-500 hover:text-[#6B5B54] hover:bg-[#6B5B54]/10 rounded-lg transition-colors"
                title="مشاهده جزئیات"
            >
                <Eye size={18} />
            </Link>
        </div>
      ),
      className: 'text-center',
      headerClassName: 'text-center',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">مدیریت کاربران</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
            تعداد کل: <span className="font-bold text-[#2A2A2A]">{total}</span>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <UserPlus size={18} />
            افزودن کاربر
          </button>
        </div>
      </div>

      <UserFilters onFilterChange={handleFilterChange} />

      <Table
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="کاربری یافت نشد"
        pagination={{
          page,
          limit,
          total,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="افزودن کاربر"
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          {addError && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">
              {addError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شماره موبایل</label>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              maxLength={11}
              value={newMobile}
              onChange={(e) => setNewMobile(toLatinDigits(e.target.value).replace(/[^0-9]/g, ''))}
              placeholder="09123456789"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent text-left"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام (اختیاری)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام خانوادگی (اختیاری)
              </label>
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-zafting-accent"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            حساب بدون رمز ساخته می‌شود و کاربر با کد پیامکی وارد می‌شود. پیامکی ارسال نمی‌شود.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zafting-accent text-white font-medium hover:opacity-90 disabled:opacity-60"
            >
              {isAdding && <Loader2 className="animate-spin" size={16} />}
              افزودن
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
