import { useState, useEffect } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  categoryService,
  type Category,
} from '../services/category.service';
import { Select } from '../components/common/Select';
import { getImageUrl } from '../utils/image';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await categoryService.getAll(page);
      setCategories(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setParentId('');
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setTitle(category.title);
    setDescription(category.description || '');
    setParentId(category.parentId || '');
    setImagePreview(category.image || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const onConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await categoryService.delete(deleteModal.id);
      fetchCategories();
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
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (parentId) formData.append('parentId', parentId);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingId) {
        await categoryService.update(editingId, formData);
      } else {
        await categoryService.create(formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره سازی');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'image',
      title: 'تصویر',
      render: (category) =>
        category.image ? (
          <img
            src={getImageUrl(category.image)}
            alt={category.title}
            className="w-10 h-10 rounded-md object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        ),
    },
    { key: 'title', title: 'عنوان', render: (category) => category.title },
    {
      key: 'parent',
      title: 'والد',
      render: (category) => {
        if (!category.parentId) return '-';
        const parent = categories.find((c) => c.id === category.parentId);
        return parent ? parent.title : '...';
      },
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(category)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDelete(category.id)}
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
        <h1 className="text-2xl font-bold text-gray-800">
          مدیریت دسته‌بندی‌ها
        </h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
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
          <Table
            data={categories}
            columns={columns}
            pagination={{
              page,
              limit: 10,
              total,
              onPageChange: setPage,
            }}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              توضیحات
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              rows={3}
            />
          </div>

          <div>
            <Select
              label="دسته‌بندی والد"
              value={parentId}
              onChange={(e) => setParentId(String(e.target.value))}
              options={[
                { label: 'بدون والد', value: '' },
                ...categories
                  .filter((c) => c.id !== editingId)
                  .map((category) => ({
                    label: category.title,
                    value: category.id,
                  })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تصویر
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={getImageUrl(imagePreview)}
                    alt="Preview"
                    className="h-32 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <ImageIcon size={32} />
                  <span className="text-sm">
                    برای آپلود کلیک کنید یا تصویر را اینجا رها کنید
                  </span>
                </div>
              )}
            </div>
          </div>

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
        title="حذف دسته‌بندی"
        message="آیا از حذف این دسته‌بندی اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Categories;
