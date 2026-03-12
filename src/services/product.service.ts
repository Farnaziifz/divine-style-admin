import api from './api';

export type SpecificationValue = string | number | boolean | null;

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  specifications?: Record<string, SpecificationValue>;
}

export interface Category {
  id: string;
  title: string;
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
};
