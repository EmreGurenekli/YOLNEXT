import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  CheckCircle, 
  Search, 
  Filter, 
  Eye,
  MapPin, 
  Calendar, 
  DollarSign, 
  Truck,
  Package,
  Star, 
  ArrowRight,
  RefreshCw,
  BarChart3,
  Download,
  StarIcon
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

interface CompletedJob {
  id: number;
  jobNumber: string;
  title: string;
  from: string;
  to: string;
  status: 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  value: number;
  distance: number;
  completedDate: string;
  startDate: string;
  client: string;
  description: string;
  weight: string;
  category: string;
  vehicleType: string;
  rating: number;
  feedback: string;
  duration: string;
}

const generateMockCompletedJobs = (count: number): CompletedJob[] => {
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'];
  const clients = ['TechCorp A.Ş.', 'E-Ticaret Ltd.', 'Gıda A.Ş.', 'Lojistik Pro', 'Hızlı Kargo'];
  const categories = ['Döküman', 'Koli', 'Palet', 'Ev Eşyası', 'Elektronik', 'Gıda'];
  const vehicleTypes = ['Kamyon', 'Kamyonet', 'Minibüs', 'Van'];
  const feedbacks = [
    'Çok hızlı ve güvenli teslimat. Teşekkürler!',
    'Mükemmel hizmet, kesinlikle tekrar çalışırım.',
    'Profesyonel yaklaşım, çok memnun kaldım.',
    'Zamanında teslimat, paketler güvenli.',
    'Harika bir deneyim, öneririm.'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    jobNumber: `JOB-${2000 + i}`,
    title: `Tamamlanan İş ${i + 1}`,
    from: cities[Math.floor(Math.random() * cities.length)],
    to: cities[Math.floor(Math.random() * cities.length)],
    status: Math.random() > 0.1 ? 'completed' : 'cancelled',
    priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
    value: Math.floor(Math.random() * 5000) + 500,
    distance: Math.floor(Math.random() * 500) + 50,
    completedDate: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    startDate: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    client: clients[Math.floor(Math.random() * clients.length)],
    description: `Detaylı açıklama ${i + 1}`,
    weight: `${(Math.random() * 10 + 1).toFixed(1)} ton`,
    category: categories[Math.floor(Math.random() * categories.length)],
    vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
    rating: Math.floor(Math.random() * 2) + 4, // 4-5 arası
    feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
    duration: `${Math.floor(Math.random() * 8) + 1} saat`,
  }));
};

export default function TasiyiciCompletedJobs() {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CompletedJob | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setCompletedJobs(generateMockCompletedJobs(25));
      setIsLoading(false);
    }, 1000);
  }, []);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Tamamlanan İşler', icon: <CheckCircle className="w-4 h-4" /> }
  ];

  const filteredJobs = completedJobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesRating = filterRating === 'all' || 
      (filterRating === '5' && job.rating === 5) ||
      (filterRating === '4' && job.rating === 4) ||
      (filterRating === '3' && job.rating === 3);

    return matchesSearch && matchesStatus && matchesRating;
  });

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const getStatusStyle = (status: CompletedJob['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: CompletedJob['status']) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: CompletedJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <Package className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getPriorityStyle = (priority: CompletedJob['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-slate-100 text-slate-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300'
        }`}
      />
    ));
  };

  const handleViewDetails = (job: CompletedJob) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const handleDownloadReport = () => {
    setSuccessMessage('Rapor indiriliyor...');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Tamamlanan işler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Tamamlanan İşler - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Taşıyıcı tamamlanan iş yönetimi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tamamlanan İşler</h1>
              <p className="text-sm text-slate-600">Geçmiş işlerinizi görüntüleyin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Rapor İndir</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Tamamlanan</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {completedJobs.filter(j => j.status === 'completed').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ortalama Puan</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {(completedJobs.reduce((sum, job) => sum + job.rating, 0) / completedJobs.length).toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Kazanç</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  ₺{completedJobs.reduce((sum, job) => sum + job.value, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Mesafe</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {completedJobs.reduce((sum, job) => sum + job.distance, 0).toLocaleString()} km
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="İş ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              />
            </div>
            
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
            </select>

            <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Puanlar</option>
                <option value="5">5 Yıldız</option>
                <option value="4">4 Yıldız</option>
                <option value="3">3 Yıldız</option>
            </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterRating('all');
                  setShowFilters(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Filtreleri Temizle
            </button>
          </div>
        </div>
        )}

        {/* Jobs List */}
        {currentJobs.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Tamamlanan iş bulunamadı"
            description="Arama kriterlerinize uygun tamamlanan iş bulunamadı."
          />
        ) : (
        <div className="space-y-4">
            {currentJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">#{job.jobNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(job.status)}`}>
                        {getStatusIcon(job.status)} {getStatusText(job.status)}
                    </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(job.priority)}`}>
                        {job.priority === 'urgent' ? 'Acil' : job.priority === 'high' ? 'Yüksek' : job.priority === 'normal' ? 'Normal' : 'Düşük'}
                    </span>
                  </div>
                  
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Güzergah</p>
                        <p className="text-sm font-medium text-slate-900">{job.from} <ArrowRight className="w-3 h-3 inline-block mx-1" /> {job.to}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Müşteri</p>
                        <p className="text-sm font-medium text-slate-900">{job.client}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Değer</p>
                        <p className="text-sm font-medium text-slate-900">₺{job.value.toLocaleString()}</p>
                    </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Mesafe</p>
                        <p className="text-sm font-medium text-slate-900">{job.distance} km</p>
                    </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Ağırlık</p>
                        <p className="text-sm font-medium text-slate-900">{job.weight}</p>
                  </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Kategori</p>
                        <p className="text-sm font-medium text-slate-900">{job.category}</p>
                </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Süre</p>
                        <p className="text-sm font-medium text-slate-900">{job.duration}</p>
                </div>
              </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-600">Müşteri Puanı</span>
                        <div className="flex items-center gap-1">
                          {renderStars(job.rating)}
                </div>
                        <span className="text-sm font-medium text-slate-900">({job.rating}/5)</span>
                </div>
                      {job.feedback && (
                        <p className="text-sm text-slate-600 italic">"{job.feedback}"</p>
                      )}
              </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Tamamlanma: {new Date(job.completedDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>{job.vehicleType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                  <button
                      onClick={() => handleViewDetails(job)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {showDetailModal && selectedJob && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`İş Detayları: ${selectedJob.jobNumber}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">İş Numarası</p>
                <p className="font-medium">{selectedJob.jobNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getStatusText(selectedJob.status)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Güzergah</p>
                <p className="font-medium">{selectedJob.from} → {selectedJob.to}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Müşteri</p>
                <p className="font-medium">{selectedJob.client}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Değer</p>
                <p className="font-medium">₺{selectedJob.value.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mesafe</p>
                <p className="font-medium">{selectedJob.distance} km</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Açıklama</p>
              <p className="font-medium">{selectedJob.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Başlangıç Tarihi</p>
                <p className="font-medium">{new Date(selectedJob.startDate).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tamamlanma Tarihi</p>
                <p className="font-medium">{new Date(selectedJob.completedDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Müşteri Puanı</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {renderStars(selectedJob.rating)}
                </div>
                <span className="font-medium">({selectedJob.rating}/5)</span>
              </div>
            </div>
            {selectedJob.feedback && (
              <div>
                <p className="text-sm text-slate-500">Müşteri Yorumu</p>
                <p className="font-medium italic">"{selectedJob.feedback}"</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Kapat
            </button>
        </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}