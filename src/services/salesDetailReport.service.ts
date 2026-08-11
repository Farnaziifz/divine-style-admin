import api from './api';

export interface SalesDetailRow {
  orderId: string;
  orderCode: string;
  paidAt: string;
  customerName: string | null;
  customerMobile: string | null;
  products: string;
  quantity: number;
  totalAmount: string;
  discountAmount: string;
  shippingCost: string;
  payableAmount: string;
  costOfGoods: string;
  packagingCost: string;
  netProfit: string;
}

export interface SalesDetailResponse {
  range: { from: string; to: string };
  page: number;
  pageSize: number;
  total: number;
  data: SalesDetailRow[];
}

export const salesDetailReportService = {
  getDetail: async (params: {
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await api.get<SalesDetailResponse>('/admin/reports/sales/detail', {
      params,
    });
    return data;
  },
};
