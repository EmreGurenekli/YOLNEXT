import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'shipment' | 'offer' | 'job' | 'user' | 'page';
  url: string;
  icon?: React.ReactNode;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  placeholder = "Ara...", 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Gönderi #SH-2024-001',
      description: 'İstanbul → Ankara, 15 kg, Elektronik',
      type: 'shipment',
      url: '/individual/my-shipments'
    },
    {
      id: '2',
      title: 'Teklif #OFF-2024-002',
      description: '₺1,200, 2 gün, Kamyon',
      type: 'offer',
      url: '/individual/offers'
    },
    {
      id: '3',
      title: 'İş İlanı #JOB-2024-003',
      description: 'Ev eşyası taşıma, Bursa → İzmir',
      type: 'job',
      url: '/nakliyeci/jobs'
    },
    {
      id: '4',
      title: 'Ahmet Yılmaz',
      description: 'Nakliyeci, 4.8 ⭐',
      type: 'user',
      url: '/individual/carriers'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filteredResults = mockResults.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filteredResults);
        setIsLoading(false);
      }, 300);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setRecentSearches(prev => {
        const newSearches = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(newSearches));
        return newSearches;
      });
        setIsOpen(false);
      setQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'offer':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'job':
        return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      case 'user':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'shipment': return 'Gönderi';
      case 'offer': return 'Teklif';
      case 'job': return 'İş İlanı';
      case 'user': return 'Kullanıcı';
      default: return 'Sayfa';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {query.length > 2 ? (
            <>
      {/* Search Results */}
          {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Aranıyor...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sonuçlar
                  </div>
                  {results.map((result) => (
                <button
                  key={result.id}
                      onClick={() => handleSearch(result.title)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1 mr-3">
                          {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {getTypeLabel(result.type)}
                            </span>
                      </div>
                          <p className="text-sm text-gray-500 truncate">
                        {result.description}
                          </p>
                      </div>
                    </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Sonuç bulunamadı</p>
                      </div>
                    )}
            </>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Son Aramalar
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      {search}
                </button>
              ))}
            </div>
              )}

              {/* Quick Actions */}
              <div className="py-2 border-t border-gray-100">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Hızlı Erişim
                </div>
                <button
                  onClick={() => handleSearch('gönderilerim')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  Gönderilerim
                </button>
                <button
                  onClick={() => handleSearch('teklifler')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  Teklifler
                </button>
                <button
                  onClick={() => handleSearch('iş ilanları')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  İş İlanları
                </button>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
















