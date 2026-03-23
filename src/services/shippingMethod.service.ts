import api from './api';

export interface ShippingMethod {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const shippingMethodService = {
  getAll: async (): Promise<ShippingMethod[]> => {
    const response = await api.get<ShippingMethod[]>('/shipping-methods');
    return response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    price?: number;
  }): Promise<ShippingMethod> => {
    const response = await api.post<ShippingMethod>('/shipping-methods', data);
    return response.data;
  },

  update: async (
    id: string,
    data: { title?: string; description?: string; price?: number | null; isActive?: boolean },
  ): Promise<ShippingMethod> => {
    const response = await api.patch<ShippingMethod>(`/shipping-methods/${id}`, data);
    return response.data;
  },

  toggle: async (id: string): Promise<ShippingMethod> => {
    const response = await api.patch<ShippingMethod>(`/shipping-methods/${id}/toggle`);
    return response.data;
  },

  remove: async (id: string): Promise<ShippingMethod> => {
    const response = await api.patch<ShippingMethod>(`/shipping-methods/${id}/delete`);
    return response.data;
  },
};
