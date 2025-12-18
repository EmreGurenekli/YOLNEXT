import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Star,
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  TrendingUp,
  Award,
  Building2,
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Minus,
  Shield,
  AlertTriangle,
  Check,
  X,
  FileText,
  Percent,
  User,
  Globe,
  Save,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';
// import { carriersAPI } from '../../services/api';
// Temporary workaround
import { createApiUrl } from '../../config/api';

const carriersAPI = {
  getCorporate: async () => {
    try {
      const response = await fetch(createApiUrl('/api/carriers/corporate'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        return { success: false, data: { carriers: [] }, message: 'Endpoint bulunamadı' };
      }
      
      return response.json();
    } catch (error: any) {
      console.error('Error fetching carriers:', error);
      return { success: false, data: { carriers: [] }, message: error.message };
    }
  },
  linkCorporate: async (data: any) => {
    try {
      const response = await fetch(createApiUrl('/api/carriers/corporate/link'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        return { 
          success: false, 
          message: response.status === 404 ? 'Endpoint bulunamadı. Lütfen backend\'i kontrol edin.' : 'Beklenmeyen yanıt formatı',
          ok: false 
        };
      }
      
      const result = await response.json();
      if (!response.ok) {
        console.error('API Error:', result);
        return { ...result, ok: false };
      }
      return { ...result, ok: true };
    } catch (error: any) {
      console.error('Fetch Error:', error);
      return { success: false, message: error.message || 'Network error', ok: false };
    }
  },
  unlinkCorporate: async (nakliyeciId: number) => {
    try {
      const response = await fetch(createApiUrl(`/api/carriers/corporate/${nakliyeciId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        return { 
          success: false, 
          message: response.status === 404 ? 'Endpoint bulunamadı. Lütfen backend\'i kontrol edin.' : 'Beklenmeyen yanıt formatı',
          ok: false 
        };
      }
      
      const result = await response.json();
      if (!response.ok) {
        console.error('API Error:', result);
        return { ...result, ok: false };
      }
      return { ...result, ok: true };
    } catch (error: any) {
      console.error('Fetch Error:', error);
      return { success: false, message: error.message || 'Network error', ok: false };
    }
  }
};

export default function CorporateCarriers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailsParam = searchParams.get('details');
  
  // State declarations - carriers must be declared first
  const [carriers, setCarriers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCarriers, setSelectedCarriers] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);
  const [showCommunicationHistory, setShowCommunicationHistory] =
    useState(false);
  const [selectedCarrierForAgreement, setSelectedCarrierForAgreement] =
    useState<number | null>(null);
  const [selectedCarrierForCommunication, setSelectedCarrierForCommunication] =
    useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Nakliyeci ekleme için state'ler
  const [nakliyeciCode, setNakliyeciCode] = useState('');
  const [addingNakliyeci, setAddingNakliyeci] = useState(false);
  const [addNakliyeciError, setAddNakliyeciError] = useState<string | null>(null);
  const [deletingNakliyeciId, setDeletingNakliyeciId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nakliyeciToDelete, setNakliyeciToDelete] = useState<number | null>(null);
  
  // Detay modal için state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCarrierForDetail, setSelectedCarrierForDetail] = useState<number | null>(null);

  const handleViewDetails = (carrierId: number) => {
    // Open carrier details modal
    setSelectedCarrierForDetail(carrierId);
    setShowDetailModal(true);
    setSearchParams({ details: carrierId.toString() });
  };
  
  // Open detail modal if details param exists
  useEffect(() => {
    if (detailsParam && carriers && carriers.length > 0) {
      const carrierId = parseInt(detailsParam);
      const carrier = carriers.find(c => c.id === carrierId);
      if (carrier) {
        setSelectedCarrierForDetail(carrierId);
        setShowDetailModal(true);
      }
    }
  }, [detailsParam, carriers]);

  const handleCreateAgreement = (carrierId: number) => {
    setSelectedCarrierForAgreement(carrierId);
    setShowAgreementModal(true);
  };

  const handleViewCommunicationHistory = (carrierId: number) => {
    setSelectedCarrierForCommunication(carrierId);
    setShowCommunicationHistory(true);
  };

  const handleContactCarrier = (carrierId: number, method: string) => {
    // Navigate to messages page with carrier ID to open conversation
    // Both phone and message buttons open the chat conversation
    navigate(`/corporate/messages?userId=${carrierId}`);
  };

  const handleToggleSelection = (carrierId: number) => {
    setSelectedCarriers(prev =>
      prev.includes(carrierId)
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  const handleBulkAction = (action: string) => {
    // Bulk action on carriers
    alert(
      `${action} işlemi ${selectedCarriers.length} nakliyeci için uygulanacak`
    );
  };

  // Load carriers from API (favori nakliyeciler)
  const loadCarriers = async () => {
    setIsLoading(true);
    try {
      const result = await carriersAPI.getCorporate();
      if (result.success && result.data) {
        const carriersData = result.data.carriers || result.data || [];
        setCarriers(carriersData);
      } else {
        setCarriers([]);
      }
    } catch (error) {
      setCarriers([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add nakliyeci to favorites
  const handleAddNakliyeci = async () => {
    if (!nakliyeciCode.trim()) {
      setAddNakliyeciError('Lütfen nakliyeci kodu veya e-posta girin');
      return;
    }
    
    setAddingNakliyeci(true);
    setAddNakliyeciError(null);
    
    try {
      const response = await carriersAPI.linkCorporate({
        code: nakliyeciCode.includes('@') ? null : nakliyeciCode,
        email: nakliyeciCode.includes('@') ? nakliyeciCode : null
      });
      
      const data = response;
      
      console.log('Response data:', data);
      
      if (!data.ok || data.success === false) {
        const errorMsg = data.message || data.error || 'Nakliyeci eklenemedi';
        console.error('Error adding carrier:', errorMsg);
        setAddNakliyeciError(errorMsg);
        return;
      }
      
      setSuccessMessage(data.message || 'Nakliyeci başarıyla eklendi');
      setShowSuccessMessage(true);
      setNakliyeciCode('');
      setAddNakliyeciError(null);
      loadCarriers(); // Reload carriers list
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Exception in handleAddNakliyeci:', error);
      setAddNakliyeciError(error.message || 'Beklenmeyen bir hata oluştu');
    } finally {
      setAddingNakliyeci(false);
    }
  };

  // Delete nakliyeci from favorites
  const handleDeleteNakliyeci = async (nakliyeciId: number) => {
    setDeletingNakliyeciId(nakliyeciId);
    try {
      const response = await carriersAPI.unlinkCorporate(nakliyeciId);
      
      if (!response.ok || response.success === false) {
        const errorMsg = response.message || response.error || 'Nakliyeci kaldırılamadı';
        console.error('Error deleting carrier:', errorMsg);
        setSuccessMessage(errorMsg);
        setShowSuccessMessage(true);
        return;
      }
      
      setSuccessMessage(response.message || 'Nakliyeci başarıyla kaldırıldı');
      setShowSuccessMessage(true);
      loadCarriers(); // Reload carriers list
      setShowDeleteConfirm(false);
      setNakliyeciToDelete(null);
    } catch (error: any) {
      console.error('Exception in handleDeleteNakliyeci:', error);
      setSuccessMessage(error.message || 'Beklenmeyen bir hata oluştu');
      setShowSuccessMessage(true);
    } finally {
      setDeletingNakliyeciId(null);
    }
  };

  // Load carriers on component mount
  useEffect(() => {
    loadCarriers();
  }, []);

  const filteredCarriers = useMemo(() => {
    if (!carriers || !Array.isArray(carriers)) return [];
    return carriers.filter(carrier => {
    if (!carrier) return false;
    
    let matchesSearch = false;

    // Akıllı arama sistemi
    if (searchTerm.startsWith('YN-')) {
      // Kod araması - sadece o nakliyeci
      matchesSearch = carrier.nakliyeciCode === searchTerm || carrier.nakliyeciCode?.includes(searchTerm);
    } else if (searchTerm.includes('@')) {
      // E-posta araması
      matchesSearch = carrier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchTerm.trim()) {
      // Genel arama - isim, şirket adı, şehir, kod
      const searchLower = searchTerm.toLowerCase();
      matchesSearch =
        carrier.fullName?.toLowerCase().includes(searchLower) ||
        carrier.companyName?.toLowerCase().includes(searchLower) ||
        carrier.city?.toLowerCase().includes(searchLower) ||
        carrier.district?.toLowerCase().includes(searchLower) ||
        carrier.nakliyeciCode?.toLowerCase().includes(searchLower) ||
        carrier.email?.toLowerCase().includes(searchLower);
    } else {
      matchesSearch = true; // No search term, show all
    }

    // Status filtering - backend doesn't return status, so skip for now
    const matchesStatus = filterStatus === 'all';

    return matchesSearch && matchesStatus;
    });
  }, [carriers, searchTerm, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCarriers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCarriers = filteredCarriers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const breadcrumbItems = [
    { label: 'Nakliyeciler', icon: <Users className='w-4 h-4' /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContractTypeColor = (type: string) => {
    switch (type) {
      case 'preferred':
        return 'bg-blue-100 text-blue-800';
      case 'contracted':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Nakliyeci Yönetimi - YolNext Kargo</title>
        <meta name='description' content='Kurumsal nakliyeci yönetim sistemi' />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Users className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Nakliyeci{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Yönetimi
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Anlaşmalı nakliyecilerinizi yönetin ve performanslarını takip edin
          </p>
          <div className='mt-4'>
            <button
              onClick={() => setShowAddModal(true)}
              className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto'
            >
              <Plus className='w-5 h-5' />
              Favori Nakliyeci Ekle
            </button>
          </div>
        </div>

        {/* Filters Card - Mobile Optimized */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200 mb-6 sm:mb-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Kod (YN-12345), İsim (Hızlı Kargo) veya Şehir (İstanbul) ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='active'>Aktif</option>
              <option value='inactive'>Pasif</option>
              <option value='pending'>Beklemede</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
            >
              <option value='rating'>Puana Göre</option>
              <option value='shipments'>Gönderi Sayısına Göre</option>
              <option value='cost'>Maliyete Göre</option>
              <option value='name'>İsme Göre</option>
            </select>

            <div className='flex items-center gap-2 sm:col-span-2 lg:col-span-1'>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className='w-4 h-4 grid grid-cols-2 gap-0.5'>
                  <div className='bg-current rounded-sm'></div>
                  <div className='bg-current rounded-sm'></div>
                  <div className='bg-current rounded-sm'></div>
                  <div className='bg-current rounded-sm'></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className='w-4 h-4 flex flex-col gap-0.5'>
                  <div className='bg-current rounded-sm h-1'></div>
                  <div className='bg-current rounded-sm h-1'></div>
                  <div className='bg-current rounded-sm h-1'></div>
                </div>
              </button>
            </div>

            <button className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base'>
              <Filter className='w-4 h-4' />
              Filtrele
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCarriers.length > 0 && (
          <div className='bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <span className='text-sm font-medium text-blue-900'>
                  {selectedCarriers.length} nakliyeci seçildi
                </span>
                {/* Dışa aktarma butonu kaldırıldı */}
                <button
                  onClick={() => handleBulkAction('message')}
                  className='px-3 py-1.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
                >
                  Toplu Mesaj
                </button>
                <button
                  onClick={() => handleBulkAction('contract')}
                  className='px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors'
                >
                  Sözleşme Güncelle
                </button>
              </div>
              <button
                onClick={() => setSelectedCarriers([])}
                className='text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                Seçimi Temizle
              </button>
            </div>
          </div>
        )}

        {/* Carriers List - Mobile Optimized */}
        {isLoading ? (
          <LoadingState message='Nakliyeciler yükleniyor...' />
        ) : filteredCarriers.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className='hidden lg:block'>
              {viewMode === 'grid' ? (
                <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
                    {paginatedCarriers.map(carrier => (
                      <div
                        key={carrier.id}
                        className='bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group w-full max-w-full overflow-hidden flex flex-col'
                      >
                        {/* Header Section */}
                        <div className='flex items-start justify-between mb-4 gap-3'>
                          <div className='flex items-center gap-3 min-w-0 flex-1'>
                            <div className='w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg'>
                              {(carrier.companyName || carrier.fullName || 'N')?.charAt(0).toUpperCase()}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <h3 className='text-base sm:text-lg font-bold text-slate-900 mb-1 truncate'>
                                {carrier.companyName || carrier.fullName || 'Nakliyeci'}
                              </h3>
                              {carrier.nakliyeciCode && (
                                <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                  <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium break-all'>
                                    {carrier.nakliyeciCode}
                                  </span>
                                </div>
                              )}
                              {(carrier.city || carrier.district) && (
                                <div className='flex items-center gap-2 min-w-0'>
                                  <MapPin className='w-4 h-4 text-slate-400 flex-shrink-0' />
                                  <span className='text-xs sm:text-sm text-slate-600 font-medium truncate'>
                                    {[carrier.city, carrier.district].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
                            <input
                              type='checkbox'
                              checked={selectedCarriers.includes(carrier.id)}
                              onChange={() => handleToggleSelection(carrier.id)}
                              className='w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500'
                            />
                            <button 
                              onClick={() => {
                                setNakliyeciToDelete(carrier.id);
                                setShowDeleteConfirm(true);
                              }}
                              className='p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                              title='Nakliyeciyi Kaldır'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4'>
                          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1'>
                            {carrier.email && (
                              <div className='flex items-center gap-2 min-w-0'>
                                <Mail className='w-4 h-4 text-slate-400 flex-shrink-0' />
                                <span className='text-xs sm:text-sm text-slate-600 font-medium truncate max-w-full'>
                                  {carrier.email}
                                </span>
                              </div>
                            )}
                            {carrier.phone && (
                              <div className='flex items-center gap-2 min-w-0'>
                                {carrier.email && <div className='hidden sm:block w-px h-4 bg-slate-300'></div>}
                                <Phone className='w-4 h-4 text-slate-400 flex-shrink-0' />
                                <span className='text-xs sm:text-sm text-slate-500 font-medium truncate max-w-full'>
                                  {carrier.phone}
                                </span>
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor('active')} flex-shrink-0`}
                          >
                            Aktif
                          </span>
                        </div>

                        {/* Performance Stats */}
                        {(carrier.totalShipments > 0 || carrier.averageRating > 0) && (
                          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 mb-4 border border-blue-100'>
                            <div className='grid grid-cols-2 gap-3'>
                              {carrier.totalShipments > 0 && (
                                <div className='text-center'>
                                  <div className='text-lg sm:text-xl font-bold text-slate-900'>
                                    {carrier.totalShipments}
                                  </div>
                                  <div className='text-xs text-slate-600'>Gönderi</div>
                                  {carrier.completedShipments > 0 && (
                                    <div className='text-xs text-green-600 font-medium mt-1'>
                                      {Math.round((carrier.completedShipments / carrier.totalShipments) * 100)}% Başarı
                                    </div>
                                  )}
                                </div>
                              )}
                              {carrier.averageRating > 0 && (
                                <div className='text-center'>
                                  <div className='text-lg sm:text-xl font-bold text-slate-900 flex items-center justify-center gap-1'>
                                    {parseFloat(carrier.averageRating).toFixed(1)}
                                    <Star className='w-4 h-4 text-yellow-500 fill-yellow-500' />
                                  </div>
                                  <div className='text-xs text-slate-600'>Ortalama Puan</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Primary Action - Create Shipment */}
                        <div className='mb-4'>
                          <button
                            onClick={() => navigate(`/corporate/create-shipment?nakliyeciId=${carrier.id}`)}
                            className='w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                          >
                            <Package className='w-5 h-5' />
                            <span>Bu Nakliyeciye Gönderi Oluştur</span>
                          </button>
                        </div>

                        {/* Quick Actions - Professional & Corporate */}
                        <div className='flex items-center gap-2 pt-4 border-t border-slate-200'>
                          <button
                            onClick={() => handleContactCarrier(carrier.id, 'message')}
                            className='flex-1 px-4 py-2.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                            title='Mesajlaş'
                          >
                            <MessageCircle className='w-4 h-4' />
                            <span className='text-sm'>Mesajlaş</span>
                          </button>
                          <button
                            onClick={() => handleViewDetails(carrier.id)}
                            className='px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                            title='Detayları Görüntüle'
                          >
                            <Eye className='w-4 h-4' />
                            <span className='hidden sm:inline text-sm'>Detay</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200'>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b border-slate-200'>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            <input
                              type='checkbox'
                              className='w-4 h-4 text-blue-600 rounded'
                            />
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            Nakliyeci
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            Puan
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            Gönderi
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            Zamanında Teslimat
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            Maliyet
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            Durum
                          </th>
                          <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCarriers.map(carrier => (
                          <tr
                            key={carrier.id}
                            className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                          >
                            <td className='py-4 px-4'>
                              <input
                                type='checkbox'
                                checked={selectedCarriers.includes(carrier.id)}
                                onChange={() =>
                                  handleToggleSelection(carrier.id)
                                }
                                className='w-4 h-4 text-blue-600 rounded'
                              />
                            </td>
                            <td className='py-4 px-4 max-w-xs'>
                              <div className='flex items-center gap-4 min-w-0'>
                                <div className='w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold'>
                                  {(carrier.companyName || carrier.fullName || 'N')?.charAt(0).toUpperCase()}
                                </div>
                                <div className='min-w-0 flex-1'>
                                  <div className='font-medium text-slate-900 truncate' title={carrier.companyName || carrier.fullName || 'Nakliyeci'}>
                                    {carrier.companyName || carrier.fullName || 'Nakliyeci'}
                                  </div>
                                  <div className='flex items-center gap-2 flex-wrap'>
                                    {carrier.nakliyeciCode && (
                                      <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium break-all'>
                                        {carrier.nakliyeciCode}
                                      </span>
                                    )}
                                    {(carrier.city || carrier.district) && (
                                      <span className='text-sm text-slate-500 truncate'>
                                        {[carrier.city, carrier.district].filter(Boolean).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className='py-4 px-4 max-w-xs'>
                              <div className='text-sm text-slate-900 truncate' title={carrier.email || ''}>
                                {carrier.email || '-'}
                              </div>
                              {carrier.phone && (
                                <div className='text-xs text-slate-500 truncate' title={carrier.phone}>
                                  {carrier.phone}
                                </div>
                              )}
                            </td>
                            <td className='py-4 px-4'>
                              <div className='text-sm text-slate-900'>
                                -
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='text-sm text-slate-900'>
                                -
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='text-sm text-slate-900'>
                                -
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor('active')}`}
                              >
                                Aktif
                              </span>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='flex items-center gap-2 flex-wrap'>
                                <button
                                  onClick={() => handleViewDetails(carrier.id)}
                                  className='px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                                >
                                  <Eye className='w-3 h-3' />
                                  Detay
                                </button>
                                <button
                                  onClick={() => handleContactCarrier(carrier.id, 'message')}
                                  className='px-3 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                                >
                                  <MessageCircle className='w-3 h-3' />
                                  Mesajlaş
                                </button>
                                <button
                                  onClick={() => {
                                    setNakliyeciToDelete(carrier.id);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className='px-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors'
                                  title='Nakliyeciyi Kaldır'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile View */}
            <div className='lg:hidden space-y-4'>
              {filteredCarriers.map(carrier => (
                <div
                  key={carrier.id}
                  className='bg-white rounded-xl p-4 shadow-lg border border-slate-200 w-full max-w-full overflow-hidden'
                >
                  <div className='flex items-start justify-between mb-3 gap-2'>
                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                      <div className='w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                        {(carrier.companyName || carrier.fullName || 'N')?.charAt(0).toUpperCase()}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <h3 className='font-bold text-slate-900 text-base sm:text-lg truncate'>
                          {carrier.companyName || carrier.fullName || 'Nakliyeci'}
                        </h3>
                        {carrier.nakliyeciCode && (
                          <div className='flex items-center gap-2 mb-1 flex-wrap'>
                            <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium break-all'>
                              {carrier.nakliyeciCode}
                            </span>
                          </div>
                        )}
                        {(carrier.city || carrier.district) && (
                          <div className='flex items-center gap-2 min-w-0'>
                            <MapPin className='w-4 h-4 text-slate-400 flex-shrink-0' />
                            <span className='text-xs sm:text-sm text-slate-500 truncate'>
                              {[carrier.city, carrier.district].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {carrier.email && (
                          <div className='flex items-center gap-2 mt-1 min-w-0'>
                            <Mail className='w-4 h-4 text-slate-400 flex-shrink-0' />
                            <span className='text-xs sm:text-sm text-slate-500 truncate'>
                              {carrier.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-1 flex-shrink-0'>
                      <input
                        type='checkbox'
                        checked={selectedCarriers.includes(carrier.id)}
                        onChange={() => handleToggleSelection(carrier.id)}
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                      />
                      <button 
                        onClick={() => {
                          setNakliyeciToDelete(carrier.id);
                          setShowDeleteConfirm(true);
                        }}
                        className='p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Nakliyeciyi Kaldır'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>

                  {carrier.phone && (
                    <div className='mb-4'>
                      <div className='flex items-center gap-2 text-sm text-slate-600'>
                        <Phone className='w-4 h-4' />
                        <span>{carrier.phone}</span>
                      </div>
                    </div>
                  )}

                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <div className='text-sm font-medium text-slate-900'>
                        Durum
                      </div>
                      <div className='text-lg font-bold text-green-600'>
                        Aktif
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-medium text-slate-900'>
                        {carrier.nakliyeciCode || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats - Mobile */}
                  {(carrier.totalShipments > 0 || carrier.averageRating > 0) && (
                    <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 mb-3 border border-blue-100'>
                      <div className='grid grid-cols-2 gap-3'>
                        {carrier.totalShipments > 0 && (
                          <div className='text-center'>
                            <div className='text-lg font-bold text-slate-900'>
                              {carrier.totalShipments}
                            </div>
                            <div className='text-xs text-slate-600'>Gönderi</div>
                            {carrier.completedShipments > 0 && (
                              <div className='text-xs text-green-600 font-medium mt-1'>
                                {Math.round((carrier.completedShipments / carrier.totalShipments) * 100)}% Başarı
                              </div>
                            )}
                          </div>
                        )}
                        {carrier.averageRating > 0 && (
                          <div className='text-center'>
                            <div className='text-lg font-bold text-slate-900 flex items-center justify-center gap-1'>
                              {parseFloat(carrier.averageRating).toFixed(1)}
                              <Star className='w-4 h-4 text-yellow-500 fill-yellow-500' />
                            </div>
                            <div className='text-xs text-slate-600'>Ortalama Puan</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Primary Action - Mobile */}
                  <div className='mb-3'>
                    <button
                      onClick={() => navigate(`/corporate/create-shipment?nakliyeciId=${carrier.id}`)}
                      className='w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                    >
                      <Package className='w-5 h-5' />
                      <span>Gönderi Oluştur</span>
                    </button>
                  </div>

                  {/* Quick Actions - Mobile */}
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleContactCarrier(carrier.id, 'message')}
                      className='flex-1 px-3 py-2.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                    >
                      <MessageCircle className='w-4 h-4' />
                      Mesajlaş
                    </button>
                    <button
                      onClick={() => handleViewDetails(carrier.id)}
                      className='flex-1 px-3 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                    >
                      <Eye className='w-4 h-4' />
                      Detay
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-8'>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Users}
            title='Nakliyeci bulunamadı'
            description='Arama kriterlerinize uygun nakliyeci bulunamadı'
            action={{
              label: 'Yeni Nakliyeci Ekle',
              onClick: () => setShowAddModal(true),
            }}
          />
        )}

        {/* Success Message */}
        <SuccessMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onClose={() => setShowSuccessMessage(false)}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setNakliyeciToDelete(null);
          }}
          title="Nakliyeciyi Kaldır"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Bu nakliyeciyi favorilerinizden kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setNakliyeciToDelete(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                İptal
              </button>
              <button
                onClick={() => nakliyeciToDelete && handleDeleteNakliyeci(nakliyeciToDelete)}
                disabled={deletingNakliyeciId !== null}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingNakliyeciId !== null ? 'Kaldırılıyor...' : 'Kaldır'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Carrier Detail Modal */}
        {selectedCarrierForDetail && (() => {
          const carrier = carriers.find(c => c.id === selectedCarrierForDetail);
          if (!carrier) return null;
          
          return (
            <Modal
              isOpen={showDetailModal}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedCarrierForDetail(null);
                setSearchParams({});
              }}
              title={`${carrier.companyName || carrier.fullName || 'Nakliyeci'} - Detaylar`}
            >
              <div className="space-y-6">
                {/* Company Info */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                      {(carrier.companyName || carrier.fullName || 'N')?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {carrier.companyName || carrier.fullName || 'Nakliyeci'}
                      </h3>
                      {carrier.nakliyeciCode && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                            {carrier.nakliyeciCode}
                          </span>
                        </div>
                      )}
                      {(carrier.city || carrier.district) && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{[carrier.city, carrier.district].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {carrier.email && (
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-500 font-medium mb-1">E-posta</div>
                          <div className="text-sm font-semibold text-slate-900">{carrier.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {carrier.phone && (
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-500 font-medium mb-1">Telefon</div>
                          <div className="text-sm font-semibold text-slate-900">{carrier.phone}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                {(carrier.totalShipments > 0 || carrier.averageRating > 0) && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Performans Özeti</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {carrier.totalShipments > 0 && (
                        <div className="text-center bg-white rounded-lg p-4 border border-blue-100">
                          <div className="text-2xl font-bold text-slate-900 mb-1">
                            {carrier.totalShipments}
                          </div>
                          <div className="text-xs text-slate-600 mb-1">Toplam Gönderi</div>
                          {carrier.completedShipments > 0 && (
                            <div className="text-xs text-green-600 font-semibold">
                              {Math.round((carrier.completedShipments / carrier.totalShipments) * 100)}% Başarı Oranı
                            </div>
                          )}
                        </div>
                      )}
                      {carrier.averageRating > 0 && (
                        <div className="text-center bg-white rounded-lg p-4 border border-blue-100">
                          <div className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center gap-1">
                            {parseFloat(carrier.averageRating).toFixed(1)}
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          </div>
                          <div className="text-xs text-slate-600">Ortalama Puan</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedCarrierForDetail(null);
                      setSearchParams({});
                      navigate(`/corporate/messages?userId=${carrier.id}`);
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Mesajlaş
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedCarrierForDetail(null);
                      setSearchParams({});
                      navigate(`/corporate/create-shipment?nakliyeciId=${carrier.id}`);
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Gönderi Oluştur
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

        {/* Add Nakliyeci Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setNakliyeciCode('');
            setAddNakliyeciError(null);
          }}
          title="Favori Nakliyeci Ekle"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Nakliyeci kodunu veya e-posta adresini girerek favorilerinize ekleyebilirsiniz.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nakliyeci Kodu veya E-posta
              </label>
              <input
                type="text"
                value={nakliyeciCode}
                onChange={(e) => {
                  setNakliyeciCode(e.target.value);
                  setAddNakliyeciError(null);
                }}
                placeholder="Örn: nakliyeci@demo.com veya YN-12345"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {addNakliyeciError && (
                <p className="mt-2 text-sm text-red-600">{addNakliyeciError}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNakliyeciCode('');
                  setAddNakliyeciError(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                İptal
              </button>
              <button
                onClick={handleAddNakliyeci}
                disabled={addingNakliyeci || !nakliyeciCode.trim()}
                className="px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingNakliyeci ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
