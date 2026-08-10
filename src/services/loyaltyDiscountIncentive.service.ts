import api from './api';

export type IncentiveValueType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type IncentiveTierType = 'FLAT' | 'STEPPED' | 'USAGE_STEPPED';
export type IncentiveUsageType = 'SINGLE_USE' | 'MULTI_USE';

export interface DiscountCodeTier {
  /** برای tierType = STEPPED */
  minAmount?: number;
  /** برای tierType = USAGE_STEPPED — امین بار استفادهٔ مشتری (۱، ۲، ۳، ...) */
  usageIndex?: number;
  value: number;
}

export interface TargetSegment {
  id: string;
  key: string;
  label: string;
}

export interface DiscountCodeDetail {
  code: string;
  valueType: IncentiveValueType;
  value: number;
  tierType: IncentiveTierType;
  usageType: IncentiveUsageType;
  minPurchaseAmount: number | null;
  tiers: DiscountCodeTier[];
}

export interface DiscountIncentive {
  id: string;
  type: 'DISCOUNT_CODE';
  title: string;
  targetSegmentId: string | null;
  targetSegment: TargetSegment | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  discountCodeDetail: DiscountCodeDetail | null;
}

export interface CreateDiscountIncentiveDto {
  title: string;
  targetSegmentId?: string;
  code: string;
  valueType: IncentiveValueType;
  value: number;
  tierType?: IncentiveTierType;
  tiers?: DiscountCodeTier[];
  usageType?: IncentiveUsageType;
  minPurchaseAmount?: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface DiscountIncentiveListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  targetSegmentId?: string;
}

export interface PaginatedDiscountIncentives {
  data: DiscountIncentive[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const loyaltyDiscountIncentiveService = {
  list: async (
    params: DiscountIncentiveListParams = {},
  ): Promise<PaginatedDiscountIncentives> => {
    const response = await api.get('/incentives/discount-codes', { params });
    return response.data;
  },

  create: async (data: CreateDiscountIncentiveDto): Promise<DiscountIncentive> => {
    const response = await api.post('/incentives/discount-codes', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateDiscountIncentiveDto>,
  ): Promise<DiscountIncentive> => {
    const response = await api.patch(`/incentives/discount-codes/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string): Promise<DiscountIncentive> => {
    const response = await api.patch(`/incentives/discount-codes/${id}/deactivate`);
    return response.data;
  },
};
