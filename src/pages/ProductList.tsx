import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, type Product } from '../services/product.service';
import { Table, type Column } from '../components/common/Table';
import { Plus, Loader2, Trash2, Edit2, Eye } from 'lucide-react';
import { getImageUrl } from '../utils/image';
import { ConfirmModal } from '../components/common/ConfirmModal';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productService.getAll({ page, limit });
      setProducts(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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

  const columns: Column<Product>[] = [
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
    { key: 'title', title: 'عنوان' },
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت محصولات</h1>
        <button
          onClick={() => navigate('create')}
          className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
        >
          <Plus size={20} />
          <span>افزودن محصول</span>
        </button>
      </div>

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
              limit,
              total,
              onPageChange: (p) => setPage(p),
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
    </div>
  );
};

export default ProductList;
