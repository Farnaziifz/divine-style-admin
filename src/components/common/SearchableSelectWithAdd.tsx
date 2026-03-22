import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Plus, Loader2 } from 'lucide-react';

export interface SearchableOption {
  id: string;
  title: string;
}

interface SearchableSelectWithAddProps {
  label?: string;
  options: SearchableOption[];
  value: string;
  onChange: (id: string) => void;
  onSearchChange: (search: string) => void;
  onAddClick: () => void;
  placeholder?: string;
  loading?: boolean;
  addButtonLabel?: string;
}

const DEBOUNCE_MS = 300;

export function SearchableSelectWithAdd({
  label,
  options,
  value,
  onChange,
  onSearchChange,
  onAddClick,
  placeholder = 'انتخاب کنید',
  loading = false,
  addButtonLabel = 'افزودن',
}: SearchableSelectWithAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const t = setTimeout(() => {
      onSearchChange(searchInput);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, onSearchChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleAddClick = useCallback(() => {
    onAddClick();
    setIsOpen(false);
  }, [onAddClick]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        className="w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all cursor-pointer flex items-center justify-between border-gray-200 hover:border-gray-300"
        onClick={() => {
          setIsOpen((o) => {
            const next = !o;
            if (next) {
              setSearchInput('');
              onSearchChange('');
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            return next;
          });
        }}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.title : placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="جستجو..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-zafting-accent"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={24} className="animate-spin text-zafting-accent" />
              </div>
            ) : options.length > 0 ? (
              options.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                    value === opt.id
                      ? 'bg-zafting-accent/10 text-zafting-accent font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt.id);
                  }}
                >
                  <span>{opt.title}</span>
                  {value === opt.id && <Check size={16} />}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-gray-400 text-sm">
                موردی یافت نشد
              </div>
            )}
          </div>
          <div className="p-2 border-t border-gray-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-zafting-accent hover:text-zafting-accent transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              {addButtonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
