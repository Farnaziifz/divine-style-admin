import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, type Column } from '../components/common/Table';
import { UserFilters } from '../components/users/UserFilters';
import { userService, type UserProfile } from '../services/user.service';
import { CheckCircle, XCircle, ShoppingBag, AlertCircle, Eye } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ name?: string; mobile?: string }>({});
  const limit = 10;

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
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
          تعداد کل: <span className="font-bold text-[#2A2A2A]">{total}</span>
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
    </div>
  );
};

export default Users;
