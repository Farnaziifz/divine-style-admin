import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import { productService, type Product } from '../../services/product.service';

const DEBOUNCE_MS = 350;

/** جستجوی محصول و انتخاب یک آیتم (تک‌انتخابی) — برای افزودن به سبد فروش دستی */
export function ProductSearchField({
  onSelect,
}: {
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchProducts = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const res = await productService.getAll({ search, limit: 30 });
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchProducts(debouncedQuery);
  }, [debouncedQuery, open, fetchProducts]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between gap-2 text-right hover:border-gray-300 transition-colors"
      >
        <span className="text-gray-400 text-sm truncate">جستجو و انتخاب محصول…</span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[1000] top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="نام محصول…"
              className="flex-1 min-w-0 py-2 px-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-zafting-accent" size={28} />
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">موردی یافت نشد</div>
            ) : (
              results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors hover:bg-gray-50 text-gray-800"
                >
                  <span className="truncate">{p.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
