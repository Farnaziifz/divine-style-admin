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

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateUserDto): Promise<UserProfile> => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  getUsers: async (): Promise<UserProfile[]> => {
    const response = await api.get('/user/list');
    return response.data;
  },
};
