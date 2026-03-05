import api from './api';

export interface UserProfile {
  id: string;
  mobile: string;
  name?: string;
  lastName?: string;
  job?: string;
  nationalCode?: string;
  role: string;
  hasPassword?: boolean;
  isProfileComplete?: boolean;
  ordersCount?: number;
  createdAt?: string;
}

export interface UpdateUserDto {
  name?: string;
  lastName?: string;
  job?: string;
  nationalCode?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateUserDto): Promise<UserProfile> => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  getUsers: async (
    page: number = 1,
    limit: number = 10,
    filters?: { name?: string; mobile?: string }
  ): Promise<PaginatedResponse<UserProfile>> => {
    const params: Record<string, string | number> = { page, limit };
    if (filters?.name) params.name = filters.name;
    if (filters?.mobile) params.mobile = filters.mobile;
    
    const response = await api.get('/user/list', { params });
    return response.data;
  },
};
