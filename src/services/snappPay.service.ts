import api from './api';

export type SnappPayMethodType = 'INSTALLMENT' | 'POSTPAID' | 'FINANCING';

export interface SnappPaySettings {
  enabled: boolean;
  forcedPaymentMethodTypes: SnappPayMethodType[];
  commissionType: number;
}

export interface SnappPayConfigStatus {
  mode: 'mock' | 'real';
  baseUrl: string;
  isStaging: boolean;
  credentials: Record<
    | 'SNAPPPAY_BASE_URL'
    | 'SNAPPPAY_CLIENT_ID'
    | 'SNAPPPAY_CLIENT_SECRET'
    | 'SNAPPPAY_USERNAME'
    | 'SNAPPPAY_PASSWORD',
    boolean
  >;
  callbackUrl: string;
}

export interface SnappPayAdminSettings {
  settings: SnappPaySettings;
  status: SnappPayConfigStatus;
  configured: boolean;
}

export interface SnappPayRemoteStatus {
  transactionId: string;
  status: string;
  amount?: number;
}

export const snappPayService = {
  getSettings: async () =>
    (await api.get<SnappPayAdminSettings>('/payments/snapppay/admin/settings')).data,

  updateSettings: async (dto: Partial<SnappPaySettings>) =>
    (await api.patch<{ settings: SnappPaySettings }>('/payments/snapppay/admin/settings', dto))
      .data,

  testConnection: async () =>
    (
      await api.post<{ ok: boolean; mock?: boolean; message?: string }>(
        '/payments/snapppay/admin/test-connection',
      )
    ).data,

  getServerIp: async () =>
    (await api.get<{ ip: string | null }>('/payments/snapppay/admin/server-ip')).data,

  eligibilityTest: async (amountToman: number) =>
    (
      await api.get<{
        ok: boolean;
        eligible?: boolean;
        title_message?: string;
        description?: string;
        message?: string;
      }>('/payments/snapppay/admin/eligibility-test', { params: { amount: amountToman } })
    ).data,

  getRemoteStatus: async (paymentTransactionId: string) =>
    (await api.get<SnappPayRemoteStatus>(`/payments/snapppay/${paymentTransactionId}/status`))
      .data,

  reconcile: async (paymentTransactionId: string) =>
    (
      await api.post<{ status: string; finalized: boolean }>(
        `/payments/snapppay/${paymentTransactionId}/reconcile`,
      )
    ).data,

  cancel: async (paymentTransactionId: string) =>
    (
      await api.post(`/payments/snapppay/${paymentTransactionId}/cancel`, {
        confirm: true,
      })
    ).data,

  updateOrder: async (
    paymentTransactionId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
  ) =>
    (
      await api.post<{ payableAmount: number; reduction: number }>(
        `/payments/snapppay/${paymentTransactionId}/update`,
        { confirm: true, items },
      )
    ).data,
};
