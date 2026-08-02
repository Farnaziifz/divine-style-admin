import api from './api';

export type ContentEntryType = 'POST' | 'STORY';

export interface ContentCalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: ContentEntryType;
  title: string | null;
  products: {
    id: string;
    title: string;
    images: string[];
  }[];
  isDone: boolean;
  doneAt: string | null;
}

export interface CreateEntryPayload {
  date: string;
  type: ContentEntryType;
  title?: string;
  productIds?: string[];
}

export const contentCalendarService = {
  getRange: async (from: string, to: string): Promise<ContentCalendarEntry[]> => {
    const response = await api.get('/content-calendar', { params: { from, to } });
    return response.data;
  },

  toggle: async (id: string, isDone: boolean): Promise<ContentCalendarEntry> => {
    const response = await api.patch(`/content-calendar/${id}/toggle`, { isDone });
    return response.data;
  },

  create: async (data: CreateEntryPayload): Promise<ContentCalendarEntry> => {
    const response = await api.post('/content-calendar', data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/content-calendar/${id}`);
  },

  getSettings: async (): Promise<{ replanIntervalDays: number }> => {
    const response = await api.get('/content-calendar/settings');
    return response.data;
  },

  updateSettings: async (replanIntervalDays: number): Promise<{ replanIntervalDays: number }> => {
    const response = await api.patch('/content-calendar/settings', { replanIntervalDays });
    return response.data;
  },
};
