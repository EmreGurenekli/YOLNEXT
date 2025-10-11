import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'shipment' | 'carrier' | 'offer' | 'message' | 'page';
  href: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mock search results - gerçek uygulamada API'den gelecek
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'CORP-2024-001',
      description: 'İstanbul → Ankara - Gıda Ürünleri',
      type: 'shipment',
      href: '/corporate/shipments',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: '2',
      title: 'Hızlı Lojistik A.Ş.',
      description: 'Nakliyeci - 4.8/5 ⭐',
      type: 'carrier',
      href: '/corporate/carriers',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: '3',
      title: 'OFF-001',
      description: 'Teklif - ₺45,000',
      type: 'offer',
      href: '/corporate/offers',
      icon: <TrendingUp className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    if (searchTerm.length > 2) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filteredResults = mockResults.filter(result =>
          result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResults(filteredResults);
        setIsLoading(false);
      }, 300);
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          // React Router ile navigasyon
          const href = results[selectedIndex].href;
          if (href.startsWith('/')) {
            window.location.href = href; // Internal navigation için geçici çözüm
          } else {
            window.open(href, '_blank');
          }
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleResultClick = (result: SearchResult) => {
    // React Router ile navigasyon
    if (result.href.startsWith('/')) {
      window.location.href = result.href; // Internal navigation için geçici çözüm
    } else {
      window.open(result.href, '_blank');
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      shipment: 'Gönderi',
      carrier: 'Nakliyeci',
      offer: 'Teklif',
      message: 'Mesaj',
      page: 'Sayfa'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      shipment: 'text-blue-600 bg-blue-50',
      carrier: 'text-green-600 bg-green-50',
      offer: 'text-purple-600 bg-purple-50',
      message: 'text-orange-600 bg-orange-50',
      page: 'text-slate-600 bg-slate-50'
    };
    return colors[type as keyof typeof colors] || 'text-slate-600 bg-slate-50';
  };

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500">
              <Clock className="w-4 h-4 animate-spin mx-auto mb-2" />
              Aranıyor...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                    index === selectedIndex ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                      {getTypeLabel(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {result.title}
                      </div>
                      <div className="text-sm text-slate-500 truncate">
                        {result.description}
                      </div>
                    </div>
                    {result.icon && (
                      <div className="text-slate-400">
                        {result.icon}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length > 2 ? (
            <div className="p-4 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Sonuç bulunamadı</p>
              <p className="text-sm">"{searchTerm}" için arama yapıldı</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

