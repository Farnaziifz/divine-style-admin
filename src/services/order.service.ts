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
  shippingMethodId?: string | null;
  shippingMethodTitle?: string | null;
  shippingMethodPrice?: number | null;
  payableAmount?: number;
  userId: string;
  user?: OrderUser;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: number;
  unitDiscountPrice: number | null;
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

export interface OrderDetails extends Order {
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
  getAll: async (params?: { page?: number; limit?: number; q?: string }) => {
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
};
