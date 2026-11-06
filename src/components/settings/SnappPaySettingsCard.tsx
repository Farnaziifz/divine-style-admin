import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Copy, Loader2, XCircle } from 'lucide-react';
import {
  snappPayService,
  type SnappPayAdminSettings,
  type SnappPayMethodType,
} from '../../services/snappPay.service';

const METHOD_LABELS: Record<SnappPayMethodType, string> = {
  INSTALLMENT: 'اقساطی (INSTALLMENT)',
  POSTPAID: 'پرداخت آخر ماه (POSTPAID)',
  FINANCING: 'تأمین مالی (FINANCING)',
};

const CREDENTIAL_LABELS: Record<string, string> = {
  SNAPPPAY_BASE_URL: 'آدرس سرویس (Base URL)',
  SNAPPPAY_CLIENT_ID: 'Client ID',
  SNAPPPAY_CLIENT_SECRET: 'Client Secret',
  SNAPPPAY_USERNAME: 'نام‌کاربری',
  SNAPPPAY_PASSWORD: 'رمز عبور',
};

const errMessage = (e: unknown, fallback: string) => {
  const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof msg === 'string' ? msg : fallback;
};

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <span className="flex-1 text-xs font-mono dir-ltr text-left break-all text-gray-700">
          {value}
        </span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="text-gray-500 hover:text-gray-800"
          title="کپی"
        >
          {copied ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
};

