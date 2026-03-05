import api from './api';

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  specifications?: Record<string, any>;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  collectionIds?: string[];
  images: string[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  create: async (data: FormData): Promise<Product> => {
    const response = await api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAll: async (params?: any): Promise<{ data: Product[]; meta: any }> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  update: async (id: string, data: FormData): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
