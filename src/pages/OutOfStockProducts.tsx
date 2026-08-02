import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Edit2, Loader2 } from 'lucide-react';
import { productService, type OutOfStockProduct } from '../services/product.service';
import { Table, type Column } from '../components/common/Table';
import { getImageUrl } from '../utils/image';

const OutOfStockProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<OutOfStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getOutOfStock();
      setProducts(data);
    } catch {
      setError('خطا در دریافت لیست محصولات ناموجود');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns: Column<OutOfStockProduct>[] = [
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
          {item.images?.length > 0 && (
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
      render: (item) => item.title,
    },
    {
      key: 'category',
      title: 'دسته بندی',
      render: (item) => item.category?.title || 'نامشخص',
    },
    {
      key: 'variants',
      title: 'واریانت‌ها',
      render: (item) => (
        <div className="flex flex-col gap-1">
          {item.variants.map((v) => (
            <span key={v.id} className="text-xs text-gray-600">
              {[v.size, v.color].filter(Boolean).join(' / ') || v.sku} —{' '}
              <span className="text-red-600 font-medium">موجودی: {v.stock}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'outOfStockNotifiedAt',
      title: 'ناموجود از',
      render: (item) =>
        item.outOfStockNotifiedAt
          ? new Date(item.outOfStockNotifiedAt).toLocaleDateString('fa-IR')
          : '-',
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (item) => (
        <button
          onClick={() => navigate(`/products/${item.id}/edit`)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
          title="ویرایش موجودی"
        >
          <Edit2 size={16} />
          <span>ویرایش</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">محصولات ناموجود</h1>
          <p className="text-sm text-gray-500">
            محصولاتی که موجودی همه واریانت‌هایشان صفر شده است.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            در حال حاضر محصول ناموجودی وجود ندارد.
          </div>
        ) : (
          <Table data={products} columns={columns} />
        )}
      </div>
    </div>
  );
};

export default OutOfStockProducts;
