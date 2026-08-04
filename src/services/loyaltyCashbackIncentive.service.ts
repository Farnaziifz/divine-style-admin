import api from './api';

export type IncentiveValueType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface TargetSegment {
  id: string;
  key: string;
  label: string;
}

export interface CashbackDetail {
  valueType: IncentiveValueType;
  value: number;
  expiresAfterDays: number | null;
  minPurchaseAmount: number | null;
}

export interface CashbackIncentive {
  id: string;
  type: 'CASHBACK';
  title: string;
  targetSegmentId: string | null;
  targetSegment: TargetSegment | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  cashbackDetail: CashbackDetail | null;
}

export interface CreateCashbackIncentiveDto {
  title: string;
  targetSegmentId?: string;
  valueType: IncentiveValueType;
  value: number;
  expiresAfterDays?: number;
  minPurchaseAmount?: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface CashbackIncentiveListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  targetSegmentId?: string;
}

export interface PaginatedCashbackIncentives {
  data: CashbackIncentive[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const loyaltyCashbackIncentiveService = {
  list: async (
    params: CashbackIncentiveListParams = {},
  ): Promise<PaginatedCashbackIncentives> => {
    const response = await api.get('/incentives/cashback', { params });
    return response.data;
  },

  create: async (data: CreateCashbackIncentiveDto): Promise<CashbackIncentive> => {
    const response = await api.post('/incentives/cashback', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateCashbackIncentiveDto>,
  ): Promise<CashbackIncentive> => {
    const response = await api.patch(`/incentives/cashback/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string): Promise<CashbackIncentive> => {
    const response = await api.patch(`/incentives/cashback/${id}/deactivate`);
    return response.data;
  },
};
