import api from './api';

export type ReportPeriod = 'week' | 'month' | 'year';

export type IncentiveType = 'DISCOUNT_CODE' | 'CASHBACK' | 'COUPON';

export interface ReportTargetSegment {
  id: string;
  key: string;
  label: string;
}

export interface IncentiveReportRow {
  incentiveId: string;
  type: IncentiveType;
  title: string;
  isActive: boolean;
  targetSegment: ReportTargetSegment | null;
  redemptionsCount: number;
  totalCost: number;
  totalRevenue: number;
  eligiblePoolSize: number;
  successRatePercent: number;
}

export interface SegmentReportRow {
  segmentKey: string;
  segmentSize: number;
  redemptionsCount: number;
  totalCost: number;
  totalRevenue: number;
  successRatePercent: number;
}

export interface IncentivePerformanceReport {
  range: { from: string; to: string };
  byIncentive: IncentiveReportRow[];
  bySegment: SegmentReportRow[];
}

export const loyaltyIncentiveReportService = {
  getPerformance: async (period: ReportPeriod): Promise<IncentivePerformanceReport> => {
    const response = await api.get('/loyalty/reports/incentive-performance', {
      params: { period },
    });
    return response.data;
  },
};
