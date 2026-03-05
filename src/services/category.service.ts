import api from './api';

export interface Category {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export const categoryService = {
  getAll: async (
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<Category>> => {
    const response = await api.get('/categories', { params: { page, limit } });
    return response.data;
  },

  getOne: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: FormData): Promise<Category> => {
    const response = await api.post('/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, data: FormData): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
