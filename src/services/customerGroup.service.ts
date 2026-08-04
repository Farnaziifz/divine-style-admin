import api from './api';

export interface CustomerGroupMemberUser {
  id: string;
  mobile: string;
  name?: string | null;
  lastName?: string | null;
}

export interface CustomerGroup {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
  /** فقط در جزئیات یک گروه برگردانده می‌شود */
  members?: CustomerGroupMemberUser[];
}

export interface CreateCustomerGroupDto {
  title: string;
  description?: string;
  memberUserIds?: string[];
  isActive?: boolean;
}

export interface CustomerGroupListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedCustomerGroups {
  data: CustomerGroup[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const customerGroupService = {
  list: async (params: CustomerGroupListParams = {}): Promise<PaginatedCustomerGroups> => {
    const response = await api.get('/customer-groups', { params });
    return response.data;
  },

  getById: async (id: string): Promise<CustomerGroup> => {
    const response = await api.get(`/customer-groups/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerGroupDto): Promise<CustomerGroup> => {
    const response = await api.post('/customer-groups', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateCustomerGroupDto>,
  ): Promise<CustomerGroup> => {
    const response = await api.patch(`/customer-groups/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/customer-groups/${id}`);
    return response.data;
  },
};
