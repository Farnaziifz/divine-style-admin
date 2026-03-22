import api from './api';

export type DiscountCodeScope = 'ALL_USERS' | 'SINGLE_USER' | 'USER_GROUP';
export type DiscountValueType = 'PERCENT' | 'FIXED_AMOUNT';

export interface DiscountCodeUser {
  id: string;
  mobile: string;
  name?: string | null;
  lastName?: string | null;
}

export interface DiscountCode {
  id: string;
  code: string;
  title: string | null;
  scope: DiscountCodeScope;
  userId: string | null;
  userGroupId: string | null;
  valueType: DiscountValueType;
  value: number;
  minOrderAmount: number | null;
  validFrom: string;
  validTo: string;
  maxTotalUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: DiscountCodeUser | null;
}

export interface CreateDiscountCodeDto {
  code: string;
  title?: string;
  scope: DiscountCodeScope;
  userId?: string;
  userGroupId?: string;
  valueType: DiscountValueType;
  value: number;
  minOrderAmount?: number;
  validFrom: string;
  validTo: string;
  maxTotalUses?: number;
  isActive?: boolean;
}

export interface DiscountCodeListParams {
  page?: number;
  limit?: number;
  search?: string;
  scope?: DiscountCodeScope;
  isActive?: boolean;
}

export interface PaginatedDiscountCodes {
  data: DiscountCode[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const discountService = {
  list: async (params: DiscountCodeListParams = {}): Promise<PaginatedDiscountCodes> => {
    const response = await api.get('/discount-codes', { params });
    return response.data;
  },

  getById: async (id: string): Promise<DiscountCode> => {
    const response = await api.get(`/discount-codes/${id}`);
    return response.data;
  },

  create: async (data: CreateDiscountCodeDto): Promise<DiscountCode> => {
    const response = await api.post('/discount-codes', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateDiscountCodeDto>,
  ): Promise<DiscountCode> => {
    const response = await api.patch(`/discount-codes/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/discount-codes/${id}`);
    return response.data;
  },
};
