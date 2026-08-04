import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, type Column } from '../components/common/Table';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AddCustomerGroupModal } from '../components/customerGroup/AddCustomerGroupModal';
import {
  customerGroupService,
  type CustomerGroup,
} from '../services/customerGroup.service';
import { Eye, Loader2, Plus, Trash2, Users2 } from 'lucide-react';

const CustomerGroups = () => {
  const [rows, setRows] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerGroupService.list({ page, limit });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await customerGroupService.remove(deleteId);
      setDeleteId(null);
      void fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (group: CustomerGroup) => {
    setTogglingId(group.id);
    try {
      await customerGroupService.update(group.id, { isActive: !group.isActive });
      void fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const columns: Column<CustomerGroup>[] = [
    {
      key: 'title',
      title: 'عنوان دسته‌بندی',
      render: (r) => (
        <div>
          <div className="font-medium text-zafting-text">{r.title}</div>
          {r.description && (
            <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
              {r.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'membersCount',
      title: 'تعداد مشتریان',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users2 size={16} />
          <span>{r.membersCount.toLocaleString('fa-IR')} مشتری</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'وضعیت دسته‌بندی',
      render: (r) =>
        r.isActive ? (
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
            فعال
          </span>
        ) : (
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            غیرفعال
          </span>
        ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/customer-groups/${r.id}`}
            className="p-2 rounded-lg text-gray-500 hover:text-zafting-accent hover:bg-zafting-accent/10 transition-colors"
            title="جزئیات"
          >
            <Eye size={18} />
          </Link>
          <button
            type="button"
            disabled={togglingId === r.id}
            onClick={() => void handleToggleStatus(r)}
            className="px-2 py-1.5 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            {togglingId === r.id ? '...' : 'تغییر وضعیت'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(r.id)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="حذف"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zafting-accent/10 rounded-xl text-zafting-accent">
            <Users2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">دسته‌بندی مشتریان</h1>
            <p className="text-gray-500 text-sm mt-1">
              مشتریان را دسته‌بندی کنید تا بتوانید پلن‌های مارکتینگ هدفمند روی هر گروه اجرا کنید
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95"
        >
          <Plus size={20} />
          افزودن دسته‌بندی جدید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-zafting-accent" size={40} />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          emptyMessage="دسته‌بندی‌ای ثبت نشده است"
          pagination={{
            page,
            limit,
            total,
            onPageChange: (newPage) => setPage(newPage),
          }}
        />
      )}

      <AddCustomerGroupModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => void fetchList()}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف دسته‌بندی"
        message="آیا از حذف این دسته‌بندی مطمئن هستید؟"
        confirmText="حذف"
        isLoading={deleting}
        type="danger"
      />
    </div>
  );
};

export default CustomerGroups;
