import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export const SearchInput = ({
  onSearch,
  placeholder = 'جستجو...',
  className = '',
  initialValue = '',
}: SearchInputProps) => {
  const [value, setValue] = useState(initialValue);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSearch(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-10 pl-10 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => { setValue(''); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
