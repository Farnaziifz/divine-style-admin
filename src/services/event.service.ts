import api from './api';

export const EVENT_LANDING_BASE_URL = (
  (import.meta.env.VITE_EVENT_LANDING_BASE_URL as string | undefined) ?? ''
).replace(/\/+$/, '');

export function getEventLandingLink(eventCode: string): string {
  return EVENT_LANDING_BASE_URL ? `${EVENT_LANDING_BASE_URL}/${eventCode}` : eventCode;
}

export interface Event {
  id: string;
  eventCode: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  logoImageUrl: string | null;
  bannerImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateEventDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedEvents {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const eventService = {
  list: async (params: EventListParams = {}): Promise<PaginatedEvents> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (data: CreateEventDto): Promise<Event> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEventDto): Promise<Event> => {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },

  updateLogoImage: async (id: string, url: string | null): Promise<Event> => {
    const response = await api.patch(`/events/${id}/logo-image`, { url });
    return response.data;
  },

  updateBannerImage: async (id: string, url: string | null): Promise<Event> => {
    const response = await api.patch(`/events/${id}/banner-image`, { url });
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

export interface EventPaymentItem {
  id: string;
  productId: string;
  productVariantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface EventPaymentRow {
  id: string;
  amount: number;
  refId: string | null;
  verifiedAt: string | null;
  createdAt: string;
  user: { mobile: string; name: string | null };
  items: EventPaymentItem[];
  isAssigned: boolean;
}

export interface AssignPaymentItemPayload {
  productId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export const eventPaymentAdminService = {
  list: async (
    eventId: string,
    params: { page?: number; limit?: number; unassignedOnly?: boolean } = {},
  ): Promise<{
    data: EventPaymentRow[];
    meta: { total: number; page: number; limit: number; lastPage: number };
  }> => {
    const response = await api.get(`/events/${eventId}/payments`, { params });
    return response.data;
  },

  assignItems: async (
    eventId: string,
    paymentId: string,
    items: AssignPaymentItemPayload[],
  ): Promise<EventPaymentRow> => {
    const response = await api.put(`/events/${eventId}/payments/${paymentId}/items`, { items });
    return response.data;
  },
};
