import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, type Column } from '../components/common/Table';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AddEventModal } from '../components/event/AddEventModal';
import { eventService, getEventLandingLink, type Event } from '../services/event.service';
import { Calendar, Check, Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const Events = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.list({ page, limit });
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
      await eventService.remove(deleteId);
      setDeleteId(null);
      void fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = async (eventCode: string) => {
    const link = getEventLandingLink(eventCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(eventCode);
      setTimeout(() => setCopiedCode((c) => (c === eventCode ? null : c)), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const stop = (e: MouseEvent) => e.stopPropagation();

  const columns: Column<Event>[] = [
    {
      key: 'name',
      title: 'نام رویداد',
      render: (r) => <span className="font-bold">{r.name}</span>,
    },
    {
      key: 'eventCode',
      title: 'لینک لندینگ',
      render: (r) => (
        <div className="flex items-center gap-2 dir-ltr justify-end">
          <span className="font-mono text-sm">{r.eventCode}</span>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              void handleCopyLink(r.eventCode);
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            title="کپی لینک لندینگ"
          >
            {copiedCode === r.eventCode ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'range',
      title: 'بازه زمانی',
      render: (r) => (
        <span className="text-sm">
          {formatDate(r.startDate)} تا {formatDate(r.endDate)}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'وضعیت',
      render: (r) =>
        r.isActive ? (
          <span className="text-green-700 text-sm font-bold">فعال</span>
        ) : (
          <span className="text-gray-500 text-sm">غیرفعال</span>
        ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setEditRow(r);
            }}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title="ویرایش"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setDeleteId(r.id);
            }}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="حذف"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      className: 'text-center',
      headerClassName: 'text-center',
    },
  ];

  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zafting-accent/10 rounded-xl text-zafting-accent">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zafting-text">رویدادها</h1>
            <p className="text-gray-500 text-sm mt-1">
              ایجاد و مدیریت لندینگ اختصاصی برای هر رویداد
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95"
        >
          <Plus size={20} />
          افزودن رویداد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-zafting-accent" size={40} />
          </div>
        ) : (
          <Table
            columns={columns}
            data={rows}
            emptyMessage="رویدادی ثبت نشده است"
            onRowClick={(r) => navigate(`/events/${r.id}`)}
          />
        )}

        {!loading && total > limit && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-100">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              قبلی
            </button>
            <span className="text-sm text-gray-600">
              صفحه {page} از {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              بعدی
            </button>
          </div>
        )}
      </div>

      <AddEventModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSaved={() => void fetchList()} />

      <AddEventModal
        isOpen={!!editRow}
        event={editRow}
        onClose={() => setEditRow(null)}
        onSaved={() => void fetchList()}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف رویداد"
        message="آیا از حذف این رویداد مطمئن هستید؟"
        confirmText="حذف"
        isLoading={deleting}
        type="danger"
      />
    </div>
  );
};

export default Events;
