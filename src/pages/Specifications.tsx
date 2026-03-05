import { useState, useEffect } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Select } from '../components/common/Select';
import {
  specificationService,
  type SpecificationKey,
} from '../services/specification.service';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

const SPEC_TYPES = [
  { label: 'متن', value: 'TEXT' },
  { label: 'عدد', value: 'NUMBER' },
  { label: 'لیست تک انتخابی', value: 'SELECT' },
  { label: 'لیست چند انتخابی', value: 'MULTI_SELECT' },
];

const Specifications = () => {
  const [specs, setSpecs] = useState<SpecificationKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('TEXT');
  const [optionsStr, setOptionsStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSpecs();
  }, []);

  const fetchSpecs = async () => {
    setIsLoading(true);
    try {
      const data = await specificationService.getAll();
      setSpecs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setKey('');
    setLabel('');
    setType('TEXT');
    setOptionsStr('');
    setEditingId(null);
  };

  const handleEdit = (spec: SpecificationKey) => {
    setEditingId(spec.id);
    setKey(spec.key);
    setLabel(spec.label);
    setType(spec.type);
    setOptionsStr(spec.options?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const onConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await specificationService.delete(deleteModal.id);
      fetchSpecs();
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      console.error(error);
      alert('خطا در حذف');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const options =
        type === 'SELECT' || type === 'MULTI_SELECT'
          ? optionsStr
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s)
          : undefined;

      const payload = {
        key,
        label,
        type: type as SpecificationKey['type'],
        options,
      };

      if (editingId) {
        await specificationService.update(editingId, payload);
      } else {
        await specificationService.create(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchSpecs();
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره سازی');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<SpecificationKey>[] = [
    { key: 'label', title: 'عنوان نمایشی' },
    { key: 'key', title: 'کلید سیستمی', className: 'font-mono text-sm' },
    {
      key: 'type',
      title: 'نوع',
      render: (item) => {
        const t = SPEC_TYPES.find((t) => t.value === item.type);
        return t ? t.label : item.type;
      },
    },
    {
      key: 'options',
      title: 'گزینه‌ها',
      render: (item) =>
        item.options && item.options.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.options.map((opt, i) => (
              <span
                key={i}
                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
              >
                {opt}
              </span>
            ))}
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(item)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت مشخصات</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
        >
          <Plus size={20} />
          <span>افزودن مشخصه</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table
            data={specs}
            columns={columns}
            // No pagination for specs usually as they are few, but Table supports it.
            // If specs grow, we can add pagination. For now, pass undefined or minimal.
            // Or simple client-side pagination if Table supports it?
            // Table requires pagination prop if backend paginates.
            // My backend returns simple array for findAllKeys (no pagination yet).
            // So Table might break if I don't pass pagination prop or pass fake one?
            // Table implementation: {pagination && ...}
            // So if pagination is undefined, it just renders table.
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'ویرایش مشخصه' : 'افزودن مشخصه جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان نمایشی (مثال: جنس پارچه)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              کلید سیستمی (مثال: material)
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr"
              required
            />
          </div>

          <div>
            <Select
              label="نوع مشخصه"
              value={type}
              onChange={(e) => setType(String(e.target.value))}
              options={SPEC_TYPES}
            />
          </div>

          {(type === 'SELECT' || type === 'MULTI_SELECT') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                گزینه‌ها (با کاما جدا کنید)
              </label>
              <textarea
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
                rows={3}
                placeholder="مثال: نخی, پشمی, کتان"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-zafting-accent text-white rounded-lg hover:bg-zafting-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}
              {editingId ? 'ویرایش' : 'ایجاد'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={onConfirmDelete}
        title="حذف مشخصه"
        message="آیا از حذف این مشخصه اطمینان دارید؟"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Specifications;
