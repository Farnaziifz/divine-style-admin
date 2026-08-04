import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Loader2 } from 'lucide-react';
import {
  customerGroupService,
  type CreateCustomerGroupDto,
} from '../../services/customerGroup.service';
import { SearchableUserMultiSelect } from '../common/SearchableUserMultiSelect';

interface AddCustomerGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'message' in err.response.data
  ) {
    const msg = (err.response.data as { message: unknown }).message;
    return Array.isArray(msg) ? msg.join(', ') : String(msg);
  }
  return 'خطا در ذخیره دسته‌بندی';
}

export const AddCustomerGroupModal = ({
  isOpen,
  onClose,
  onSaved,
}: AddCustomerGroupModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memberUserIds, setMemberUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setMemberUserIds([]);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('عنوان دسته‌بندی را وارد کنید');
      return;
    }

    const payload: CreateCustomerGroupDto = {
      title: title.trim(),
      description: description.trim() || undefined,
      memberUserIds: memberUserIds.length ? memberUserIds : undefined,
      isActive: true,
    };

    setSaving(true);
    try {
      await customerGroupService.create(payload);
      onSaved();
      handleClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="افزودن دسته‌بندی جدید"
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            عنوان دسته‌بندی
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
            placeholder="مثلاً مشتریان وفادار"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none resize-none"
            placeholder="معیار یا هدف این دسته‌بندی را بنویسید"
          />
        </div>

        <SearchableUserMultiSelect
          label="اعضای اولیه (اختیاری — بعداً هم قابل تغییر است)"
          value={memberUserIds}
          onChange={setMemberUserIds}
          placeholder="مثلاً 0912…"
        />

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-zafting-accent text-white font-bold shadow-md hover:opacity-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : null}
            ذخیره دسته‌بندی
          </button>
        </div>
      </form>
    </Modal>
  );
};
