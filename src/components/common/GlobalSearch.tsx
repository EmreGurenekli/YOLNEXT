import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface GlobalSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = 'Ara...',
  onSearch,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
        <input
          type='text'
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            isFocused
              ? 'border-blue-500 shadow-md'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        />
        {query && (
          <button
            onClick={handleClear}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
