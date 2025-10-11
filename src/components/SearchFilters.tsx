import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, Weight, DollarSign, Truck, Star } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
  onFilter: (filters: any) => void;
  searchType: 'shipments' | 'carriers' | 'drivers';
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onFilter, searchType }) => {
  const [filters, setFilters] = useState({
    query: '',
    city: '',
    dateRange: '',
    weight: '',
    price: '',
    rating: '',
    vehicleType: '',
    status: ''
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      city: '',
      dateRange: '',
      weight: '',
      price: '',
      rating: '',
      vehicleType: '',
      status: ''
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Ana Arama */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={
                searchType === 'shipments' ? 'Gönderi ara...' :
                searchType === 'carriers' ? 'Nakliyeci ara...' :
                'Şoför ara...'
              }
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Şehir Filtresi */}
        <div className="lg:w-48">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Tüm Şehirler</option>
              <option value="istanbul">İstanbul</option>
              <option value="ankara">Ankara</option>
              <option value="izmir">İzmir</option>
              <option value="bursa">Bursa</option>
              <option value="antalya">Antalya</option>
              <option value="adana">Adana</option>
              <option value="konya">Konya</option>
              <option value="gaziantep">Gaziantep</option>
            </select>
          </div>
        </div>

        {/* Arama Butonu */}
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Ara
        </button>
      </div>

      {/* Gelişmiş Filtreler */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Tarih Aralığı */}
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Tüm Tarihler</option>
                <option value="today">Bugün</option>
                <option value="tomorrow">Yarın</option>
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
              </select>
            </div>
          </div>

          {/* Ağırlık */}
          {searchType === 'shipments' && (
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.weight}
                  onChange={(e) => handleFilterChange('weight', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Tüm Ağırlıklar</option>
                  <option value="0-10">0-10 kg</option>
                  <option value="10-50">10-50 kg</option>
                  <option value="50-100">50-100 kg</option>
                  <option value="100-500">100-500 kg</option>
                  <option value="500+">500+ kg</option>
                </select>
              </div>
            </div>
          )}

          {/* Fiyat */}
          <div className="flex-1 min-w-48">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Tüm Fiyatlar</option>
                <option value="0-100">0-100 TL</option>
                <option value="100-500">100-500 TL</option>
                <option value="500-1000">500-1000 TL</option>
                <option value="1000-5000">1000-5000 TL</option>
                <option value="5000+">5000+ TL</option>
              </select>
            </div>
          </div>

          {/* Değerlendirme */}
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Tüm Değerlendirmeler</option>
                <option value="5">5 Yıldız</option>
                <option value="4">4+ Yıldız</option>
                <option value="3">3+ Yıldız</option>
                <option value="2">2+ Yıldız</option>
              </select>
            </div>
          </div>

          {/* Araç Tipi */}
          {(searchType === 'carriers' || searchType === 'drivers') && (
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.vehicleType}
                  onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Tüm Araç Tipleri</option>
                  <option value="kamyon">Kamyon</option>
                  <option value="tir">Tır</option>
                  <option value="kamyonet">Kamyonet</option>
                  <option value="van">Van</option>
                </select>
              </div>
            </div>
          )}

          {/* Durum */}
          {searchType === 'shipments' && (
            <div className="flex-1 min-w-48">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tüm Durumlar</option>
                <option value="pending">Bekleyen</option>
                <option value="quoted">Teklif Alınan</option>
                <option value="accepted">Kabul Edilen</option>
                <option value="in_transit">Yolda</option>
                <option value="delivered">Teslim Edilen</option>
              </select>
            </div>
          )}

          {/* Filtreleri Temizle */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Temizle
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;

