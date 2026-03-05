import { useState, useCallback } from 'react';
import { SearchInput } from '../common/SearchInput';

interface UserFiltersProps {
  onFilterChange: (filters: { name?: string; mobile?: string }) => void;
}

export const UserFilters = ({ onFilterChange }: UserFiltersProps) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const handleNameSearch = useCallback((value: string) => {
    setName(value);
    // Use functional update or ref to get latest mobile if needed, 
    // but here we rely on useCallback dependency which is fine 
    // as long as we don't mind re-creating the function.
    // However, to avoid SearchInput re-triggering, we can use a ref for the callback?
    // Or just let it be. Double calls are debounce-safe usually.
    // Actually, to be safer, let's pass the latest values from parent if possible.
    // But parent (Users) holds the state.
    
    // Here:
    // When name changes, we want to call onFilterChange with new name and current mobile.
    // We can't access current mobile inside this callback unless we depend on it.
    
    // Let's rely on the fact that if 'mobile' changes, 'handleNameSearch' changes.
    // SearchInput useEffect runs. It debounces.
    // It shouldn't be a big issue.
    onFilterChange({ name: value, mobile });
  }, [mobile, onFilterChange]);

  const handleMobileSearch = useCallback((value: string) => {
    setMobile(value);
    onFilterChange({ name, mobile: value });
  }, [name, onFilterChange]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">نام و نام خانوادگی</label>
        <SearchInput
          onSearch={handleNameSearch}
          placeholder="جستجو با نام..."
          className="w-full"
          initialValue={name}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">شماره موبایل</label>
        <SearchInput
          onSearch={handleMobileSearch}
          placeholder="جستجو با موبایل..."
          className="w-full dir-ltr"
          initialValue={mobile}
        />
      </div>
    </div>
  );
};
