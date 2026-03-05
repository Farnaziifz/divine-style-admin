import { useState, useEffect } from 'react';
import { Table, type Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { collectionService, type Collection } from '../services/collection.service';
import { uploadService } from '../services/upload.service';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await collectionService.getAll();
      setCollections(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageUrl: string | undefined = undefined;

      if (imageFile) {
        finalImageUrl = await uploadService.upload(imageFile);
      } else if (imagePreview && !imagePreview.startsWith('blob:')) {
        finalImageUrl = imagePreview;
      }

      const payload = {
        title,
        description,
        isActive,
        image: finalImageUrl,
      };

      if (editingId) {
        await collectionService.update(editingId, payload);
      } else {
        await collectionService.create(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchCollections();
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره سازی');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setTitle(collection.title);
    setDescription(collection.description || '');
    setIsActive(collection.isActive);
    setImagePreview(collection.image || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const onConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await collectionService.delete(deleteModal.id);
      fetchCollections();
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      console.error(error);
      alert('خطا در حذف');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const columns: Column<Collection>[] = [
    {
      key: 'image',
      title: 'تصویر',
      render: (item) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : (
                <ImageIcon className="text-gray-400" size={24} />
            )}
        </div>
      ),
    },
    { key: 'title', title: 'عنوان', className: 'font-bold text-[#2A2A2A]' },
    { 
        key: 'isActive', 
        title: 'وضعیت', 
        render: (item) => (
            item.isActive ? 
            <span className="text-green-600 flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded-full w-fit"><CheckCircle size={12}/> فعال</span> : 
            <span className="text-red-600 flex items-center gap-1 text-xs bg-red-50 px-2 py-1 rounded-full w-fit"><XCircle size={12}/> غیرفعال</span>
        )
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
            <button 
                onClick={() => handleEdit(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="ویرایش"
            >
                <Edit2 size={18} />
            </button>
            <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">مدیریت کالکشن‌ها</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#6B5B54] hover:bg-[#5A4B45] text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-[#6B5B54]/20"
        >
          <Plus size={20} />
          <span>افزودن کالکشن</span>
        </button>
      </div>

      <Table
        columns={columns}
        data={collections}
        isLoading={isLoading}
        emptyMessage="هیچ کالکشنی یافت نشد"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'ویرایش کالکشن' : 'افزودن کالکشن جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">تصویر کالکشن</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#6B5B54] transition-colors relative">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-lg" />
                    ) : (
                        <>
                            <div className="p-3 bg-gray-50 rounded-full text-gray-400">
                                <ImageIcon size={24} />
                            </div>
                            <span className="text-sm text-gray-500">برای آپلود کلیک کنید</span>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">عنوان</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
                    placeholder="عنوان کالکشن..."
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">توضیحات</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all min-h-[100px]"
                    placeholder="توضیحات (اختیاری)..."
                />
            </div>

            <div className="flex items-center gap-3 py-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 accent-[#6B5B54] rounded cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                    فعال باشد
                </label>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 w-full bg-[#6B5B54] hover:bg-[#5A4B45] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#6B5B54]/20 disabled:opacity-70"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <Edit2 size={20} /> : <Plus size={20} />)}
                    {editingId ? 'ذخیره تغییرات' : 'افزودن کالکشن'}
                </button>
            </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={onConfirmDelete}
        title="حذف کالکشن"
        message="آیا از حذف این کالکشن مطمئن هستید؟ این عملیات غیرقابل بازگشت است."
        confirmText="حذف"
        cancelText="انصراف"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};

export default Collections;
