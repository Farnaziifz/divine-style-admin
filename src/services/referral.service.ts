import api from './api';

export const MAX_COMBINED_REFERRAL_PERCENT = 15;

export interface ReferralCodeOwner {
  id: string;
  mobile: string;
  name?: string | null;
  lastName?: string | null;
}

export interface ReferralCodeStats {
  usedCount: number;
  totalCashbackCredited: number;
  totalCashbackPending: number;
}

export interface ReferralCode {
  id: string;
  code: string;
  ownerId: string;
  owner?: ReferralCodeOwner | null;
  discountPercent: number;
  cashbackPercent: number;
  createdByAdmin: boolean;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
  stats: ReferralCodeStats;
}

export interface CreateBloggerReferralCodeDto {
  mobile: string;
  name: string;
  discountPercent: number;
  cashbackPercent: number;
}

export interface UpdateReferralCodeDto {
  discountPercent?: number;
  cashbackPercent?: number;
  isActive?: boolean;
}

export interface ReferralCodeListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedReferralCodes {
  data: ReferralCode[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const referralService = {
  list: async (params: ReferralCodeListParams = {}): Promise<PaginatedReferralCodes> => {
    const response = await api.get('/admin/referral-codes', { params });
    return response.data;
  },

  createForBlogger: async (
    data: CreateBloggerReferralCodeDto,
  ): Promise<ReferralCode> => {
    const response = await api.post('/admin/referral-codes', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateReferralCodeDto,
  ): Promise<ReferralCode> => {
    const response = await api.patch(`/referral-codes/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/referral-codes/${id}`);
    return response.data;
  },
};
