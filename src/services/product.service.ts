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

export const productService = {
  create: async (data: any): Promise<Product> => {
    const response = await api.post('/products', data);
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

  update: async (id: string, data: any): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
