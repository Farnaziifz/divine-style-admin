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

export interface UserAddress {
  id: string;
  province: string;
  city: string;
  address: string;
  plaque?: string;
  unit?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface CreateUserAddressDto {
  province: string;
  city: string;
  address: string;
  plaque?: string;
  unit?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateUserAddressDto {
  province?: string;
  city?: string;
  address?: string;
  plaque?: string;
  unit?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
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

  getMyAddresses: async (): Promise<UserAddress[]> => {
    const response = await api.get('/user/profile/addresses');
    return response.data;
  },

  addMyAddress: async (data: CreateUserAddressDto): Promise<UserAddress[]> => {
    const response = await api.post('/user/profile/addresses', data);
    return response.data;
  },

  updateMyAddress: async (
    addressId: string,
    data: UpdateUserAddressDto,
  ): Promise<UserAddress[]> => {
    const response = await api.patch(`/user/profile/addresses/${addressId}`, data);
    return response.data;
  },

  deleteMyAddress: async (addressId: string): Promise<UserAddress[]> => {
    const response = await api.delete(`/user/profile/addresses/${addressId}`);
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

  getUserById: async (id: string): Promise<UserProfile> => {
    const response = await api.get(`/user/${id}`);
    return response.data;
  },
};
