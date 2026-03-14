import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, type Product } from '../services/product.service';
import { getImageUrl } from '../utils/image';
import { Loader2, ArrowRight, Edit, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/common/ConfirmModal';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const data = await productService.getById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (product) {
      try {
        await productService.delete(product.id);
        navigate('/products');
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-zafting-accent" size={48} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">محصول یافت نشد.</p>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-zafting-accent hover:underline"
        >
          بازگشت به لیست محصولات
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowRight size={20} />
          <span>بازگشت</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/products/${product.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <Edit size={18} />
            <span>ویرایش</span>
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={18} />
            <span>حذف</span>
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={getImageUrl(product.images[0])}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    بدون تصویر
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.images?.slice(1).map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100"
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`${product.title} ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <div className="flex flex-wrap gap-2 text-sm">
                  {product.category && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                      دسته‌بندی: {product.category.title}
                    </span>
                  )}
                  {product.collections && product.collections.length > 0 && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                      کالکشن: {product.collections[0].title}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  توضیحات
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {product.description || 'بدون توضیحات'}
                </p>
              </div>

              {/* Variants Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  تنوع‌ها و موجودی
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">رنگ</th>
                        <th className="px-4 py-3">سایز</th>
                        <th className="px-4 py-3">قیمت</th>
                        <th className="px-4 py-3">تخفیف</th>
                        <th className="px-4 py-3">قیمت نهایی</th>
                        <th className="px-4 py-3">موجودی</th>
                        <th className="px-4 py-3">مشخصات فنی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {product.variants?.map((variant, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-gray-500">
                            {variant.sku}
                          </td>
                          <td className="px-4 py-3">
                            {variant.color ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                  style={{ backgroundColor: variant.colorCode || '#eee' }}
                                />
                                {variant.color}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3">{variant.size || '-'}</td>
                          <td className="px-4 py-3">
                            {variant.price.toLocaleString()} تومان
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {typeof variant.discountPercent === 'number' && variant.discountPercent > 0
                              ? `${variant.discountPercent}%`
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {(variant.discountPrice ?? variant.price).toLocaleString()} تومان
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                variant.stock > 0
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {variant.stock > 0 ? `${variant.stock} عدد` : 'ناموجود'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {variant.specifications ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(variant.specifications).map(
                                  ([key, value]) => (
                                    <span
                                      key={key}
                                      className="px-1.5 py-0.5 bg-gray-100 rounded text-xs border border-gray-200"
                                    >
                                      {key}: {value}
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="حذف محصول"
        message="آیا از حذف این محصول اطمینان دارید؟ این عمل غیرقابل بازگشت است."
      />
    </div>
  );
};

export default ProductDetail;
