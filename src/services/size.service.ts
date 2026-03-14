import api from './api';

export interface Size {
  id: string;
  name: string;
  order: number;
}

export const sizeService = {
  getAll: async (): Promise<Size[]> => {
    const response = await api.get<Size[]>('/sizes');
    return response.data;
  },

  create: async (data: { name: string; order?: number }): Promise<Size> => {
    const response = await api.post<Size>('/sizes', data);
    return response.data;
  },
};
