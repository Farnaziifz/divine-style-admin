import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService, type Product } from '../services/product.service';
import { categoryService, type Category } from '../services/category.service';
import { Table, type Column } from '../components/common/Table';
import { Select } from '../components/common/Select';
import { Plus, Loader2, Trash2, Edit2, Eye, RefreshCw } from 'lucide-react';
import { getImageUrl } from '../utils/image';
import { ConfirmModal } from '../components/common/ConfirmModal';

const LIMIT = 10;

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'جدیدترین', value: 'newest' },
  { label: 'قیمت: کم به زیاد', value: 'price_asc' },
  { label: 'قیمت: زیاد به کم', value: 'price_desc' },
];

const ProductList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') || '1');
  const categoryId = searchParams.get('categoryId') || '';
  const sort = (searchParams.get('sort') as SortOption) || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [isRecalcModalOpen, setIsRecalcModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    categoryService
      .getAll(1, 100)
      .then((res) => setCategories(res.data))
      .catch((error) => console.error(error));
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productService.getAll({
        page,
        limit: LIMIT,
        categoryId: categoryId || undefined,
        sort,
      });
      setProducts(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryId, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates: { page?: number; categoryId?: string; sort?: SortOption }) => {
    const next = new URLSearchParams(searchParams);
    if (updates.categoryId !== undefined) {
      if (updates.categoryId) next.set('categoryId', updates.categoryId);
      else next.delete('categoryId');
    }
    if (updates.sort !== undefined) {
      if (updates.sort !== 'newest') next.set('sort', updates.sort);
      else next.delete('sort');
    }
    const nextPage = updates.page ?? (updates.categoryId !== undefined || updates.sort !== undefined ? 1 : page);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    setSearchParams(next);
  };

  const handleDeleteClick = (id: string) => {
    setProductIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productIdToDelete) {
      try {
        await productService.delete(productIdToDelete);
        fetchProducts();
        setProductIdToDelete(null);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setProductIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleRecalculateConfirm = async () => {
    setIsRecalcModalOpen(false);
    setIsRecalculating(true);
    setRecalcMessage(null);
    try {
      const { updatedCount } = await productService.recalculatePrices();
      setRecalcMessage({
        type: 'success',
        text: `قیمت ${updatedCount.toLocaleString('fa-IR')} محصول موجود به‌روزرسانی شد.`,
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to recalculate prices:', error);
      setRecalcMessage({ type: 'error', text: 'به‌روزرسانی قیمت‌ها با خطا مواجه شد.' });
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatPrice = (value: number) =>
    value.toLocaleString('fa-IR', { maximumFractionDigits: 0 });

  const columns: Column<Product>[] = [
    {
      key: 'code',
      title: 'کد محصول',
      render: (item) => <span className="font-mono text-sm">{item.code}</span>,
    },
    {
      key: 'image',
      title: 'تصویر',
      render: (item) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          {item.images && item.images.length > 0 && (
            <img
              src={getImageUrl(item.images[0])}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ),
    },
    {
      key: 'title',
      title: 'عنوان',
      render: (item) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span>{item.title}</span>
          {item.isFeatured && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
              منتخب
            </span>
          )}
          {item.showInIntro && (
            <span className="px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-800 rounded-full">
              اینترو
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      title: 'دسته بندی',
      render: (item) => item.category?.title || 'نامشخص',
    },
    {
      key: 'collection',
      title: 'کالکشن',
      render: (item) => item.collections?.[0]?.title || 'نامشخص',
    },
    {
      key: 'finalPrice',
      title: 'قیمت نهایی (تومان)',
      render: (item) => (
        <span className="font-medium">{formatPrice(Number(item.finalPrice))}</span>
      ),
    },
    {
      key: 'contentPostedAt',
      title: 'شبکه‌های اجتماعی',
      render: (item) =>
        item.contentPostedAt ? (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            پست شده
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            پست نشده
          </span>
        ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/products/${item.id}`)}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
            title="مشاهده جزئیات"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => navigate(`/products/${item.id}/edit`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="ویرایش"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteClick(item.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت محصولات</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecalcModalOpen(true)}
            disabled={isRecalculating}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isRecalculating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span>به‌روزرسانی قیمت محصولات موجود</span>
          </button>
          <button
            onClick={() => navigate('create')}
            className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
          >
            <Plus size={20} />
            <span>افزودن محصول</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-56">
          <Select
            placeholder="همه دسته‌بندی‌ها"
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: String(e.target.value) })}
            options={[
              { label: 'همه دسته‌بندی‌ها', value: '' },
              ...categories.map((c) => ({ label: c.title, value: c.id })),
            ]}
          />
        </div>
        <div className="w-56">
          <Select
            placeholder="مرتب‌سازی"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value as SortOption })}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {recalcMessage && (
        <div
          className={`rounded-xl p-4 text-sm border ${
            recalcMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-red-50 border-red-100 text-red-700'
          }`}
        >
          {recalcMessage.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table
            data={products}
            columns={columns}
            pagination={{
              page,
              limit: LIMIT,
              total,
              onPageChange: (p) => updateParams({ page: p }),
            }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="حذف محصول"
        message="آیا از حذف این محصول اطمینان دارید؟ این عمل غیرقابل بازگشت است."
      />

      <ConfirmModal
        isOpen={isRecalcModalOpen}
        onClose={() => setIsRecalcModalOpen(false)}
        onConfirm={handleRecalculateConfirm}
        title="به‌روزرسانی قیمت محصولات موجود"
        message="قیمت نهایی همهٔ محصولاتی که حداقل یک واریانت با موجودی دارند، بر اساس هزینه بسته‌بندی و مالیات فعلی دوباره محاسبه می‌شود. ادامه می‌دهید؟"
      />
    </div>
  );
};

export default ProductList;
