import api from './api';

export interface SpecificationKey {
  id: string;
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT';
  options?: string[];
  createdAt: string;
}

export const specificationService = {
  getAll: async (): Promise<SpecificationKey[]> => {
    const response = await api.get('/specifications');
    return response.data;
  },

  create: async (
    data: Partial<SpecificationKey>,
  ): Promise<SpecificationKey> => {
    const response = await api.post('/specifications', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<SpecificationKey>,
  ): Promise<SpecificationKey> => {
    const response = await api.patch(`/specifications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/specifications/${id}`);
  },
};
