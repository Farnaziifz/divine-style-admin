import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
  className?: string;
  selectedClassName?: string;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value?: string | number;
  onChange: (e: { target: { value: string | number } }) => void;
  error?: string;
  fullWidth?: boolean;
  className?: string;
  placeholder?: string;
}

export const Select = ({
  label,
  options,
  value,
  onChange,
  error,
  fullWidth = true,
  className = '',
  placeholder = 'انتخاب کنید',
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div
      className={`${fullWidth ? 'w-full' : ''} ${className} relative`}
      ref={containerRef}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className={`
          w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all cursor-pointer flex items-center justify-between
          ${
            error
              ? 'border-red-500'
              : isOpen
              ? 'border-[#6B5B54] ring-1 ring-[#6B5B54]'
              : 'border-gray-200 hover:border-gray-300'
          }
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`${selectedOption ? `text-gray-900 ${selectedOption.className || ''}` : 'text-gray-400'}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            <div className="p-1">
              {options.map((opt) => (
                (() => {
                  const isSelected = value === opt.value;
                  const base =
                    'px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors';
                  const selected =
                    opt.selectedClassName || 'bg-[#6B5B54]/5 text-[#6B5B54] font-medium';
                  const notSelected = `text-gray-700 hover:bg-gray-50 ${opt.className || ''}`;
                  const className = `${base} ${isSelected ? selected : notSelected}`;

                  return (
                <div
                  key={opt.value}
                  className={className}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check size={16} />}
                </div>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              موردی یافت نشد
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
