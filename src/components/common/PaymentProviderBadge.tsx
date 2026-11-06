const STYLES: Record<string, { label: string; className: string }> = {
  SNAPPPAY: {
    label: 'اسنپ‌پی (قسطی)',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  ZARINPAL: {
    label: 'زرین‌پال',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  ZIBAL: {
    label: 'زیبال',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

export const PaymentProviderBadge = ({ provider }: { provider?: string | null }) => {
  if (!provider) return <span className="text-gray-400">—</span>;
  const style = STYLES[provider] ?? {
    label: provider,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  );
};
