import { useCallback, useEffect, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import {
  loyaltySegmentService,
  type LoyaltySegment,
  type LoyaltySegmentMember,
} from '../services/loyaltySegment.service';
import { Loader2, Users2 } from 'lucide-react';

const SEGMENT_BADGE_CLASS: Record<string, string> = {
  vip: 'bg-amber-50 text-amber-700 border-amber-200',
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  at_risk: 'bg-orange-50 text-orange-700 border-orange-200',
  lost: 'bg-red-50 text-red-600 border-red-200',
  regular: 'bg-gray-50 text-gray-600 border-gray-200',
};

const formatToman = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';

const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );

const LoyaltySegments = () => {
  const [segments, setSegments] = useState<LoyaltySegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSegment, setSelectedSegment] = useState<LoyaltySegment | null>(null);
  const [members, setMembers] = useState<LoyaltySegmentMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loyaltySegmentService.list();
      setSegments(data);
    } catch (e) {
      console.error(e);
      setError('خطا در دریافت سگمنت‌های مشتریان');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSegments();
  }, [fetchSegments]);

  const openSegment = async (segment: LoyaltySegment) => {
    setSelectedSegment(segment);
    setMembers([]);
    setMembersError(null);
    setMembersLoading(true);
    try {
      const data = await loyaltySegmentService.getMembers(segment.id);
      setMembers(data);
    } catch (e) {
      console.error(e);
      setMembersError('خطا در دریافت مشتریان این سگمنت');
    } finally {
      setMembersLoading(false);
    }
  };

  const columns: Column<LoyaltySegment>[] = [
    {
      key: 'label',
      title: 'سگمنت',
      render: (s) => (
        <div>
          <div className="font-medium text-zafting-text">{s.label}</div>
          {s.description && (
            <div className="text-xs text-gray-500 mt-0.5 max-w-md">{s.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'key',
      title: 'شناسه',
      render: (s) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border dir-ltr ${
            SEGMENT_BADGE_CLASS[s.key] ?? 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {s.key}
        </span>
      ),
    },
    {
      key: 'membersCount',
      title: 'تعداد مشتریان',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
          <Users2 size={16} />
          <span>{formatNumber(s.membersCount)} مشتری</span>
        </div>
      ),
    },
  ];

  const memberColumns: Column<LoyaltySegmentMember>[] = [
    {
      key: 'customer',
      title: 'مشتری',
      render: (m) => (
        <div>
          <div className="dir-ltr font-medium text-zafting-text inline-block">{m.mobile}</div>
          {(m.name || m.lastName) && (
            <div className="text-xs text-gray-500 mt-0.5">
              {[m.name, m.lastName].filter(Boolean).join(' ')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'recencyDays',
      title: 'تازگی (روز از آخرین خرید)',
      render: (m) => formatNumber(m.recencyDays),
    },
    {
      key: 'frequencyCount',
      title: 'فرکانس (تعداد خرید)',
      render: (m) => formatNumber(m.frequencyCount),
    },
    {
      key: 'monetaryTotal',
      title: 'ارزش پولی',
      render: (m) => formatToman(m.monetaryTotal),
    },
    {
      key: 'computedAt',
      title: 'محاسبه‌شده در',
      render: (m) => <span className="text-xs text-gray-500">{formatDate(m.computedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-zafting-accent/10 rounded-xl text-zafting-accent">
          <Users2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zafting-text">دسته‌بندی مشتریان</h1>
          <p className="text-gray-500 text-sm mt-1">
            سگمنت‌های RFM (محاسبهٔ خودکار شبانه) — برای دیدن لیست مشتریان هر سگمنت روی ردیف کلیک کنید
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-zafting-accent" size={40} />
        </div>
      ) : (
        <Table
          columns={columns}
          data={segments}
          emptyMessage="هنوز هیچ سگمنتی محاسبه نشده است"
          onRowClick={(s) => void openSegment(s)}
        />
      )}

      <Modal
        isOpen={!!selectedSegment}
        onClose={() => setSelectedSegment(null)}
        title={selectedSegment ? `مشتریان سگمنت «${selectedSegment.label}»` : ''}
        maxWidthClassName="max-w-4xl"
      >
        {membersError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {membersError}
          </div>
        )}

        {membersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table
            columns={memberColumns}
            data={members}
            emptyMessage="در حال حاضر مشتری‌ای در این سگمنت نیست"
          />
        )}
      </Modal>
    </div>
  );
};

export default LoyaltySegments;