export const SnappPaySettingsCard = () => {
  const [data, setData] = useState<SnappPayAdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [methods, setMethods] = useState<SnappPayMethodType[]>([]);
  const [commissionType, setCommissionType] = useState('100');

  const [serverIp, setServerIp] = useState<string | null | undefined>(undefined);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [testAmount, setTestAmount] = useState('1000000');
  const [eligibility, setEligibility] = useState<{
    ok: boolean;
    eligible?: boolean;
    title_message?: string;
    description?: string;
    message?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await snappPayService.getSettings();
      setData(res);
      setEnabled(res.settings.enabled);
      setMethods(res.settings.forcedPaymentMethodTypes);
      setCommissionType(String(res.settings.commissionType));
    } catch (e) {
      setError(errMessage(e, 'خطا در دریافت تنظیمات اسنپ‌پی'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    snappPayService
      .getServerIp()
      .then((r) => setServerIp(r.ip))
      .catch(() => setServerIp(null));
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const commission = Number(commissionType);
      if (!Number.isInteger(commission) || commission < 1) {
        setError('کد دسته‌بندی کمیسیون باید عدد صحیح مثبت باشد');
        return;
      }
      await snappPayService.updateSettings({
        enabled,
        forcedPaymentMethodTypes: methods,
        commissionType: commission,
      });
      setSaved(true);
      await load();
    } catch (e) {
      setError(errMessage(e, 'خطا در ذخیره تنظیمات اسنپ‌پی'));
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await snappPayService.testConnection();
      setTestResult(
        r.ok
          ? {
              ok: true,
              text: r.mock
                ? 'حالت تست (mock) فعال است؛ اتصال واقعی بررسی نشد'
                : 'اتصال موفق بود؛ توکن دریافت شد',
            }
          : { ok: false, text: r.message ?? 'اتصال ناموفق بود' },
      );
    } catch (e) {
      setTestResult({ ok: false, text: errMessage(e, 'اتصال ناموفق بود') });
    } finally {
      setTesting(false);
    }
  };

  const runEligibility = async () => {
    const amount = Number(testAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setChecking(true);
    setEligibility(null);
    try {
      setEligibility(await snappPayService.eligibilityTest(amount));
    } catch (e) {
      setEligibility({ ok: false, message: errMessage(e, 'خطا در استعلام') });
    } finally {
      setChecking(false);
    }
  };

  const status = data?.status;
  const allCredentials = status ? Object.values(status.credentials).every(Boolean) : false;

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/70 p-5 shadow-sm">
      <h3 className="font-bold text-[#2A2A2A]">پرداخت اقساطی اسنپ‌پی</h3>
      <p className="text-sm text-gray-600 mt-2 leading-7">
        خرید اقساطی / پرداخت آخر ماه از طریق اسنپ‌پی. مبلغ اقساط و متن نمایش‌داده‌شده به مشتری
        همیشه از خود اسنپ‌پی گرفته می‌شود و در سایت ثابت نیست.
      </p>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      {loading || !data || !status ? (
        <div className="mt-6 flex items-center text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          <span className="ms-2 text-sm">در حال دریافت...</span>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {status.mode === 'mock' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              سرور در حالت <b>mock</b> است (PAYMENT_MODE=mock): پرداخت‌ها بدون تماس با اسنپ‌پی
              موفق ثبت می‌شوند. برای پرداخت واقعی مقدار PAYMENT_MODE را روی real بگذارید.
            </div>
          ) : status.isStaging ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              آدرس سرویس روی محیط <b>تست (staging)</b> اسنپ‌پی است. پس از تأیید دمو، اسنپ‌پی آدرس
              و اطلاعات محیط اصلی (production) را می‌فرستد و باید در تنظیمات سرور جایگزین شود.
            </div>
          ) : null}

          {/* Enable + options */}
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={enabled}
                disabled={saving}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-800">
                نمایش گزینهٔ اسنپ‌پی در صفحهٔ پرداخت
              </span>
            </label>

            <div>
              <div className="text-sm font-medium text-gray-800">
                محدودکردن روش‌های پرداخت (اختیاری)
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-6">
                اگر هیچ‌کدام انتخاب نشود، مشتری همهٔ روش‌های فعال خودش را در صفحهٔ اسنپ‌پی می‌بیند.
                انتخاب روش‌ها نیازمند فعال‌سازی از سمت تیم اسنپ‌پی است؛ در غیر این صورت اثری
                نخواهد داشت.
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                {(Object.keys(METHOD_LABELS) as SnappPayMethodType[]).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={methods.includes(m)}
                      disabled={saving}
                      onChange={(e) =>
                        setMethods((prev) =>
                          e.target.checked ? [...prev, m] : prev.filter((x) => x !== m),
                        )
                      }
                    />
                    {METHOD_LABELS[m]}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="snapp-commission">
                کد دستهٔ کمیسیون (commissionType)
              </label>
              <p className="text-xs text-gray-500 mt-1 leading-6">
                اگر در قرارداد با اسنپ‌پی دسته‌بندی‌های مختلف کمیسیون دارید، کد مربوطه را بگذارید؛
                در غیر این صورت همان ۱۰۰ بماند. مسئولیت تطابق با قرارداد با شماست.
              </p>
              <input
                id="snapp-commission"
                type="number"
                min={1}
                value={commissionType}
                disabled={saving}
                onChange={(e) => setCommissionType(e.target.value)}
                className="mt-2 w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm dir-ltr"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zafting-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                ذخیره
              </button>
              {saved ? <span className="text-sm text-green-600">ذخیره شد</span> : null}
            </div>
          </div>

          {/* Connection info */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="font-medium text-sm text-gray-800">
              اطلاعات اتصال (روی سرور تنظیم می‌شود)
            </div>
            <p className="text-xs text-gray-500 leading-6">
              به‌خاطر امنیت، رمزها داخل پنل ذخیره یا نمایش داده نمی‌شوند و در فایل
              تنظیمات سرور (.env) قرار می‌گیرند. اینجا فقط می‌بینید کدام‌ها تنظیم شده‌اند.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(status.credentials).map(([key, ok]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{CREDENTIAL_LABELS[key] ?? key}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      ok ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span className="font-mono dir-ltr">{key}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={runTest}
                disabled={testing || (!allCredentials && status.mode === 'real')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {testing ? <Loader2 className="animate-spin" size={16} /> : null}
                تست اتصال به اسنپ‌پی
              </button>
              {testResult ? (
                <span
                  className={`inline-flex items-center gap-1 text-sm ${
                    testResult.ok ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {testResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {testResult.text}
                </span>
              ) : null}
            </div>
          </div>

          {/* Things to hand to Snapp Pay */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="font-medium text-sm text-gray-800">اطلاعاتی که باید به اسنپ‌پی بدهید</div>
            <CopyField label="آدرس بازگشت (returnURL) — باید دامنه‌اش در اسنپ‌پی ثبت شود" value={status.callbackUrl} />
            {serverIp === undefined ? (
              <div className="text-xs text-gray-500">در حال تشخیص IP سرور...</div>
            ) : serverIp ? (
              <CopyField label="IP خروجی سرور — برای وایت‌لیست شدن در اسنپ‌پی" value={serverIp} />
            ) : (
              <p className="text-xs text-amber-700 leading-6">
                IP سرور به‌صورت خودکار تشخیص داده نشد. IP عمومی سرور بک‌اند (ترجیحاً IP ایران) را
                دستی به اسنپ‌پی بدهید. اگر «Access Denied» می‌گیرید یعنی IP وایت‌لیست نشده است.
              </p>
            )}
            <p className="text-xs text-gray-500 leading-6">
              ترتیب راه‌اندازی: ۱) این دو مقدار را به اسنپ‌پی بدهید ۲) Client ID/Secret و یوزر/پسورد
              را در .env سرور بگذارید ۳) تست اتصال ۴) فعال‌سازی بالا و تست خرید در محیط staging
              ۵) پس از جلسهٔ دمو، اطلاعات production را جایگزین کنید.
            </p>
          </div>

          {/* Eligibility tester */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="font-medium text-sm text-gray-800">بررسی امکان پرداخت اقساطی برای یک مبلغ</div>
            <p className="text-xs text-gray-500 leading-6">
              مثلاً محدودهٔ مبلغ قابل قبول (در staging: ۴ هزار تا ۱۰ میلیون تومان) را با پاسخ واقعی
              اسنپ‌پی ببینید.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                min={1}
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-44 rounded-lg border border-gray-200 px-3 py-2 text-sm dir-ltr"
              />
              <span className="text-sm text-gray-500">تومان</span>
              <button
                type="button"
                onClick={runEligibility}
                disabled={checking}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {checking ? <Loader2 className="animate-spin" size={16} /> : null}
                استعلام
              </button>
            </div>
            {eligibility ? (
              <div className="text-sm">
                {eligibility.ok ? (
                  <div className={eligibility.eligible ? 'text-green-700' : 'text-red-600'}>
                    {eligibility.eligible ? 'قابل پرداخت اقساطی ✓' : 'برای این مبلغ در دسترس نیست'}
                    {eligibility.title_message ? (
                      <div className="mt-1 text-gray-700">{eligibility.title_message}</div>
                    ) : null}
                    {eligibility.description ? (
                      <div className="text-gray-500 text-xs mt-1">{eligibility.description}</div>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-red-600">{eligibility.message ?? 'خطا در استعلام'}</span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
