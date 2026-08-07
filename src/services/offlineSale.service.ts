import api from './api';

export interface OfflineSaleItem {
  id: string;
  productId: string;
  productVariantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: number;
  unitCostPrice: number;
  createdAt: string;
}

export interface OfflineSale {
  id: string;
  channel: string;
  commissionPercent: number | null;
  discountAmount: number;
  totalAmount: number;
  commissionAmount: number;
  payableAmount: number;
  netAmount: number;
  costOfGoods: number;
  note: string | null;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
  items: OfflineSaleItem[];
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

export interface CreateOfflineSaleItemPayload {
  productId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOfflineSalePayload {
  channel: string;
  commissionPercent?: number;
  discountAmount?: number;
  note?: string;
  soldAt?: string;
  items: CreateOfflineSaleItemPayload[];
}

export const offlineSaleService = {
  create: async (data: CreateOfflineSalePayload): Promise<OfflineSale> => {
    const response = await api.post('/admin/offline-sales', data);
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    from?: string;
    to?: string;
  }): Promise<PaginatedResponse<OfflineSale>> => {
    const response = await api.get('/admin/offline-sales', { params });
    return response.data;
  },

  getById: async (id: string): Promise<OfflineSale> => {
    const response = await api.get(`/admin/offline-sales/${id}`);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/offline-sales/${id}`);
  },
};
