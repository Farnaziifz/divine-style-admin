import { useEffect, useMemo, useState } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  blogCategoryService,
  type BlogCategory,
} from '../services/blogCategory.service';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const BlogCategories = () => {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await blogCategoryService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch blog categories', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (c: BlogCategory) => {
    setEditing(c);
    setTitle(c.title);
    setSlug(c.slug);
    setDescription(c.description ?? '');
    setIsModalOpen(true);
  };

  const columns: Column<BlogCategory>[] = useMemo(
    () => [
      { key: 'title', title: 'عنوان', render: (c) => c.title },
      {
        key: 'slug',
        title: 'اسلاگ',
        render: (c) => <span className="font-mono text-gray-700">{c.slug}</span>,
      },
      {
        key: 'description',
        title: 'توضیح',
        render: (c) => c.description || '—',
      },
      {
        key: 'createdAt',
        title: 'تاریخ ایجاد',
        render: (c) => formatDateTime(c.createdAt),
      },
      {
        key: 'actions',
        title: 'عملیات',
        render: (c) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(c)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, id: c.id })}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت دسته‌بندی مجله</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
        >
          <Plus size={20} />
          <span>افزودن دسته‌بندی</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table data={items} columns={columns} emptyMessage="دسته‌ای یافت نشد" />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim()) return;
            setIsSaving(true);
            try {
              if (editing) {
                await blogCategoryService.update(editing.id, {
                  title: title.trim(),
                  ...(slug.trim() ? { slug: slug.trim() } : {}),
                  description: description.trim(),
                });
              } else {
                await blogCategoryService.create({
                  title: title.trim(),
                  ...(slug.trim() ? { slug: slug.trim() } : {}),
                  description: description.trim(),
                });
              }
              setIsModalOpen(false);
              resetForm();
              fetchData();
            } catch (error) {
              console.error('Failed to save blog category', error);
              alert('خطا در ذخیره‌سازی');
            } finally {
              setIsSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسلاگ (اختیاری)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
              placeholder="مثال: fashion-news"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              توضیح (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              disabled={isSaving}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-zafting-accent text-white hover:bg-zafting-accent/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
              ذخیره
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={async () => {
          if (!deleteModal.id) return;
          setIsDeleting(true);
          try {
            await blogCategoryService.delete(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
            fetchData();
          } catch (error) {
            console.error('Failed to delete blog category', error);
            alert('خطا در حذف');
          } finally {
            setIsDeleting(false);
          }
        }}
        title="حذف دسته‌بندی"
        message="آیا از حذف این دسته‌بندی مطمئن هستید؟"
        isLoading={isDeleting}
        confirmText="حذف"
      />
    </div>
  );
};

export default BlogCategories;
