import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Clock, 
  Search, 
  Filter, 
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

interface ActiveJob {
  id: number;
  jobNumber: string;
  title: string;
  from: string;
  to: string;
  status: 'accepted' | 'in_progress' | 'loading' | 'delivering';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  value: number;
  distance: number;
  estimatedTime: string;
  startDate: string;
  endDate: string;
  client: string;
  description: string;
  weight: string;
  category: string;
  vehicleType: string;
  progress: number;
}

const generateMockActiveJobs = (count: number): ActiveJob[] => {
  const statuses = ['accepted', 'in_progress', 'loading', 'delivering'];
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'];
  const clients = ['TechCorp A.Ş.', 'E-Ticaret Ltd.', 'Gıda A.Ş.', 'Lojistik Pro', 'Hızlı Kargo'];
  const categories = ['Döküman', 'Koli', 'Palet', 'Ev Eşyası', 'Elektronik', 'Gıda'];
  const vehicleTypes = ['Kamyon', 'Kamyonet', 'Minibüs', 'Van'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    jobNumber: `JOB-${1000 + i}`,
    title: `Taşıma İşi ${i + 1}`,
    from: cities[Math.floor(Math.random() * cities.length)],
    to: cities[Math.floor(Math.random() * cities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)] as any,
    priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
    value: Math.floor(Math.random() * 5000) + 500,
    distance: Math.floor(Math.random() * 500) + 50,
    estimatedTime: `${Math.floor(Math.random() * 8) + 1} saat`,
    startDate: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    endDate: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    client: clients[Math.floor(Math.random() * clients.length)],
    description: `Detaylı açıklama ${i + 1}`,
    weight: `${(Math.random() * 10 + 1).toFixed(1)} ton`,
    category: categories[Math.floor(Math.random() * categories.length)],
    vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
    progress: Math.floor(Math.random() * 100),
  }));
};

export default function TasiyiciActiveJobs() {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ActiveJob | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveJobs(generateMockActiveJobs(15));
      setIsLoading(false);
    }, 1000);
  }, []);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Aktif İşler', icon: <Clock className="w-4 h-4" /> }
  ];

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || job.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const getStatusStyle = (status: ActiveJob['status']) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'loading': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivering': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: ActiveJob['status']) => {
    switch (status) {
      case 'accepted': return 'Kabul Edildi';
      case 'in_progress': return 'Devam Ediyor';
      case 'loading': return 'Yükleniyor';
      case 'delivering': return 'Teslim Ediliyor';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: ActiveJob['status']) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'loading': return <Package className="w-4 h-4" />;
      case 'delivering': return <Truck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityStyle = (priority: ActiveJob['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-slate-100 text-slate-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleViewDetails = (job: ActiveJob) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const handleCompleteJob = (id: number) => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveJobs(activeJobs.filter(job => job.id !== id));
      setSuccessMessage('İş başarıyla tamamlandı!');
      setShowSuccessMessage(true);
      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Aktif işler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Aktif İşler - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Taşıyıcı aktif iş yönetimi" />
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
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Aktif İşler</h1>
              <p className="text-sm text-slate-600">Devam eden işlerinizi takip edin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
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
                <p className="text-sm text-slate-600">Toplam Aktif İş</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{activeJobs.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Devam Eden</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {activeJobs.filter(j => j.status === 'in_progress').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Teslim Ediliyor</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {activeJobs.filter(j => j.status === 'delivering').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Kazanç</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  ₺{activeJobs.reduce((sum, job) => sum + job.value, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
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
                <option value="accepted">Kabul Edildi</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="loading">Yükleniyor</option>
                <option value="delivering">Teslim Ediliyor</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Öncelikler</option>
                <option value="urgent">Acil</option>
                <option value="high">Yüksek</option>
                <option value="normal">Normal</option>
                <option value="low">Düşük</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPriority('all');
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
            icon={Clock}
            title="Aktif iş bulunamadı"
            description="Arama kriterlerinize uygun aktif iş bulunamadı."
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
                        <p className="text-xs text-slate-500 mb-1">Araç Tipi</p>
                        <p className="text-sm font-medium text-slate-900">{job.vehicleType}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">İlerleme</span>
                        <span className="text-sm font-medium text-slate-900">%{job.progress}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-slate-800 to-blue-900 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Başlangıç: {new Date(job.startDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Tahmini: {job.estimatedTime}</span>
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
                    <button
                      onClick={() => handleCompleteJob(job.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Tamamla
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
                <p className="text-sm text-slate-500">Bitiş Tarihi</p>
                <p className="font-medium">{new Date(selectedJob.endDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={() => handleCompleteJob(selectedJob.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              İşi Tamamla
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