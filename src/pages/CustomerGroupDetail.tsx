import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  customerGroupService,
  type CustomerGroup,
} from '../services/customerGroup.service';
import { SearchableUserMultiSelect } from '../components/common/SearchableUserMultiSelect';
import { ArrowRight, Loader2, Save, UserX, Users2 } from 'lucide-react';

const CustomerGroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);

  const [pickerIds, setPickerIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await customerGroupService.getById(id);
      setGroup(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
      setIsActive(data.isActive);
    } catch (e) {
      console.error(e);
      setError('خطا در دریافت دسته‌بندی');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchGroup();
  }, [fetchGroup]);

  const handleSaveInfo = async () => {
    if (!id || !title.trim()) return;
    setSavingInfo(true);
    setError(null);
    try {
      const updated = await customerGroupService.update(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        isActive,
      });
      setGroup(updated);
    } catch (e) {
      console.error(e);
      setError('خطا در ذخیره اطلاعات دسته‌بندی');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAddMembers = async () => {
    if (!id || !group || pickerIds.length === 0) return;
    setAddingMembers(true);
    setError(null);
    try {
      const currentIds = (group.members ?? []).map((m) => m.id);
      const nextIds = [...new Set([...currentIds, ...pickerIds])];
      const updated = await customerGroupService.update(id, { memberUserIds: nextIds });
      setGroup(updated);
      setPickerIds([]);
    } catch (e) {
      console.error(e);
      setError('خطا در افزودن اعضا');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !group) return;
    setRemovingId(userId);
    setError(null);
    try {
      const nextIds = (group.members ?? []).filter((m) => m.id !== userId).map((m) => m.id);
      const updated = await customerGroupService.update(id, { memberUserIds: nextIds });
      setGroup(updated);
    } catch (e) {
      console.error(e);
      setError('خطا در حذف عضو');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-zafting-accent" size={40} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20 text-gray-500">
        دسته‌بندی یافت نشد
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/customer-groups')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowRight size={22} />
        </button>
        <div className="p-3 bg-zafting-accent/10 rounded-xl text-zafting-accent">
          <Users2 size={24} />
        </div>
        <h1 className="text-2xl font-bold text-zafting-text">جزئیات دسته‌بندی</h1>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">عنوان دسته‌بندی</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isActive ? '-translate-x-1' : '-translate-x-6'
              }`}
            />
          </button>
          <span className="text-sm font-bold text-gray-700">
            {isActive ? 'فعال' : 'غیرفعال'}
          </span>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => void handleSaveInfo()}
            disabled={savingInfo || !title.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95 disabled:opacity-60"
          >
            {savingInfo ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            ذخیره اطلاعات
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-zafting-text">
            اعضای دسته‌بندی ({(group.members ?? []).length.toLocaleString('fa-IR')})
          </h2>
        </div>

        <div className="p-5 border-b border-gray-100 space-y-3">
          <SearchableUserMultiSelect
            label="افزودن عضو جدید"
            value={pickerIds}
            onChange={setPickerIds}
            placeholder="مثلاً 0912…"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleAddMembers()}
              disabled={addingMembers || pickerIds.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95 disabled:opacity-60"
            >
              {addingMembers ? <Loader2 className="animate-spin" size={18} /> : null}
              افزودن به دسته‌بندی
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {(group.members ?? []).length === 0 ? (
            <div className="p-8 text-center text-gray-400">عضوی در این دسته‌بندی نیست</div>
          ) : (
            (group.members ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="dir-ltr font-medium text-zafting-text inline-block">
                    {m.mobile}
                  </div>
                  {(m.name || m.lastName) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[m.name, m.lastName].filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={removingId === m.id}
                  onClick={() => void handleRemoveMember(m.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="حذف از دسته‌بندی"
                >
                  {removingId === m.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <UserX size={18} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerGroupDetail;
