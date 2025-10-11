import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Gift, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Star, 
  Clock, 
  Calendar, 
  Percent, 
  DollarSign, 
  Truck, 
  Package, 
  Users, 
  Award, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  Share2,
  Heart,
  Bookmark,
  ExternalLink,
  ArrowRight,
  Tag,
  Zap,
  Crown,
  Shield
} from 'lucide-react';

export default function CorporateDiscounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
      alert('Kod kopyalanamadı');
    }
  };

  const handleShareDiscount = (discountId: number) => {
    console.log('İndirim paylaşılıyor:', discountId);
    // Share functionality
  };

  const handleBookmarkDiscount = (discountId: number) => {
    console.log('İndirim kaydediliyor:', discountId);
    // Bookmark functionality
  };

  // Mock data for discounts
  const discounts = [
    {
      id: 1,
      title: 'Yeni Müşteri İndirimi',
      description: 'İlk gönderinizde %20 indirim kazanın',
      code: 'YENI20',
      discount: 20,
      type: 'percentage',
      minAmount: 500,
      maxDiscount: 1000,
      validUntil: '2024-12-31',
      usageLimit: 1,
      usedCount: 0,
      status: 'active',
      category: 'welcome',
      icon: <Gift className="w-6 h-6" />,
      color: 'blue',
      conditions: [
        'Sadece yeni müşteriler için geçerli',
        'Minimum 500₺ tutarında gönderi',
        'Maksimum 1000₺ indirim'
      ],
      featured: true
    },
    {
      id: 2,
      title: 'Toplu Gönderi İndirimi',
      description: '5 ve üzeri gönderi için %15 indirim',
      code: 'TOPLU15',
      discount: 15,
      type: 'percentage',
      minAmount: 2000,
      maxDiscount: 5000,
      validUntil: '2024-11-30',
      usageLimit: 10,
      usedCount: 3,
      status: 'active',
      category: 'bulk',
      icon: <Package className="w-6 h-6" />,
      color: 'green',
      conditions: [
        'Minimum 5 gönderi',
        'Toplam tutar 2000₺ ve üzeri',
        'Maksimum 5000₺ indirim'
      ],
      featured: false
    },
    {
      id: 3,
      title: 'Sadık Müşteri Bonusu',
      description: 'Aylık 10+ gönderi için %25 indirim',
      code: 'SADIK25',
      discount: 25,
      type: 'percentage',
      minAmount: 1000,
      maxDiscount: 2000,
      validUntil: '2024-12-15',
      usageLimit: 5,
      usedCount: 1,
      status: 'active',
      category: 'loyalty',
      icon: <Crown className="w-6 h-6" />,
      color: 'purple',
      conditions: [
        'Aylık 10+ gönderi yapmış olmalısınız',
        'Minimum 1000₺ tutarında gönderi',
        'Maksimum 2000₺ indirim'
      ],
      featured: true
    },
    {
      id: 4,
      title: 'Hızlı Teslimat İndirimi',
      description: 'Aynı gün teslimat için 500₺ indirim',
      code: 'HIZLI500',
      discount: 500,
      type: 'fixed',
      minAmount: 1000,
      maxDiscount: 500,
      validUntil: '2024-10-31',
      usageLimit: 3,
      usedCount: 2,
      status: 'active',
      category: 'express',
      icon: <Zap className="w-6 h-6" />,
      color: 'orange',
      conditions: [
        'Aynı gün teslimat seçeneği',
        'Minimum 1000₺ tutarında gönderi',
        'Sabah 10:00\'a kadar sipariş'
      ],
      featured: false
    },
    {
      id: 5,
      title: 'Referans Bonusu',
      description: 'Arkadaşınızı davet edin, 1000₺ kazanın',
      code: 'REF1000',
      discount: 1000,
      type: 'fixed',
      minAmount: 0,
      maxDiscount: 1000,
      validUntil: '2024-12-31',
      usageLimit: 5,
      usedCount: 0,
      status: 'active',
      category: 'referral',
      icon: <Users className="w-6 h-6" />,
      color: 'pink',
      conditions: [
        'Arkadaşınız kayıt olmalı',
        'İlk gönderisini yapmalı',
        'Her iki taraf da kazanır'
      ],
      featured: false
    },
    {
      id: 6,
      title: 'Güvenli Taşıma İndirimi',
      description: 'Sigortalı gönderiler için %10 indirim',
      code: 'GUVEN10',
      discount: 10,
      type: 'percentage',
      minAmount: 300,
      maxDiscount: 300,
      validUntil: '2024-11-15',
      usageLimit: 20,
      usedCount: 15,
      status: 'expiring',
      category: 'insurance',
      icon: <Shield className="w-6 h-6" />,
      color: 'red',
      conditions: [
        'Tam sigorta seçeneği',
        'Minimum 300₺ tutarında gönderi',
        'Maksimum 300₺ indirim'
      ],
      featured: false
    }
  ];

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = discount.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || discount.category === filterType;
    const matchesStatus = filterStatus === 'all' || discount.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'used':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      pink: 'bg-pink-100 text-pink-800',
      red: 'bg-red-100 text-red-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'expiring':
        return 'Süresi Doluyor';
      case 'expired':
        return 'Süresi Dolmuş';
      case 'used':
        return 'Kullanılmış';
      default:
        return 'Bilinmiyor';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'welcome':
        return 'Hoş Geldin';
      case 'bulk':
        return 'Toplu Gönderi';
      case 'loyalty':
        return 'Sadakat';
      case 'express':
        return 'Hızlı Teslimat';
      case 'referral':
        return 'Referans';
      case 'insurance':
        return 'Sigorta';
      default:
        return 'Genel';
    }
  };

  const stats = {
    totalDiscounts: discounts.length,
    activeDiscounts: discounts.filter(d => d.status === 'active').length,
    totalSavings: discounts.reduce((sum, d) => sum + (d.usedCount * (d.type === 'percentage' ? d.minAmount * d.discount / 100 : d.discount)), 0),
    availableSavings: discounts.reduce((sum, d) => sum + ((d.usageLimit - d.usedCount) * (d.type === 'percentage' ? d.minAmount * d.discount / 100 : d.discount)), 0)
  };

  return (
    <>
      <Helmet>
        <title>İndirimler / Kampanyalar - YolNet Kargo</title>
        <meta name="description" content="Kurumsal indirim ve kampanya yönetimi" />
      </Helmet>

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">İndirimler / Kampanyalar</h1>
              <p className="text-gray-600">Mevcut indirimlerinizi keşfedin ve tasarruf edin</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Dışa Aktar
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Yeni Kampanya
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Toplam İndirim</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalDiscounts}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Aktif İndirim</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeDiscounts}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Toplam Tasarruf</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">₺{stats.totalSavings.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Kullanılabilir</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">₺{stats.availableSavings.toLocaleString()}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="İndirim ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="welcome">Hoş Geldin</option>
                <option value="bulk">Toplu Gönderi</option>
                <option value="loyalty">Sadakat</option>
                <option value="express">Hızlı Teslimat</option>
                <option value="referral">Referans</option>
                <option value="insurance">Sigorta</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="expiring">Süresi Doluyor</option>
                <option value="expired">Süresi Dolmuş</option>
                <option value="used">Kullanılmış</option>
              </select>

              <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Discounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiscounts.map((discount) => (
            <div key={discount.id} className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
              discount.featured ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${getCategoryColor(discount.color)} flex items-center justify-center`}>
                      {discount.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{discount.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(discount.status)}`}>
                          {getStatusText(discount.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(discount.color)}`}>
                          {getCategoryName(discount.category)}
                        </span>
                        {discount.featured && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Öne Çıkan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleBookmarkDiscount(discount.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleShareDiscount(discount.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{discount.description}</p>

                {/* Discount Code */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">İndirim Kodu</div>
                      <div className="font-mono text-lg font-bold text-gray-900">{discount.code}</div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(discount.code)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      {copiedCode === discount.code ? (
                        <>
                          <Check className="w-4 h-4" />
                          Kopyalandı!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Kopyala
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Discount Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">İndirim:</span>
                    <span className="font-semibold text-gray-900">
                      {discount.type === 'percentage' ? `%${discount.discount}` : `₺${discount.discount}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Minimum Tutar:</span>
                    <span className="font-semibold text-gray-900">₺{discount.minAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Maksimum İndirim:</span>
                    <span className="font-semibold text-gray-900">₺{discount.maxDiscount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Geçerlilik:</span>
                    <span className="font-semibold text-gray-900">{discount.validUntil}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Kullanım:</span>
                    <span className="font-semibold text-gray-900">
                      {discount.usedCount}/{discount.usageLimit}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Kullanım Durumu</span>
                    <span>{Math.round((discount.usedCount / discount.usageLimit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(discount.usedCount / discount.usageLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Koşullar:</div>
                  <ul className="space-y-1">
                    {discount.conditions.map((condition, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Kullan
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDiscounts.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">İndirim bulunamadı</h3>
            <p className="text-gray-500 mb-6">Arama kriterlerinize uygun indirim bulunamadı</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all'); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Tümünü Göster
            </button>
          </div>
        )}
      </div>
    </>
  );
}



