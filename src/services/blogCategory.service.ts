import api from './api';

export interface BlogCategory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const blogCategoryService = {
  getAll: async () => {
    const response = await api.get<BlogCategory[]>('/admin/blog/categories');
    return response.data;
  },

  create: async (payload: {
    title: string;
    slug?: string;
    description?: string;
  }) => {
    const response = await api.post<BlogCategory>('/admin/blog/categories', payload);
    return response.data;
  },

  update: async (
    id: string,
    payload: { title?: string; slug?: string; description?: string },
  ) => {
    const response = await api.patch<BlogCategory>(`/admin/blog/categories/${id}`, payload);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.patch<{ id: string }>(`/admin/blog/categories/${id}/delete`);
    return response.data;
  },
};

