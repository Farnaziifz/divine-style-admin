import { useEffect, useMemo, useState } from 'react';
import { Loader2, X, ReceiptText, CreditCard, MapPin, Truck } from 'lucide-react';
import { orderService, type OrderComment, type OrderDetails } from '../../services/order.service';
import { getImageUrl } from '../../utils/image';
import { Select } from '../common/Select';

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const statusBadge = (status?: OrderDetails['orderStatus']) => {
  if (status === 'DELIVERED') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'CANCELED') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'SHIPPED') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'CONFIRMED') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (status === 'PAID') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const statusLabel = (status?: OrderDetails['orderStatus']) => {
  if (status === 'PENDING_PAYMENT') return 'در انتظار پرداخت';
  if (status === 'PAID') return 'پرداخت شده';
  if (status === 'CONFIRMED') return 'تایید شده';
  if (status === 'SHIPPED') return 'ارسال شده';
  if (status === 'DELIVERED') return 'دریافت شده';
  if (status === 'CANCELED') return 'لغو شده';
  return 'در انتظار پرداخت';
};

const formatPrice = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
};

interface OrderDetailsModalProps {
  orderCode: string;
  onClose: () => void;
}

export const OrderDetailsModal = ({ orderCode, onClose }: OrderDetailsModalProps) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<
    NonNullable<OrderDetails['orderStatus']>
  >('PENDING_PAYMENT');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const addressText = useMemo(() => {
    const a = (order?.shippingAddress ?? null) as Record<string, unknown> | null;
    if (!a) return null;
    const parts = [
      typeof a.province === 'string' && typeof a.city === 'string'
        ? `${a.province} - ${a.city}`
        : null,
      typeof a.address === 'string' ? a.address : null,
      typeof a.plaque === 'string' ? `پلاک ${a.plaque}` : null,
      typeof a.unit === 'string' ? `واحد ${a.unit}` : null,
      typeof a.postalCode === 'string' ? `کدپستی ${a.postalCode}` : null,
    ].filter(Boolean);
    return parts.join(' | ');
  }, [order?.shippingAddress]);

  useEffect(() => {
    if (!orderCode) return;
    let cancelled = false;
    setIsLoading(true);
    orderService
      .getByOrderCode(orderCode)
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setSelectedOrderStatus((data.orderStatus ?? 'PENDING_PAYMENT') as NonNullable<
          OrderDetails['orderStatus']
        >);
      })
      .catch(() => {
        if (cancelled) return;
        setOrder(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderCode]);

  const comments = order?.comments ?? [];
  const commentsByParent = useMemo(() => {
    const map = new Map<string | null, OrderComment[]>();
    for (const c of comments) {
      const key = c.parentId ?? null;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return map;
  }, [comments]);

  const authorLabel = (c: OrderComment) => {
    if (c.authorRole === 'ADMIN') {
      const name = c.authorUser
        ? [c.authorUser.name, c.authorUser.lastName].filter(Boolean).join(' ')
        : '';
      return name ? `ادمین (${name})` : 'ادمین';
    }
    const fullName = c.authorUser
      ? [c.authorUser.name, c.authorUser.lastName].filter(Boolean).join(' ')
      : '';
    const mobile = c.authorUser?.mobile;
    if (fullName && mobile) return `${fullName} (${mobile})`;
    if (mobile) return mobile;
    return 'کاربر';
  };

  const commentBg = (role: OrderComment['authorRole']) => {
    if (role === 'ADMIN') return 'bg-zafting-accent/5 border-zafting-accent/15';
    return 'bg-gray-50 border-gray-100';
  };

  const renderComment = (c: OrderComment, depth: number) => {
    const replies = commentsByParent.get(c.id) ?? [];
    return (
      <div key={c.id} style={{ marginRight: depth * 16 }}>
        <div className={`rounded-xl border p-4 ${commentBg(c.authorRole)}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {authorLabel(c)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(c.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReplyToId(c.id);
                setReplyMessage('');
              }}
              className="shrink-0 px-3 py-2 rounded-lg border border-gray-200 hover:bg-white transition-colors text-xs font-medium text-gray-700"
            >
              پاسخ
            </button>
          </div>
          <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap leading-7">
            {c.message}
          </p>

          {replyToId === c.id ? (
            <div className="mt-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="پاسخ ادمین..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#6B5B54] transition-all min-h-[90px]"
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!replyMessage.trim()) return;
                    setCommentSaving(true);
                    try {
                      const created = await orderService.createComment({
                        orderCode,
                        message: replyMessage.trim(),
                        parentId: c.id,
                      });
                      setOrder((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          comments: [...(prev.comments ?? []), created],
                        };
                      });
                      setReplyToId(null);
                      setReplyMessage('');
                    } catch {
                      // ignore
                    } finally {
                      setCommentSaving(false);
                    }
                  }}
                  disabled={commentSaving || !replyMessage.trim()}
                  className="px-4 py-2 rounded-lg bg-[#6B5B54] text-white hover:bg-[#5A4A43] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {commentSaving ? 'در حال ثبت...' : 'ثبت پاسخ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyToId(null);
                    setReplyMessage('');
                  }}
                  disabled={commentSaving}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {replies.length > 0 ? (
          <div className="mt-3 space-y-3">
            {replies.map((r) => renderComment(r, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">جزئیات سفارش {orderCode}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-zafting-accent" size={32} />
            </div>
          ) : !order ? (
            <div className="text-center py-12 text-gray-500">سفارش یافت نشد.</div>
          ) : (
            <div className="space-y-8">
              {/* Status Update */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">تغییر وضعیت سفارش</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="w-full sm:w-64">
                    <Select
                      label="وضعیت"
                      value={selectedOrderStatus}
                      onChange={(e) => {
                        setSelectedOrderStatus(e.target.value as NonNullable<OrderDetails['orderStatus']>);
                        setStatusSaved(false);
                        setStatusError(null);
                      }}
                      options={[
                        { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
                        { value: 'PAID', label: 'پرداخت شده' },
                        { value: 'CONFIRMED', label: 'تایید شده' },
                        { value: 'SHIPPED', label: 'ارسال شده' },
                        { value: 'DELIVERED', label: 'دریافت شده' },
                        { value: 'CANCELED', label: 'لغو شده' },
                      ]}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingStatus || selectedOrderStatus === order.orderStatus}
                    onClick={async () => {
                      setSavingStatus(true);
                      setStatusSaved(false);
                      setStatusError(null);
                      try {
                        await orderService.updateOrderStatus(orderCode, selectedOrderStatus);
                        setOrder((prev) => (prev ? { ...prev, orderStatus: selectedOrderStatus } : prev));
                        setStatusSaved(true);
                      } catch {
                        setStatusError('خطا در تغییر وضعیت');
                      } finally {
                        setSavingStatus(false);
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#6B5B54] text-white hover:bg-[#5A4A43] transition-colors font-medium disabled:opacity-50 flex items-center justify-center h-[42px]"
                  >
                    {savingStatus ? <Loader2 className="animate-spin" size={18} /> : 'ثبت تغییرات'}
                  </button>
                </div>
                {statusSaved ? (
                  <p className="text-sm text-green-600 mt-3">وضعیت با موفقیت بروزرسانی شد.</p>
                ) : null}
                {statusError ? (
                  <p className="text-sm text-red-600 mt-3">{statusError}</p>
                ) : null}
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ReceiptText size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">اطلاعات سفارش</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          ثبت شده در {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">کد سفارش</span>
                        <span className="font-mono font-medium text-gray-800">{order.orderCode}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">وضعیت فعلی</span>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(
                            order.orderStatus
                          )}`}
                        >
                          {statusLabel(order.orderStatus)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">کاربر</span>
                        <span className="font-medium text-gray-800">
                          {order.user
                            ? `${order.user.name || ''} ${order.user.lastName || ''}`.trim() ||
                              order.user.mobile
                            : order.userId}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">موبایل</span>
                        <span className="font-mono font-medium text-gray-800 dir-ltr text-right block">
                          {order.user?.mobile || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800">ارسال</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {addressText || 'آدرسی ثبت نشده است.'}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm text-gray-500">روش ارسال:</span>
                        <span className="text-sm font-medium text-gray-800">
                          {order.shippingMethodTitle || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CreditCard size={20} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800">مالی</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">مبلغ کل:</span>
                        <span className="font-medium text-gray-800">{formatPrice(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">تخفیف:</span>
                        <span className="font-medium text-red-600">
                          {order.discountAmount ? '-' + formatPrice(order.discountAmount) : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">هزینه ارسال:</span>
                        <span className="font-medium text-gray-800">{formatPrice(order.shippingCost)}</span>
                      </div>
                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-800">مبلغ پرداختی:</span>
                        <span className="font-bold text-zafting-accent text-lg">
                          {formatPrice(order.payableAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6">اقلام سفارش</h2>
                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ReceiptText size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-800 truncate">{item.title}</h3>
                        {(item.color || item.size) && (
                          <div className="flex items-center gap-2 mt-1.5">
                            {item.color && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: item.color }} />
                                رنگ: {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                                سایز: {item.size}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="font-mono">SKU: {item.sku}</span>
                          <span>تعداد: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        {item.unitDiscountPrice ? (
                          <>
                            <div className="text-xs text-gray-400 line-through mb-1">
                              {formatPrice(item.unitPrice)}
                            </div>
                            <div className="text-sm font-bold text-gray-800">
                              {formatPrice(item.unitDiscountPrice)}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-bold text-gray-800">
                            {formatPrice(item.unitPrice)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6">یادداشت‌ها و پیام‌ها</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    {(commentsByParent.get(null) ?? []).map((c) => renderComment(c, 0))}
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">پیامی ثبت نشده است.</p>
                    ) : null}
                  </div>
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">ثبت پیام جدید</h3>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="پیام خود را بنویسید..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#6B5B54] transition-all min-h-[100px]"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newComment.trim()) return;
                          setCommentSaving(true);
                          try {
                            const created = await orderService.createComment({
                              orderCode,
                              message: newComment.trim(),
                            });
                            setOrder((prev) => {
                              if (!prev) return prev;
                              return {
                                ...prev,
                                comments: [...(prev.comments ?? []), created],
                              };
                            });
                            setNewComment('');
                          } catch {
                            // ignore
                          } finally {
                            setCommentSaving(false);
                          }
                        }}
                        disabled={commentSaving || !newComment.trim()}
                        className="px-6 py-2.5 rounded-xl bg-[#6B5B54] text-white hover:bg-[#5A4A43] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {commentSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                        ثبت پیام
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};