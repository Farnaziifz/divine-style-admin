import api from './api';

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  products?: unknown[];
  createdAt: string;
}

export const collectionService = {
  getAll: async (): Promise<Collection[]> => {
    const response = await api.get('/collections');
    return response.data;
  },

  getOne: async (id: string): Promise<Collection> => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  create: async (data: Partial<Collection>): Promise<Collection> => {
    const response = await api.post('/collections', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Collection>): Promise<Collection> => {
    const response = await api.patch(`/collections/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/collections/${id}`);
  },
};
