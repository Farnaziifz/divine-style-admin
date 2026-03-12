import api from './api';

export interface OrderUser {
  id: string;
  mobile: string;
  name?: string | null;
  lastName?: string | null;
}

export interface Order {
  id: string;
  userId: string;
  user?: OrderUser;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const orderService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', {
      params,
    });
    return response.data;
  },
};
