import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import {
  userService,
  type UserProfile,
} from '../../services/user.service';

const DEBOUNCE_MS = 350;
const MIN_DIGITS = 2;

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const EN_DIGITS = '0123456789';

function normalizeDigits(s: string): string {
  let out = '';
  for (const ch of s) {
    const i = FA_DIGITS.indexOf(ch);
    out += i >= 0 ? EN_DIGITS[i]! : ch;
  }
  return out.replace(/[^\d+]/g, '');
}

export interface SearchableUserMultiSelectProps {
  label?: string;
  value: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** دراپ‌داون چندانتخابی با جستجوی شماره موبایل (کاربران غیر ادمین از API) */
export function SearchableUserMultiSelect({
  label = 'کاربران',
  value,
  onChange,
  placeholder = 'جستجو با شماره موبایل…',
  disabled,
}: SearchableUserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserProfile[]>([]);
  const [profileById, setProfileById] = useState<Record<string, UserProfile>>(
    {},
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(normalizeDigits(query.trim())),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [query]);

  const fetchUsers = useCallback(async (mobile: string) => {
    if (mobile.length < MIN_DIGITS) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await userService.getUsers(1, 80, {
        mobile,
        excludeAdmin: true,
      });
      setResults(res.data);
      setProfileById((prev) => {
        const next = { ...prev };
        for (const u of res.data) {
          next[u.id] = u;
        }
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
    void fetchUsers(debouncedQuery);
  }, [debouncedQuery, open, fetchUsers]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selectedProfiles = useMemo(() => {
    return value.map((id) => profileById[id]).filter(Boolean) as UserProfile[];
  }, [value, profileById]);

  const toggleUser = (u: UserProfile) => {
    if (value.includes(u.id)) {
      onChange(value.filter((id) => id !== u.id));
    } else {
      onChange([...value, u.id]);
    }
  };

  const removeUser = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  return (
    <div className="w-full space-y-2" ref={containerRef}>
      {label && (
        <span className="block text-sm font-bold text-gray-700">{label}</span>
      )}

      {selectedProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProfiles.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 text-sm border border-teal-100"
            >
              <span className="dir-ltr font-medium">{u.mobile}</span>
              {u.name || u.lastName ? (
                <span className="text-teal-700/90 text-xs">
                  {[u.name, u.lastName].filter(Boolean).join(' ')}
                </span>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeUser(u.id)}
                className="p-0.5 rounded hover:bg-teal-100 text-teal-800"
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
            {value.length > 0
              ? `${value.length} کاربر انتخاب شده — برای افزودن جستجو کنید`
              : 'برای جستجو باز کنید و شماره موبایل را وارد کنید'}
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
                inputMode="numeric"
                autoComplete="off"
                value={query}
                onChange={(e) =>
                  setQuery(normalizeDigits(e.target.value))
                }
                placeholder={placeholder}
                className="flex-1 min-w-0 py-2 px-1 text-sm outline-none dir-ltr text-left placeholder:text-gray-400"
              />
            </div>
            <p className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50">
              حداقل {MIN_DIGITS} رقم برای جستجو؛ فقط کاربران غیر ادمین نمایش داده می‌شوند.
            </p>
            <div className="max-h-56 overflow-y-auto p-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-zafting-accent" size={28} />
                </div>
              ) : debouncedQuery.length < MIN_DIGITS ? (
                <div className="py-6 text-center text-gray-400 text-sm">
                  برای مشاهده نتیجه، شماره موبایل را وارد کنید
                </div>
              ) : results.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">
                  کاربری یافت نشد
                </div>
              ) : (
                results.map((u) => {
                  const checked = value.includes(u.id);
                  const title = [u.name, u.lastName].filter(Boolean).join(' ');
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u)}
                      className={`w-full text-right px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                        checked
                          ? 'bg-zafting-accent/15 text-zafting-accent font-medium'
                          : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className="flex flex-col items-end min-w-0">
                        <span className="dir-ltr font-medium">{u.mobile}</span>
                        {title ? (
                          <span className="text-xs text-gray-500 truncate max-w-full">
                            {title}
                          </span>
                        ) : null}
                      </span>
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
