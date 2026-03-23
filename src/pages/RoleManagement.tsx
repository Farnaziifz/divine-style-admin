import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Loader2, Save, UsersRound } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Table, type Column } from '../components/common/Table';
import { SearchInput } from '../components/common/SearchInput';
import { Select } from '../components/common/Select';
import { userService, type UserProfile } from '../services/user.service';

type PermissionOption = {
  key: string;
  label: string;
};

const permissionOptions: PermissionOption[] = [
  { key: 'ORDERS_READ', label: 'مشاهده سفارشات' },
  { key: 'ORDERS_WRITE', label: 'تغییر وضعیت سفارش' },
  { key: 'PRODUCTS_WRITE', label: 'مدیریت محصولات' },
  { key: 'DISCOUNTS_WRITE', label: 'مدیریت کدهای تخفیف' },
  { key: 'USERS_MANAGE', label: 'مدیریت کاربران و نقش‌ها' },
  { key: 'SITE_SETTINGS_MANAGE', label: 'تنظیمات سایت' },
];

const normalizePermissions = (p?: string[]) => (Array.isArray(p) ? p : []);

const RoleManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftRole, setDraftRole] = useState<UserProfile['role']>('USER');
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentUserRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { role?: string };
      return parsed.role ?? null;
    } catch {
      return null;
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers(page, limit, {
        ...(query ? { name: query, mobile: query } : {}),
      });
      setUsers(response.data);
      setTotal(response.meta.total);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAccessModal = useCallback((u: UserProfile) => {
    setSelectedUser(u);
    setDraftRole(u.role);
    setDraftPermissions(normalizePermissions(u.permissions));
    setIsModalOpen(true);
  }, []);

  const roleOptions = useMemo(
    () => [
      { label: 'کاربر معمولی', value: 'USER' },
      { label: 'اپراتور', value: 'OPERATOR' },
      { label: 'ادمین', value: 'ADMIN' },
    ],
    [],
  );

  const roleLabel = useCallback((role: UserProfile['role']) => {
    if (role === 'ADMIN') return 'ادمین';
    if (role === 'OPERATOR') return 'اپراتور';
    return 'کاربر';
  }, []);

  const roleBadgeClass = useCallback((role: UserProfile['role']) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (role === 'OPERATOR') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }, []);

  const columns: Column<UserProfile>[] = useMemo(
    () => [
      {
        key: 'mobile',
        title: 'موبایل',
        render: (u) => <span className="font-mono dir-ltr">{u.mobile}</span>,
      },
      {
        key: 'name',
        title: 'نام',
        render: (u) => {
          const fullName = [u.name, u.lastName].filter(Boolean).join(' ');
          return fullName || '—';
        },
      },
      {
        key: 'role',
        title: 'نقش',
        render: (u) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${roleBadgeClass(
              u.role,
            )}`}
          >
            {roleLabel(u.role)}
          </span>
        ),
      },
      {
        key: 'permissions',
        title: 'دسترسی‌ها',
        render: (u) => {
          const perms = normalizePermissions(u.permissions);
          if (u.role !== 'OPERATOR') return <span className="text-gray-400">—</span>;
          if (!perms.length) return <span className="text-gray-400">بدون دسترسی</span>;
          const labels = permissionOptions
            .filter((p) => perms.includes(p.key))
            .map((p) => p.label);
          return <span className="text-sm text-gray-600">{labels.join('، ')}</span>;
        },
      },
      {
        key: 'actions',
        title: 'عملیات',
        render: (u) => {
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openAccessModal(u)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                <Edit2 size={16} />
                تغییر نقش / دسترسی
              </button>
            </div>
          );
        },
        className: 'text-end',
        headerClassName: 'text-end',
      },
    ],
    [openAccessModal, roleBadgeClass, roleLabel],
  );

  if (currentUserRole !== 'ADMIN') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-600">شما دسترسی مدیریت نقش‌ها را ندارید.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zafting-accent/10 text-zafting-accent flex items-center justify-center">
            <UsersRound size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">مدیریت نقش‌ها</h1>
            <p className="text-sm text-gray-500">تخصیص نقش و دسترسی به کاربران</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
          تعداد کل: <span className="font-bold text-[#2A2A2A]">{total}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            onSearch={(value) => {
              setQuery(value.trim());
              setPage(1);
            }}
            placeholder="جستجو بر اساس نام یا موبایل"
          />
        </div>
      </div>

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
        isOpen={isModalOpen && !!selectedUser}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title="تغییر نقش / دسترسی"
      >
        {selectedUser ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400">موبایل</p>
                <p className="font-mono dir-ltr mt-2 text-gray-800">
                  {selectedUser.mobile}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400">نام</p>
                <p className="mt-2 text-gray-800">
                  {[selectedUser.name, selectedUser.lastName].filter(Boolean).join(' ') || '—'}
                </p>
              </div>
            </div>

            <Select
              label="نقش"
              options={roleOptions}
              value={draftRole}
              onChange={(e) => {
                const next = e.target.value as UserProfile['role'];
                setDraftRole(next);
                if (next !== 'OPERATOR') setDraftPermissions([]);
              }}
            />

            {draftRole === 'OPERATOR' ? (
              <div>
                <h3 className="text-sm font-bold text-[#2A2A2A] mb-3">
                  دسترسی‌های اپراتور
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissionOptions.map((p) => {
                    const checked = draftPermissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const nextChecked = e.target.checked;
                            setDraftPermissions((prev) =>
                              nextChecked
                                ? Array.from(new Set([...prev, p.key]))
                                : prev.filter((x) => x !== p.key),
                            );
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedUser) return;
                  setIsSaving(true);
                  try {
                    const updated = await userService.updateUserAccess(selectedUser.id, {
                      role: draftRole,
                      permissions: draftRole === 'OPERATOR' ? draftPermissions : [],
                    });
                    setUsers((prev) =>
                      prev.map((x) => (x.id === selectedUser.id ? updated : x)),
                    );
                    setIsModalOpen(false);
                    setSelectedUser(null);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                ذخیره
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default RoleManagement;
