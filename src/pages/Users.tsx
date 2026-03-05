import { useState, useEffect } from 'react';
import { Table, type Column } from '../components/common/Table';
import { userService, type UserProfile } from '../services/user.service';
import { CheckCircle, XCircle, ShoppingBag, AlertCircle } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

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
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">مدیریت کاربران</h1>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
            تعداد کل: <span className="font-bold text-[#2A2A2A]">{users.length}</span>
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="کاربری یافت نشد"
      />
    </div>
  );
};

export default Users;
