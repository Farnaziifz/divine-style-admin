import api from './api';

export interface OrderUser {
  id: string;
  mobile: string;
  name?: string | null;
  lastName?: string | null;
}

export interface Order {
  id: string;
  orderCode: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus?: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
  totalAmount?: number;
  discountCode?: string | null;
  discountAmount?: number;
  shippingCost?: number;
  packagingCost?: number;
  shippingMethodId?: string | null;
  shippingMethodTitle?: string | null;
  shippingMethodPrice?: number | null;
  payableAmount?: number;
  userId: string;
  user?: OrderUser;
  /** Latest payment attempt (list endpoint returns only the newest one). */
  payment?: { provider: string; status: string; gatewayStatus?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId: string;
  sku: string;
  title: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  unitDiscountPrice: number | null;
  /** بهای تمام‌شدهٔ واحد (اسنپ‌شات لحظهٔ سفارش) — فقط برای ادمین/اپراتور */
  costPrice?: number;
  imageUrl?: string | null;
  createdAt: string;
}

export interface OrderPayment {
  id: string;
  provider: string;
  status: string;
  amount: number;
  authority: string | null;
  refId: string | null;
  gatewayTransactionId?: string | null;
  gatewayStatus?: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface OrderComment {
  id: string;
  orderId: string;
  authorRole: 'USER' | 'ADMIN';
  authorUser: OrderUser | null;
  parentId: string | null;
  message: string;
  createdAt: string;
}

export interface OrderFinancials {
  itemsQuantity: number;
  costOfGoods: number;
  packagingCostForProfit: number;
  netProfit: number;
  walletApplied: number;
}

export interface OrderMoneySnapshot {
  totalAmount: number;
  discountAmount: number;
  shippingCost: number;
  packagingCost: number;
  walletApplied: number;
  payableAmount: number;
}

/** نتیجهٔ ویرایش/حذف: اثر مالی و مبالغی که باید دستی به مشتری برگردد */
export interface OrderChangeImpact {
  previous: OrderMoneySnapshot;
  current: OrderMoneySnapshot;
  gatewayRefundDue: number;
  walletRefundDue: number;
  warnings: string[];
}

export interface OrderDetails extends Order {
  financials?: OrderFinancials;
  shippingAddress?: unknown;
  paidAt?: string | null;
  items: OrderItem[];
  payments: OrderPayment[];
  comments?: OrderComment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const orderService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    userId?: string;
    paymentProvider?: string;
  }) => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', {
      params,
    });
    return response.data;
  },

  getByOrderCode: async (orderCode: string) => {
    const response = await api.get<OrderDetails>(`/orders/${encodeURIComponent(orderCode)}`);
    return response.data;
  },

  updateOrderStatus: async (orderCode: string, status: NonNullable<Order['orderStatus']>) => {
    const response = await api.patch(`/orders/${encodeURIComponent(orderCode)}/status`, { status });
    return response.data;
  },

  createComment: async (params: {
    orderCode: string;
    message: string;
    parentId?: string;
  }) => {
    const response = await api.post(
      `/orders/${encodeURIComponent(params.orderCode)}/comments`,
      {
        message: params.message,
        ...(params.parentId ? { parentId: params.parentId } : {}),
      },
    );
    return response.data as OrderComment;
  },
  updateOrder: async (
    orderCode: string,
    data: { discountAmount?: number; shippingCost?: number; packagingCost?: number },
  ) => {
    const response = await api.patch<OrderChangeImpact>(`/orders/${encodeURIComponent(orderCode)}`, data);
    return response.data;
  },

  updateItem: async (
    orderCode: string,
    itemId: string,
    data: {
      quantity?: number;
      unitPrice?: number;
      unitDiscountPrice?: number | null;
      returnToStock?: boolean;
    },
  ) => {
    const response = await api.patch<OrderChangeImpact>(
      `/orders/${encodeURIComponent(orderCode)}/items/${encodeURIComponent(itemId)}`,
      data,
    );
    return response.data;
  },

  deleteItem: async (orderCode: string, itemId: string, returnToStock: boolean) => {
    const response = await api.delete<OrderChangeImpact>(
      `/orders/${encodeURIComponent(orderCode)}/items/${encodeURIComponent(itemId)}`,
      { params: { returnToStock } },
    );
    return response.data;
  },

  deleteOrder: async (orderCode: string, returnToStock: boolean) => {
    const response = await api.delete<OrderChangeImpact>(`/orders/${encodeURIComponent(orderCode)}`, {
      params: { returnToStock },
    });
    return response.data;
  },
};
