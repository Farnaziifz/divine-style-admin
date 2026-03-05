import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, type Product } from '../services/product.service';
import { Table, type Column } from '../components/common/Table';
import { Plus, Loader2 } from 'lucide-react';
import { getImageUrl } from '../utils/image';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
          <Table data={products} columns={columns} />
        )}
      </div>
    </div>
  );
};

export default ProductList;
