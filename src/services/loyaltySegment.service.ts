import api from './api';

export interface LoyaltySegment {
  id: string;
  key: string;
  label: string;
  description: string | null;
  membersCount: number;
}

export interface LoyaltySegmentMember {
  /** برابر customerId — برای استفاده به‌عنوان کلید ردیف در <Table> */
  id: string;
  customerId: string;
  name: string | null;
  lastName: string | null;
  mobile: string;
  recencyDays: number;
  frequencyCount: number;
  monetaryTotal: number;
  computedAt: string;
}

export const loyaltySegmentService = {
  list: async (): Promise<LoyaltySegment[]> => {
    const response = await api.get('/loyalty/segments');
    return response.data;
  },

  getMembers: async (segmentId: string): Promise<LoyaltySegmentMember[]> => {
    const response = await api.get(`/loyalty/segments/${segmentId}/members`);
    return response.data.map((m: Omit<LoyaltySegmentMember, 'id'>) => ({
      ...m,
      id: m.customerId,
    }));
  },
};
