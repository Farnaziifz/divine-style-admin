import api from './api';

export type SpecificationValue = string | number | boolean | null;

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  stock: number;
  specifications?: Record<string, SpecificationValue>;
  /** قیمت سطح محصول است؛ این مقادیر فقط برای خواندن از پاسخ API آینه می‌شوند (قابل ارسال در ساخت/ویرایش نیستند) */
  price?: number;
  discountPrice?: number;
  discountPercent?: number;
}

export interface Category {
  id: string;
  title: string;
  profitMultiplier?: number;
}

export interface Collection {
  id: string;
  title: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: Category;
  collectionIds?: string[];
  collections?: Collection[];
  images: string[];
  variants?: ProductVariant[];
  isFeatured?: boolean;
  showInIntro?: boolean;
  /** کد خودکار محصول (بر اساس بازهٔ کد دسته‌بندی) */
  code: number;
  /** بهای تمام‌شدهٔ خالص (ورودی ادمین) */
  costPrice: number;
  /** قیمت نهایی محاسبه‌شده از فرمول */
  finalPrice: number;
  /** تخفیف دستی روی قیمت نهایی */
  discountPrice?: number;
  discountPercent?: number;
  /** اولین باری که این محصول توی شبکه‌های اجتماعی پست شد (از تقویم محتوایی) */
  contentPostedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUpsertPayload {
  title: string;
  description: string;
  categoryId: string;
  collectionIds?: string[];
  images: string[];
  variants?: ProductVariant[];
  isFeatured?: boolean;
  showInIntro?: boolean;
  costPrice: number;
  discountPrice?: number;
  discountPercent?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  collectionId?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface OutOfStockProduct {
  id: string;
  title: string;
  code: number;
  images: string[];
  outOfStockNotifiedAt: string | null;
  category: Category | null;
  variants: Array<{
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    stock: number;
  }>;
}

export const productService = {
  create: async (data: ProductUpsertPayload): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  getAll: async (params?: ProductListParams): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<ProductUpsertPayload>): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  getOutOfStock: async (): Promise<OutOfStockProduct[]> => {
    const response = await api.get('/products/out-of-stock');
    return response.data;
  },
};
