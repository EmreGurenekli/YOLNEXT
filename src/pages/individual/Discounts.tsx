import React, { useState, useEffect } from 'react';
import { Percent, Star, Clock, CheckCircle, XCircle, Gift, Tag, Award, Crown, Zap, Shield, Truck, Package, DollarSign, Calendar, MapPin, Weight, User, Phone, MessageSquare, Download, Share2, Eye, EyeOff, Filter, SortAsc, SortDesc, Search, RefreshCw, Info, AlertCircle, ExternalLink, Plus, Minus, Copy, Bookmark, BookmarkCheck } from 'lucide-react';
import { realApiService } from '../../services/realApi';
import { useNavigate } from 'react-router-dom';

interface Discount {
  id: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'loyalty' | 'referral' | 'seasonal' | 'first_time' | 'bulk';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  isUsed: boolean;
  usageCount: number;
  maxUsageCount?: number;
  applicableRoutes?: string[];
  applicableCargoTypes?: string[];
  applicableCarriers?: string[];
  conditions: string[];
  benefits: string[];
  code?: string;
  image?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'shipment' | 'payment' | 'loyalty' | 'promotion' | 'referral' | 'seasonal';
  source: 'system' | 'carrier' | 'promotion' | 'loyalty';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface DiscountFilter {
  type: 'all' | 'active' | 'expired' | 'used' | 'available' | 'percentage' | 'fixed' | 'free_shipping' | 'loyalty' | 'referral' | 'seasonal' | 'first_time' | 'bulk';
  category: 'all' | 'general' | 'shipment' | 'payment' | 'loyalty' | 'promotion' | 'referral' | 'seasonal';
  searchTerm: string;
  minValue: number;
  maxValue: number;
  validFrom: string;
  validUntil: string;
}

interface DiscountStats {
  totalDiscounts: number;
  activeDiscounts: number;
  usedDiscounts: number;
  totalSavings: number;
  thisMonthSavings: number;
  favoriteDiscountType: string;
  mostUsedDiscount: string;
  averageDiscountValue: number;
}

const mockDiscounts: Discount[] = [
  {
    id: 'DISC001',
    title: 'İlk Gönderi İndirimi',
    description: 'İlk gönderinizde %20 indirim fırsatı!',
    type: 'percentage',
    value: 20,
    minOrderAmount: 100,
    maxDiscountAmount: 500,
    validFrom: '2024-07-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 1,
    applicableCargoTypes: ['ev_esyasi', 'kisisel', 'ciftci', 'is_yeri', 'ozel'],
    conditions: ['İlk gönderi olmalı', 'Minimum sipariş tutarı ₺100', 'Tek kullanımlık'],
    benefits: ['%20 indirim', 'Ücretsiz takip', 'Öncelikli hizmet'],
    code: 'FIRST20',
    priority: 'high',
    category: 'first_time',
    source: 'system',
    tags: ['ilk', 'indirim', 'yeni'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'DISC002',
    title: 'Hızlı Kargo Özel İndirimi',
    description: 'Hızlı Kargo ile gönderilerinizde %15 indirim!',
    type: 'percentage',
    value: 15,
    minOrderAmount: 200,
    maxDiscountAmount: 300,
    validFrom: '2024-07-15T00:00:00Z',
    validUntil: '2024-08-15T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 3,
    applicableCarriers: ['CAR001'],
    conditions: ['Hızlı Kargo ile gönderi', 'Minimum sipariş tutarı ₺200', '3 kullanım hakkı'],
    benefits: ['%15 indirim', 'Hızlı teslimat', 'Güvenli taşıma'],
    code: 'HIZLI15',
    priority: 'normal',
    category: 'carrier',
    source: 'carrier',
    tags: ['hızlı', 'kargo', 'indirim'],
    createdAt: '2024-07-15T00:00:00Z',
    updatedAt: '2024-07-15T00:00:00Z'
  },
  {
    id: 'DISC003',
    title: 'Ücretsiz Kargo',
    description: '₺500 ve üzeri siparişlerde ücretsiz kargo!',
    type: 'free_shipping',
    value: 0,
    minOrderAmount: 500,
    validFrom: '2024-07-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    isUsed: true,
    usageCount: 1,
    maxUsageCount: 5,
    applicableCargoTypes: ['ev_esyasi', 'kisisel', 'is_yeri'],
    conditions: ['Minimum sipariş tutarı ₺500', '5 kullanım hakkı'],
    benefits: ['Ücretsiz kargo', 'Hızlı teslimat', 'Güvenli paketleme'],
    code: 'FREESHIP',
    priority: 'normal',
    category: 'general',
    source: 'system',
    tags: ['ücretsiz', 'kargo', 'genel'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-10T00:00:00Z'
  },
  {
    id: 'DISC004',
    title: 'Sadakat İndirimi',
    description: '10 gönderi sonrası %25 indirim!',
    type: 'loyalty',
    value: 25,
    minOrderAmount: 100,
    maxDiscountAmount: 1000,
    validFrom: '2024-07-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 1,
    conditions: ['10 gönderi tamamlanmış olmalı', 'Minimum sipariş tutarı ₺100'],
    benefits: ['%25 indirim', 'Öncelikli hizmet', 'Kişisel danışman'],
    code: 'LOYAL25',
    priority: 'high',
    category: 'loyalty',
    source: 'loyalty',
    tags: ['sadakat', 'indirim', 'özel'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'DISC005',
    title: 'Referans İndirimi',
    description: 'Arkadaşınızı davet edin, ikiniz de %10 indirim kazanın!',
    type: 'referral',
    value: 10,
    minOrderAmount: 50,
    maxDiscountAmount: 200,
    validFrom: '2024-07-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 10,
    conditions: ['Arkadaşınız kayıt olmalı', 'İlk gönderisini yapmalı', 'Minimum sipariş tutarı ₺50'],
    benefits: ['%10 indirim', 'Arkadaşınız da kazanır', 'Sınırsız kullanım'],
    code: 'REFER10',
    priority: 'normal',
    category: 'referral',
    source: 'system',
    tags: ['referans', 'arkadaş', 'indirim'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'DISC006',
    title: 'Yaz Sezonu İndirimi',
    description: 'Yaz sezonunda tüm gönderilerde %12 indirim!',
    type: 'seasonal',
    value: 12,
    minOrderAmount: 150,
    maxDiscountAmount: 400,
    validFrom: '2024-06-01T00:00:00Z',
    validUntil: '2024-09-30T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 20,
    applicableCargoTypes: ['ev_esyasi', 'kisisel', 'ciftci', 'is_yeri', 'ozel'],
    conditions: ['Yaz sezonu', 'Minimum sipariş tutarı ₺150', '20 kullanım hakkı'],
    benefits: ['%12 indirim', 'Yaz sezonu özel', 'Hızlı teslimat'],
    code: 'SUMMER12',
    priority: 'normal',
    category: 'seasonal',
    source: 'promotion',
    tags: ['yaz', 'sezon', 'indirim'],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    id: 'DISC007',
    title: 'Toplu Gönderi İndirimi',
    description: '5 ve üzeri gönderide %18 indirim!',
    type: 'bulk',
    value: 18,
    minOrderAmount: 1000,
    maxDiscountAmount: 800,
    validFrom: '2024-07-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 5,
    conditions: ['5 veya daha fazla gönderi', 'Minimum sipariş tutarı ₺1000', '5 kullanım hakkı'],
    benefits: ['%18 indirim', 'Toplu gönderi avantajı', 'Özel paketleme'],
    code: 'BULK18',
    priority: 'normal',
    category: 'general',
    source: 'system',
    tags: ['toplu', 'gönderi', 'indirim'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'DISC008',
    title: 'Sabit Tutar İndirimi',
    description: '₺100 sabit indirim fırsatı!',
    type: 'fixed',
    value: 100,
    minOrderAmount: 300,
    validFrom: '2024-07-20T00:00:00Z',
    validUntil: '2024-08-20T23:59:59Z',
    isActive: true,
    isUsed: false,
    usageCount: 0,
    maxUsageCount: 2,
    conditions: ['Minimum sipariş tutarı ₺300', '2 kullanım hakkı'],
    benefits: ['₺100 indirim', 'Hızlı teslimat', 'Güvenli taşıma'],
    code: 'FIXED100',
    priority: 'normal',
    category: 'general',
    source: 'system',
    tags: ['sabit', 'tutar', 'indirim'],
    createdAt: '2024-07-20T00:00:00Z',
    updatedAt: '2024-07-20T00:00:00Z'
  }
];

const mockStats: DiscountStats = {
  totalDiscounts: 8,
  activeDiscounts: 7,
  usedDiscounts: 1,
  totalSavings: 1250,
  thisMonthSavings: 350,
  favoriteDiscountType: 'percentage',
  mostUsedDiscount: 'Ücretsiz Kargo',
  averageDiscountValue: 15.5
};

const getTypeInfo = (type: Discount['type']) => {
  switch (type) {
    case 'percentage': return { icon: <Percent className="w-5 h-5" />, color: 'blue', text: 'Yüzde' };
    case 'fixed': return { icon: <DollarSign className="w-5 h-5" />, color: 'green', text: 'Sabit Tutar' };
    case 'free_shipping': return { icon: <Truck className="w-5 h-5" />, color: 'purple', text: 'Ücretsiz Kargo' };
    case 'loyalty': return { icon: <Crown className="w-5 h-5" />, color: 'yellow', text: 'Sadakat' };
    case 'referral': return { icon: <User className="w-5 h-5" />, color: 'orange', text: 'Referans' };
    case 'seasonal': return { icon: <Calendar className="w-5 h-5" />, color: 'red', text: 'Sezonluk' };
    case 'first_time': return { icon: <Star className="w-5 h-5" />, color: 'pink', text: 'İlk Gönderi' };
    case 'bulk': return { icon: <Package className="w-5 h-5" />, color: 'indigo', text: 'Toplu' };
    default: return { icon: <Tag className="w-5 h-5" />, color: 'gray', text: 'Diğer' };
  }
};

const getCategoryInfo = (category: Discount['category']) => {
  switch (category) {
    case 'general': return { text: 'Genel', color: 'blue' };
    case 'shipment': return { text: 'Gönderi', color: 'green' };
    case 'payment': return { text: 'Ödeme', color: 'purple' };
    case 'loyalty': return { text: 'Sadakat', color: 'yellow' };
    case 'promotion': return { text: 'Promosyon', color: 'orange' };
    case 'referral': return { text: 'Referans', color: 'pink' };
    case 'seasonal': return { text: 'Sezonluk', color: 'red' };
    default: return { text: 'Diğer', color: 'gray' };
  }
};

const getPriorityInfo = (priority: Discount['priority']) => {
  switch (priority) {
    case 'low': return { color: 'gray', text: 'Düşük' };
    case 'normal': return { color: 'blue', text: 'Normal' };
    case 'high': return { color: 'orange', text: 'Yüksek' };
    case 'urgent': return { color: 'red', text: 'Acil' };
    default: return { color: 'gray', text: 'Bilinmiyor' };
  }
};

const getSourceInfo = (source: Discount['source']) => {
  switch (source) {
    case 'system': return { text: 'Sistem', color: 'gray' };
    case 'carrier': return { text: 'Taşıyıcı', color: 'blue' };
    case 'promotion': return { text: 'Promosyon', color: 'orange' };
    case 'loyalty': return { text: 'Sadakat', color: 'yellow' };
    default: return { text: 'Bilinmiyor', color: 'gray' };
  }
};

const IndividualDiscounts: React.FC = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stats, setStats] = useState<DiscountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DiscountFilter>({
    type: 'all',
    category: 'all',
    searchTerm: '',
    minValue: 0,
    maxValue: 100,
    validFrom: '',
    validUntil: ''
  });
  const [sortBy, setSortBy] = useState<'value' | 'validUntil' | 'priority' | 'createdAt'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'expired' | 'used' | 'available'>('all');

  useEffect(() => {
    const fetchDiscounts = async () => {
      setLoading(true);
      try {
        // const response = await realApiService.getDiscounts();
        // if (response.success) {
        //   setDiscounts(response.data.discounts);
        //   setStats(response.data.stats);
        // } else {
        //   console.error('Failed to fetch discounts:', response.message);
        //   setDiscounts(mockDiscounts);
        //   setStats(mockStats);
        // }
        setDiscounts(mockDiscounts);
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching discounts:', error);
        setDiscounts(mockDiscounts);
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const filteredDiscounts = discounts.filter(discount => {
    const matchesType = filter.type === 'all' || discount.type === filter.type;
    const matchesCategory = filter.category === 'all' || discount.category === filter.category;
    const matchesSearch = filter.searchTerm === '' ||
      discount.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      discount.description.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      discount.code?.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      discount.tags.some(tag => tag.toLowerCase().includes(filter.searchTerm.toLowerCase()));

    const matchesValue = discount.value >= filter.minValue && discount.value <= filter.maxValue;

    let matchesDate = true;
    if (filter.validFrom) {
      const discountFrom = new Date(discount.validFrom);
      const filterFrom = new Date(filter.validFrom);
      if (discountFrom < filterFrom) matchesDate = false;
    }
    if (filter.validUntil) {
      const discountUntil = new Date(discount.validUntil);
      const filterUntil = new Date(filter.validUntil);
      if (discountUntil > filterUntil) matchesDate = false;
    }

    let matchesViewMode = true;
    if (viewMode === 'active') matchesViewMode = discount.isActive;
    if (viewMode === 'expired') matchesViewMode = new Date(discount.validUntil) < new Date();
    if (viewMode === 'used') matchesViewMode = discount.isUsed;
    if (viewMode === 'available') matchesViewMode = discount.isActive && !discount.isUsed && new Date(discount.validUntil) > new Date();

    return matchesType && matchesCategory && matchesSearch && matchesValue && matchesDate && matchesViewMode;
  });

  const sortedDiscounts = [...filteredDiscounts].sort((a, b) => {
    let compare = 0;
    if (sortBy === 'value') {
      compare = a.value - b.value;
    } else if (sortBy === 'validUntil') {
      compare = new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
      compare = priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'createdAt') {
      compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortOrder === 'asc' ? compare : -compare;
  });

  const handleUseDiscount = (discountId: string) => {
    console.log('Use discount:', discountId);
    // Implement discount usage logic
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Show success message
  };

  const handleSelectDiscount = (discountId: string) => {
    setSelectedDiscounts(prev => 
      prev.includes(discountId) 
        ? prev.filter(id => id !== discountId)
        : [...prev, discountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDiscounts.length === filteredDiscounts.length) {
      setSelectedDiscounts([]);
    } else {
      setSelectedDiscounts(filteredDiscounts.map(discount => discount.id));
    }
  };

  const handleShareDiscount = (discount: Discount) => {
    const url = `${window.location.origin}/discounts/${discount.id}`;
    navigator.clipboard.writeText(url);
    // Show success message
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">İndirimler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İndirimler</h1>
            <p className="text-sm text-gray-600 mt-1">Mevcut indirimlerinizi görüntüleyin ve kullanın</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md"
            >
              <Filter className="w-4 h-4 mr-2" /> Filtreler
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Yeni İndirim
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* İstatistikler */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">Toplam İndirim</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDiscounts}</div>
                </div>
                <Tag className="w-10 h-10 text-blue-400 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">Aktif İndirim</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">{stats.activeDiscounts}</div>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">Toplam Tasarruf</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">₺{stats.totalSavings.toLocaleString()}</div>
                </div>
                <DollarSign className="w-10 h-10 text-purple-400 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">Bu Ay Tasarruf</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">₺{stats.thisMonthSavings.toLocaleString()}</div>
                </div>
                <Calendar className="w-10 h-10 text-orange-400 opacity-75" />
              </div>
            </div>
          </div>
        )}

        {/* Filtreler */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="expired">Süresi Dolmuş</option>
                  <option value="used">Kullanılmış</option>
                  <option value="available">Kullanılabilir</option>
                  <option value="percentage">Yüzde</option>
                  <option value="fixed">Sabit Tutar</option>
                  <option value="free_shipping">Ücretsiz Kargo</option>
                  <option value="loyalty">Sadakat</option>
                  <option value="referral">Referans</option>
                  <option value="seasonal">Sezonluk</option>
                  <option value="first_time">İlk Gönderi</option>
                  <option value="bulk">Toplu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="general">Genel</option>
                  <option value="shipment">Gönderi</option>
                  <option value="payment">Ödeme</option>
                  <option value="loyalty">Sadakat</option>
                  <option value="promotion">Promosyon</option>
                  <option value="referral">Referans</option>
                  <option value="seasonal">Sezonluk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Değer Aralığı</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filter.minValue}
                    onChange={(e) => setFilter(prev => ({ ...prev, minValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filter.maxValue}
                    onChange={(e) => setFilter(prev => ({ ...prev, maxValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="value-desc">Değer (Yüksek)</option>
                  <option value="value-asc">Değer (Düşük)</option>
                  <option value="validUntil-asc">Son Kullanma (Yakın)</option>
                  <option value="validUntil-desc">Son Kullanma (Uzak)</option>
                  <option value="priority-desc">Öncelik (Yüksek)</option>
                  <option value="priority-asc">Öncelik (Düşük)</option>
                  <option value="createdAt-desc">Tarih (Yeni)</option>
                  <option value="createdAt-asc">Tarih (Eski)</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="İndirim ara..."
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* İndirim Listesi */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {/* Başlık ve Aksiyonlar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">İndirimler</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setViewMode('active')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => setViewMode('available')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'available' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Kullanılabilir
                  </button>
                  <button
                    onClick={() => setViewMode('used')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'used' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Kullanılmış
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                >
                  {selectedDiscounts.length === filteredDiscounts.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                </button>
                {selectedDiscounts.length > 0 && (
                  <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200">
                    Seçilenleri Paylaş
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* İndirim Kartları */}
          <div className="p-6">
            {sortedDiscounts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Tag className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <p className="text-xl font-medium">İndirim bulunamadı.</p>
                <p className="text-sm mt-2">Filtreleri ayarlayarak arama yapabilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedDiscounts.map((discount) => {
                  const typeInfo = getTypeInfo(discount.type);
                  const categoryInfo = getCategoryInfo(discount.category);
                  const priorityInfo = getPriorityInfo(discount.priority);
                  const sourceInfo = getSourceInfo(discount.source);
                  const isSelected = selectedDiscounts.includes(discount.id);
                  const isExpired = new Date(discount.validUntil) < new Date();
                  const isAvailable = discount.isActive && !discount.isUsed && !isExpired;

                  return (
                    <div
                      key={discount.id}
                      className={`relative border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                      } ${!discount.isActive ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            typeInfo.color === 'blue' ? 'bg-blue-100' :
                            typeInfo.color === 'green' ? 'bg-green-100' :
                            typeInfo.color === 'purple' ? 'bg-purple-100' :
                            typeInfo.color === 'yellow' ? 'bg-yellow-100' :
                            typeInfo.color === 'orange' ? 'bg-orange-100' :
                            typeInfo.color === 'red' ? 'bg-red-100' :
                            typeInfo.color === 'pink' ? 'bg-pink-100' :
                            typeInfo.color === 'indigo' ? 'bg-indigo-100' :
                            'bg-gray-100'
                          }`}>
                            <div className={`${
                              typeInfo.color === 'blue' ? 'text-blue-600' :
                              typeInfo.color === 'green' ? 'text-green-600' :
                              typeInfo.color === 'purple' ? 'text-purple-600' :
                              typeInfo.color === 'yellow' ? 'text-yellow-600' :
                              typeInfo.color === 'orange' ? 'text-orange-600' :
                              typeInfo.color === 'red' ? 'text-red-600' :
                              typeInfo.color === 'pink' ? 'text-pink-600' :
                              typeInfo.color === 'indigo' ? 'text-indigo-600' :
                              'text-gray-600'
                            }`}>
                              {typeInfo.icon}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{discount.title}</h3>
                            <p className="text-sm text-gray-600">{discount.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectDiscount(discount.id)}
                            className="mt-1"
                          />
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {discount.type === 'percentage' ? `%${discount.value}` :
                             discount.type === 'fixed' ? `₺${discount.value}` :
                             discount.type === 'free_shipping' ? 'Ücretsiz' :
                             `%${discount.value}`}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              priorityInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              priorityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              priorityInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {priorityInfo.text}
                            </span>
                            {discount.isImportant && (
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            categoryInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            categoryInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                            categoryInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            categoryInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            categoryInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            categoryInfo.color === 'pink' ? 'bg-pink-100 text-pink-800' :
                            categoryInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {categoryInfo.text}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            sourceInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            sourceInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                            sourceInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            sourceInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sourceInfo.text}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Koşullar:</strong>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {discount.conditions.map((condition, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-gray-400">•</span>
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Avantajlar:</strong>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {discount.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Geçerlilik:</strong>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>
                              {new Date(discount.validFrom).toLocaleDateString('tr-TR')} - {new Date(discount.validUntil).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>
                              {discount.usageCount}/{discount.maxUsageCount || '∞'} kullanım
                            </span>
                          </div>
                        </div>
                      </div>

                      {discount.code && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Kod:</strong>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={discount.code}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                            />
                            <button
                              onClick={() => handleCopyCode(discount.code!)}
                              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors duration-200"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          {isExpired && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Süresi Dolmuş
                            </span>
                          )}
                          {discount.isUsed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Kullanılmış
                            </span>
                          )}
                          {isAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Kullanılabilir
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleShareDiscount(discount)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                            title="Paylaş"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {isAvailable && (
                            <button
                              onClick={() => handleUseDiscount(discount.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                            >
                              Kullan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndividualDiscounts;