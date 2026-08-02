import api from './api';

export interface OrderNotificationPhone {
  id: string;
  phoneNumber: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const orderNotificationPhoneService = {
  getAll: async (): Promise<OrderNotificationPhone[]> => {
    const response = await api.get<OrderNotificationPhone[]>(
      '/order-notification-phones',
    );
    return response.data;
  },

  create: async (data: {
    phoneNumber: string;
    label?: string;
  }): Promise<OrderNotificationPhone> => {
    const response = await api.post<OrderNotificationPhone>(
      '/order-notification-phones',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: { phoneNumber?: string; label?: string; isActive?: boolean },
  ): Promise<OrderNotificationPhone> => {
    const response = await api.patch<OrderNotificationPhone>(
      `/order-notification-phones/${id}`,
      data,
    );
    return response.data;
  },

  toggle: async (id: string): Promise<OrderNotificationPhone> => {
    const response = await api.patch<OrderNotificationPhone>(
      `/order-notification-phones/${id}/toggle`,
    );
    return response.data;
  },

  remove: async (id: string): Promise<OrderNotificationPhone> => {
    const response = await api.patch<OrderNotificationPhone>(
      `/order-notification-phones/${id}/delete`,
    );
    return response.data;
  },
};
