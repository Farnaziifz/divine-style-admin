import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ArrowRight, ReceiptText, CreditCard, MapPin, Truck } from 'lucide-react';
import { orderService, type OrderComment, type OrderDetails } from '../services/order.service';
import { getImageUrl } from '../utils/image';
import { Select } from '../components/common/Select';

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

const OrderDetail = () => {
  const { orderCode } = useParams<{ orderCode: string }>();
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
    Promise.resolve().then(() => {
      if (cancelled) return;
      setIsLoading(true);
    });
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

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin text-zafting-accent" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-600">سفارش یافت نشد.</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          <ArrowRight size={16} />
          بازگشت به سفارشات
        </Link>
      </div>
    );
  }

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
                        orderCode: order.orderCode,
                        message: replyMessage.trim(),
                        parentId: c.id,
                      });
                      setOrder({
                        ...order,
                        comments: [...comments, created],
                      });
                      setReplyToId(null);
                      setReplyMessage('');
                    } finally {
                      setCommentSaving(false);
                    }
                  }}
                  disabled={commentSaving || !replyMessage.trim()}
                  className="px-4 py-2.5 rounded-lg bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {commentSaving ? 'در حال ارسال...' : 'ارسال پاسخ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyToId(null);
                    setReplyMessage('');
                  }}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
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

  const statusOptions: Array<{ value: NonNullable<OrderDetails['orderStatus']>; label: string }> = [
    { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
    { value: 'PAID', label: 'پرداخت شده' },
    { value: 'CONFIRMED', label: 'تایید شده' },
    { value: 'SHIPPED', label: 'ارسال شده' },
    { value: 'DELIVERED', label: 'دریافت شده' },
    { value: 'CANCELED', label: 'لغو شده' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zafting-accent/10 text-zafting-accent flex items-center justify-center">
            <ReceiptText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">جزئیات سفارش</h1>
            <p className="text-sm text-gray-500 font-mono dir-ltr">{order.orderCode}</p>
          </div>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          <ArrowRight size={16} />
          بازگشت
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">وضعیت سفارش</p>
                <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(order.orderStatus)}`}>
                  {statusLabel(order.orderStatus)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div>ثبت: {formatDateTime(order.createdAt)}</div>
                <div>پرداخت: {formatDateTime(order.paidAt)}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <div className={savingStatus ? 'pointer-events-none opacity-70' : ''}>
                  <Select
                    label="تغییر وضعیت سفارش"
                    options={statusOptions.map((o) => {
                      const palette =
                        o.value === 'DELIVERED'
                          ? {
                              className: 'text-green-700',
                              selectedClassName:
                                'bg-green-100 text-green-800 font-medium',
                            }
                          : o.value === 'CANCELED'
                            ? {
                                className: 'text-red-700',
                                selectedClassName:
                                  'bg-red-100 text-red-800 font-medium',
                              }
                            : o.value === 'SHIPPED'
                              ? {
                                  className: 'text-blue-700',
                                  selectedClassName:
                                    'bg-blue-100 text-blue-800 font-medium',
                                }
                              : o.value === 'CONFIRMED'
                                ? {
                                    className: 'text-purple-700',
                                    selectedClassName:
                                      'bg-purple-100 text-purple-800 font-medium',
                                  }
                                : o.value === 'PAID'
                                  ? {
                                      className: 'text-emerald-700',
                                      selectedClassName:
                                        'bg-emerald-100 text-emerald-800 font-medium',
                                    }
                                  : {
                                      className: 'text-amber-700',
                                      selectedClassName:
                                        'bg-amber-100 text-amber-800 font-medium',
                                    };
                      return {
                        label: o.label,
                        value: o.value,
                        className: palette.className,
                        selectedClassName: palette.selectedClassName,
                      };
                    })}
                    value={selectedOrderStatus}
                    onChange={(e) => {
                      const next = e.target
                        .value as NonNullable<OrderDetails['orderStatus']>;
                      if (next === 'PAID' && order.paymentStatus !== 'PAID') {
                        setStatusError(
                          'تا زمانی که پرداخت موفق نباشد، امکان قرار دادن وضعیت «پرداخت شده» وجود ندارد.',
                        );
                        return;
                      }
                      setStatusError(null);
                      setSelectedOrderStatus(next);
                      setStatusSaved(false);
                    }}
                    error={statusError ?? undefined}
                  />
                </div>
                {order.paymentStatus !== 'PAID' ? (
                  <p className="text-xs text-gray-400 mt-2">
                    تا زمانی که پرداخت موفق نباشد، امکان قرار دادن وضعیت «پرداخت شده» وجود ندارد.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={async () => {
                  setSavingStatus(true);
                  setStatusSaved(false);
                  setStatusError(null);
                  try {
                    await orderService.updateOrderStatus(order.orderCode, selectedOrderStatus);
                    setOrder({ ...order, orderStatus: selectedOrderStatus });
                    setStatusSaved(true);
                  } finally {
                    setSavingStatus(false);
                  }
                }}
                disabled={savingStatus || selectedOrderStatus === (order.orderStatus ?? 'PENDING_PAYMENT')}
                className="w-full px-4 py-3 rounded-xl bg-zafting-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingStatus ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
            {statusSaved ? (
              <p className="text-sm text-green-700 mt-4">وضعیت سفارش ذخیره شد.</p>
            ) : null}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#2A2A2A] mb-4">اقلام سفارش</h2>
            <div className="divide-y divide-gray-100">
              {order.items.map((it) => (
                <div key={it.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-start gap-4">
                      {it.imageUrl ? (
                        <img
                          src={getImageUrl(it.imageUrl)}
                          alt={it.title}
                          className="w-16 h-20 rounded-lg object-cover border border-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-100 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">{it.title}</div>
                        <div className="text-xs text-gray-400 font-mono dir-ltr truncate">{it.sku}</div>
                        <div className="text-sm text-gray-600 mt-2">تعداد: {it.quantity}</div>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <div className="text-sm text-gray-500">قیمت واحد</div>
                    <div className="text-sm font-bold text-gray-800">
                      {formatPrice(it.unitDiscountPrice ?? it.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#2A2A2A] mb-4">گفتگو درباره سفارش</h2>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                پیام جدید ادمین
              </label>
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
                        orderCode: order.orderCode,
                        message: newComment.trim(),
                      });
                      setOrder({
                        ...order,
                        comments: [...comments, created],
                      });
                      setNewComment('');
                    } finally {
                      setCommentSaving(false);
                    }
                  }}
                  disabled={commentSaving || !newComment.trim()}
                  className="px-5 py-2.5 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {commentSaving ? 'در حال ارسال...' : 'ارسال پیام'}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {commentsByParent.get(null)?.length ? (
                (commentsByParent.get(null) ?? []).map((c) => renderComment(c, 0))
              ) : (
                <p className="text-sm text-gray-500">هنوز پیامی ثبت نشده است.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <CreditCard size={18} />
              <h2 className="font-bold">مالی</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>جمع</span><span>{formatPrice(order.totalAmount)}</span></div>
              <div className="flex justify-between"><span>تخفیف</span><span>{formatPrice(order.discountAmount)}</span></div>
              <div className="flex justify-between"><span>ارسال</span><span>{formatPrice(order.shippingCost)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-100"><span>قابل پرداخت</span><span>{formatPrice(order.payableAmount)}</span></div>
              {order.discountCode ? (
                <div className="pt-2 text-xs text-gray-500">کد تخفیف: {order.discountCode}</div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <Truck size={18} />
              <h2 className="font-bold">روش ارسال</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>عنوان</span>
                <span>{order.shippingMethodTitle || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>هزینه</span>
                <span>
                  {typeof order.shippingMethodPrice === 'number'
                    ? `${order.shippingMethodPrice.toLocaleString('fa-IR')} تومان`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <MapPin size={18} />
              <h2 className="font-bold">آدرس ارسال</h2>
            </div>
            <p className="text-sm text-gray-600 leading-7">
              {addressText || '—'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#2A2A2A] mb-4">تراکنش‌ها</h2>
            {order.payments.length === 0 ? (
              <p className="text-sm text-gray-500">تراکنشی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div key={p.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span className="font-medium">{p.provider}</span>
                      <span className="font-mono dir-ltr">{p.status}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{formatDateTime(p.createdAt)}</span>
                      <span>{formatPrice(p.amount)}</span>
                    </div>
                    {(p.authority || p.refId) ? (
                      <div className="mt-2 text-xs text-gray-500 font-mono dir-ltr break-all">
                        {p.authority ? `Authority: ${p.authority}` : null}
                        {p.authority && p.refId ? ' | ' : null}
                        {p.refId ? `RefId: ${p.refId}` : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
