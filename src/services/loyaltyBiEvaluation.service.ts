import api from './api';

export interface ChurnSnapshot {
  id: string;
  computedAt: string;
  totalCustomers: number;
  atRiskCount: number;
  lostCount: number;
  regularCount: number;
  churnRatePercent: number;
}

export interface LoyaltySnapshot {
  id: string;
  computedAt: string;
  totalCustomers: number;
  loyalCount: number;
  promisingCount: number;
  regularCount: number;
  loyaltyRatePercent: number;
}

export interface SnapshotHistoryParams {
  limit?: number;
  from?: string;
  to?: string;
}

export const loyaltyBiEvaluationService = {
  getChurnLatest: async (): Promise<ChurnSnapshot | null> => {
    const response = await api.get('/loyalty/bi/churn/latest');
    return response.data;
  },

  getChurnHistory: async (params: SnapshotHistoryParams = {}): Promise<ChurnSnapshot[]> => {
    const response = await api.get('/loyalty/bi/churn/history', { params });
    return response.data;
  },

  getLoyaltyLatest: async (): Promise<LoyaltySnapshot | null> => {
    const response = await api.get('/loyalty/bi/loyalty/latest');
    return response.data;
  },

  getLoyaltyHistory: async (params: SnapshotHistoryParams = {}): Promise<LoyaltySnapshot[]> => {
    const response = await api.get('/loyalty/bi/loyalty/history', { params });
    return response.data;
  },
};
