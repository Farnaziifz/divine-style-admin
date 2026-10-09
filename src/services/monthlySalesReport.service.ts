import api from './api';

export interface MonthlyReportDay {
  day: number;
  ordersCount: number;
  salesCount: number;
  onlinePayableAmount: number;
  offlinePayableAmount: number;
  payableAmount: number;
  onlineNetProfit: number;
  offlineNetProfit: number;
  netProfit: number;
}

export interface MonthlyReportTopProduct {
  productId: string;
  title: string;
  quantity: number;
  ordersCount: number;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
}

export interface MonthlyReportChannel {
  channel: string;
  salesCount: number;
  payableAmount: number;
  netProfit: number;
}

export interface MonthlyReportResponse {
  year: number;
  month: number;
  monthName: string;
  monthLength: number;
  online: {
    ordersCount: number;
    itemsCount: number;
    totalAmount: number;
    discountAmount: number;
    shippingCost: number;
    payableAmount: number;
    averageOrderValue: number;
    costOfGoods: number;
    packagingCost: number;
    netProfit: number;
  };
  offline: {
    salesCount: number;
    totalAmount: number;
    discountAmount: number;
    commissionAmount: number;
    payableAmount: number;
    netAmount: number;
    costOfGoods: number;
    netProfit: number;
  };
  total: {
    count: number;
    payableAmount: number;
    costOfGoods: number;
    netProfit: number;
  };
  previous: {
    year: number;
    month: number;
    monthName: string;
    count: number;
    payableAmount: number;
    netProfit: number;
  };
  daily: MonthlyReportDay[];
  topProducts: MonthlyReportTopProduct[];
  offlineChannels: MonthlyReportChannel[];
}

export const monthlySalesReportService = {
  get: async (year: number, month: number) => {
    const { data } = await api.get<MonthlyReportResponse>('/admin/reports/sales/monthly-report', {
      params: { year, month },
    });
    return data;
  },
};
