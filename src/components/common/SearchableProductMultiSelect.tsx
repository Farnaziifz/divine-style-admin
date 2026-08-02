import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import { productService, type Product } from '../../services/product.service';

const DEBOUNCE_MS = 350;

export interface SearchableProductMultiSelectProps {
  label?: string;
  value: string[];
  onChange: (productIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** دراپ‌داون چندانتخابی با جستجوی محصول */
export function SearchableProductMultiSelect({
  label = 'محصولات',
  value,
  onChange,
  placeholder = 'جستجوی نام محصول…',
  disabled,
}: SearchableProductMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [productById, setProductById] = useState<Record<string, Product>>({});
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
      setProductById((prev) => {
        const next = { ...prev };
        for (const p of res.data) next[p.id] = p;
        return next;
      });
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

  const selectedProducts = useMemo(() => {
    return value.map((id) => productById[id]).filter(Boolean) as Product[];
  }, [value, productById]);

  const toggleProduct = (p: Product) => {
    if (value.includes(p.id)) {
      onChange(value.filter((id) => id !== p.id));
    } else {
      onChange([...value, p.id]);
    }
  };

  const removeProduct = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  return (
    <div className="w-full space-y-2" ref={containerRef}>
      {label && <span className="block text-sm font-bold text-gray-700">{label}</span>}

      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zafting-accent/10 text-zafting-accent text-sm border border-zafting-accent/20"
            >
              <span className="font-medium">{p.title}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeProduct(p.id)}
                className="p-0.5 rounded hover:bg-zafting-accent/20"
                aria-label="حذف"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((o) => !o);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between gap-2 text-right hover:border-gray-300 transition-colors disabled:opacity-60"
        >
          <span className="text-gray-400 text-sm truncate">
            {value.length > 0 ? `${value.length} محصول انتخاب شده` : placeholder}
          </span>
          <ChevronDown
            size={20}
            className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute z-[10001] top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
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
                results.map((p) => {
                  const checked = value.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p)}
                      className={`w-full text-right px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                        checked
                          ? 'bg-zafting-accent/15 text-zafting-accent font-medium'
                          : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span
                        className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                          checked
                            ? 'bg-zafting-accent border-zafting-accent text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {checked ? '✓' : ''}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
