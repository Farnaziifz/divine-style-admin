import api from './api';

export interface PaymentTransactionOrderRef {
  id: string;
  orderCode: string;
  userId: string;
}

export interface PaymentTransaction {
  id: string;
  provider: string;
  status: 'INITIATED' | 'PAID' | 'FAILED' | string;
  amount: number;
  authority: string | null;
  refId: string | null;
  createdAt: string;
  verifiedAt: string | null;
  order: PaymentTransactionOrderRef | null;
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

export const paymentTransactionService = {
  getAll: async (params?: { page?: number; limit?: number; userId?: string }) => {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>(
      '/payments/transactions',
      {
        params,
      },
    );
    return response.data;
  },
};

