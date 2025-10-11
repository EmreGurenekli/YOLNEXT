import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Star, 
  Eye, 
  MessageSquare,
  Phone,
  Calendar,
  Package,
  Navigation,
  Zap,
  TrendingUp,
  Award,
  Shield,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Heart,
  Bookmark,
  Share2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

export default function TasiyiciJobs() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('matchScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(12);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Truck className="w-4 h-4" /> },
    { label: 'İş Pazarı', icon: <Package className="w-4 h-4" /> }
  ];

  // Mock data - yüzlerce iş ilanı
  const generateMockJobs = () => {
    const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Urfa', 'Malatya', 'Erzurum', 'Van', 'Batman', 'Elazığ', 'Isparta', 'Denizli'];
    const cargoTypes = ['Gıda ürünleri', 'Elektronik ürünler', 'Tekstil ürünleri', 'Kimya ürünleri', 'Otomotiv parçaları', 'İnşaat malzemeleri', 'Tarım ürünleri', 'Kozmetik ürünleri', 'İlaç ürünleri', 'Ev eşyaları'];
    const companies = ['ABC Teknoloji A.Ş.', 'XYZ Market', 'DEF Gıda', 'GHI Tekstil', 'JKL Kimya', 'MNO Otomotiv', 'PQR İnşaat', 'STU Tarım', 'VWX Kozmetik', 'YZA İlaç', 'BCD Ev Eşyaları', 'EFG Lojistik', 'HIJ Kargo', 'KLM Taşımacılık', 'NOP Nakliyat'];
    const urgencies = ['low', 'medium', 'high'];
    const statuses = ['available', 'urgent', 'premium'];

    return Array.from({ length: 247 }, (_, index) => {
      const fromCity = cities[Math.floor(Math.random() * cities.length)];
      const toCity = cities[Math.floor(Math.random() * cities.length)];
      const distance = Math.floor(Math.random() * 800) + 100;
      const basePrice = Math.floor(Math.random() * 3000) + 500;
      const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const matchScore = Math.floor(Math.random() * 40) + 60;
      
      return {
        id: `JOB-${String(index + 1).padStart(3, '0')}`,
        title: `${fromCity} → ${toCity} Güzergahı`,
        customer: companies[Math.floor(Math.random() * companies.length)],
        route: `${fromCity} → ${toCity}`,
        cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
        weight: `${(Math.random() * 5 + 0.5).toFixed(1)} ton`,
        price: basePrice,
        suggestedPrice: Math.floor(basePrice * (1 + Math.random() * 0.3)),
        deadline: `${Math.floor(Math.random() * 7) + 1} gün`,
        urgency,
        distance: `${distance} km`,
        estimatedTime: `${Math.floor(distance / 60) + 1} saat`,
        profitPotential: matchScore > 85 ? 'Çok Yüksek' : matchScore > 75 ? 'Yüksek' : matchScore > 65 ? 'Orta' : 'Düşük',
        matchScore,
        reason: matchScore > 85 ? 'Mükemmel eşleşme, yüksek kazanç' : matchScore > 75 ? 'İyi eşleşme, orta kazanç' : 'Standart eşleşme',
        carrier: companies[Math.floor(Math.random() * companies.length)],
        carrierRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        status,
        postedTime: `${Math.floor(Math.random() * 24)} saat önce`,
        applications: Math.floor(Math.random() * 15),
        isPremium: status === 'premium',
        isUrgent: status === 'urgent',
        tags: ['Hızlı teslimat', 'Güvenli taşıma', 'Sigortalı', 'Takip edilebilir'].slice(0, Math.floor(Math.random() * 3) + 1)
      };
    });
  };

  const [jobs] = useState(generateMockJobs());

  // Filtering and sorting
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'urgent' && job.isUrgent) ||
                         (filterStatus === 'premium' && job.isPremium) ||
                         (filterStatus === 'high-profit' && job.matchScore > 80);
    
    return matchesSearch && matchesFilter;
  });

  const sortedJobs = filteredJobs.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'matchScore' || sortBy === 'price' || sortBy === 'suggestedPrice') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = sortedJobs.slice(startIndex, endIndex);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfitColor = (profit: string) => {
    switch (profit) {
      case 'Çok Yüksek': return 'text-green-600';
      case 'Yüksek': return 'text-blue-600';
      case 'Orta': return 'text-yellow-600';
      case 'Düşük': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'available': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleFavorite = (jobId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(jobId)) {
      newFavorites.delete(jobId);
    } else {
      newFavorites.add(jobId);
    }
    setFavorites(newFavorites);
  };

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>İş Pazarı - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Yüzlerce iş fırsatı ve taşıyıcı iş ilanları" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-between items-start lg:items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">İş Pazarı</h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    {filteredJobs.length} iş fırsatı • Size özel akıllı öneriler
                  </p>
                </div>
        </div>

              <div className="flex flex-wrap gap-3">
            <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                    placeholder="Şehir, firma veya güzergah ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-64"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filtrele
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            </div>
            
          {/* Filters */}
          {showFilters && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durum</label>
            <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="all">Tümü ({jobs.length})</option>
                    <option value="urgent">Acil ({jobs.filter(j => j.isUrgent).length})</option>
                    <option value="premium">Premium ({jobs.filter(j => j.isPremium).length})</option>
                    <option value="high-profit">Yüksek Kazanç ({jobs.filter(j => j.matchScore > 80).length})</option>
            </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sıralama</label>
            <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="matchScore">Eşleşme Skoru</option>
                    <option value="suggestedPrice">Fiyat</option>
                    <option value="postedTime">Yayın Tarihi</option>
                    <option value="distance">Mesafe</option>
            </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sıra</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortOrder('desc')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                        sortOrder === 'desc' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <SortDesc className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setSortOrder('asc')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                        sortOrder === 'asc' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <SortAsc className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setSortBy('matchScore');
                      setSortOrder('desc');
                    }}
                    className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Temizle
            </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-4 sm:px-6 md:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{jobs.length}</div>
                <div className="text-sm text-blue-200">Toplam İş</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{jobs.filter(j => j.isUrgent).length}</div>
                <div className="text-sm text-blue-200">Acil İş</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{jobs.filter(j => j.matchScore > 80).length}</div>
                <div className="text-sm text-blue-200">Yüksek Eşleşme</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">₺{Math.round(jobs.reduce((sum, job) => sum + job.suggestedPrice, 0) / jobs.length).toLocaleString()}</div>
                <div className="text-sm text-blue-200">Ortalama Fiyat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid/List */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8">
              <LoadingState text="İşler yükleniyor..." />
            </div>
          ) : currentJobs.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                icon={Package}
                title="İş bulunamadı"
                description="Arama kriterlerinize uygun iş bulunamadı. Filtreleri değiştirmeyi deneyin."
              />
            </div>
          ) : (
            <>
              <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                {currentJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all group cursor-pointer ${
                      viewMode === 'list' ? 'p-6' : 'p-4'
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                          {job.isPremium && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              Premium
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Acil
                    </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <MapPin className="w-4 h-4" />
                          {job.route}
                        </div>
                        <div className="text-sm text-slate-500">{job.cargo} • {job.weight} • {job.distance}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(job.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${favorites.has(job.id) ? 'fill-current text-red-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Share functionality
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Match Score & Pricing */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Eşleşme Skoru</span>
                        <span className="text-sm font-bold text-slate-900">{job.matchScore}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-gradient-to-r from-slate-800 to-blue-900 h-2 rounded-full transition-all duration-1000" 
                          style={{ width: `${job.matchScore}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-slate-500">Önerilen Fiyat</div>
                          <div className="text-lg font-bold text-slate-900">₺{job.suggestedPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Kazanç Potansiyeli</div>
                          <div className={`text-sm font-bold ${getProfitColor(job.profitPotential)}`}>
                            {job.profitPotential}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carrier Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{job.carrier}</div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-slate-500">{job.carrierRating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{job.postedTime}</div>
                        <div className="text-xs text-slate-500">{job.applications} başvuru</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                    </span>
                      ))}
                  </div>
                  
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(job);
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all font-medium text-sm"
                      >
                        Detayları Gör
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Apply functionality
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      {startIndex + 1}-{Math.min(endIndex, sortedJobs.length)} / {sortedJobs.length} iş gösteriliyor
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-4 h-4 rotate-90" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-4 h-4 rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
                  </div>
                </div>
                
      {/* Job Detail Modal */}
      {showJobModal && selectedJob && (
        <Modal
          isOpen={showJobModal}
          onClose={() => setShowJobModal(false)}
          title="İş Detayları"
        >
          <div className="space-y-6">
            {/* Job Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedJob.title}</h2>
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  {selectedJob.route}
                </div>
                <div className="text-slate-500">{selectedJob.cargo} • {selectedJob.weight} • {selectedJob.distance}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(selectedJob.urgency)}`}>
                  {selectedJob.urgency === 'high' ? 'Acil' : selectedJob.urgency === 'medium' ? 'Orta' : 'Düşük'}
                </span>
                <span className="text-sm text-slate-500">{selectedJob.deadline}</span>
                </div>
              </div>

            {/* Detailed Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Fiyat Bilgileri</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Orijinal Fiyat</span>
                      <span className="text-lg font-bold text-slate-900">₺{selectedJob.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Önerilen Fiyat</span>
                      <span className="text-xl font-bold text-green-600">₺{selectedJob.suggestedPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Kazanç Potansiyeli</span>
                      <span className={`font-bold ${getProfitColor(selectedJob.profitPotential)}`}>
                        {selectedJob.profitPotential}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Eşleşme Detayları</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Eşleşme Skoru</span>
                      <span className="text-lg font-bold text-slate-900">{selectedJob.matchScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-slate-800 to-blue-900 h-3 rounded-full" 
                        style={{ width: `${selectedJob.matchScore}%` }}
                      ></div>
                </div>
                    <p className="text-sm text-slate-600">{selectedJob.reason}</p>
                </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Nakliyeci Bilgileri</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{selectedJob.carrier}</div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-slate-500">{selectedJob.carrierRating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tahmini Süre</span>
                        <span className="text-slate-900">{selectedJob.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Yayın Tarihi</span>
                        <span className="text-slate-900">{selectedJob.postedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Başvuru Sayısı</span>
                        <span className="text-slate-900">{selectedJob.applications}</span>
                      </div>
                </div>
              </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Etiketler</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
        </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all font-medium">
                Hemen Başvur
              </button>
              <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
              <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                <Phone className="w-5 h-5" />
            </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}