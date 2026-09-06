import api from './api';

export interface WalletWithdrawalUser {
  id: string;
  mobile: string;
  name?: string | null;
  lastName?: string | null;
}

export type WalletWithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface WalletWithdrawal {
  id: string;
  amount: number;
  cardNumber: string;
  status: WalletWithdrawalStatus;
  adminNote: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  user?: WalletWithdrawalUser | null;
}

export interface WalletWithdrawalListParams {
  page?: number;
  limit?: number;
  status?: WalletWithdrawalStatus;
}

export interface PaginatedWalletWithdrawals {
  data: WalletWithdrawal[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const walletService = {
  listWithdrawals: async (
    params: WalletWithdrawalListParams = {},
  ): Promise<PaginatedWalletWithdrawals> => {
    const response = await api.get('/admin/wallet/withdrawals', { params });
    return response.data;
  },

  resolveWithdrawal: async (
    id: string,
    data: { action: 'PAID' | 'REJECTED'; adminNote?: string },
  ): Promise<WalletWithdrawal> => {
    const response = await api.patch(`/admin/wallet/withdrawals/${id}`, data);
    return response.data;
  },
};
