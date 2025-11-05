import React, { useState } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function CorporateCarriers() {
  const navigate = useNavigate();
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

  const handleViewDetails = (carrierId: number) => {
    console.log('Nakliyeci detayları:', carrierId);
    navigate(`/corporate/carriers?details=${carrierId}`);
  };

  const handleCreateAgreement = (carrierId: number) => {
    setSelectedCarrierForAgreement(carrierId);
    setShowAgreementModal(true);
  };

  const handleViewCommunicationHistory = (carrierId: number) => {
    setSelectedCarrierForCommunication(carrierId);
    setShowCommunicationHistory(true);
  };

  const handleContactCarrier = (carrierId: number, method: string) => {
    console.log(`${method} iletişim:`, carrierId);
    if (method === 'phone') {
      window.open('tel:+905551234567');
    } else if (method === 'email') {
      window.open('mailto:info@kargoexpress.com');
    } else if (method === 'message') {
      navigate('/corporate/messages');
    }
  };

  const handleToggleSelection = (carrierId: number) => {
    setSelectedCarriers(prev =>
      prev.includes(carrierId)
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  const handleBulkAction = (action: string) => {
    console.log(`${action} işlemi:`, selectedCarriers);
    alert(
      `${action} işlemi ${selectedCarriers.length} nakliyeci için uygulanacak`
    );
  };

  const [carriers, setCarriers] = useState<any[]>([]);

  // Load carriers from API
  const loadCarriers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/carriers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load carriers');
      }

      const data = await response.json();
      setCarriers(data.carriers || []);
    } catch (error) {
      console.error('Error loading carriers:', error);
      setCarriers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load carriers on component mount
  React.useEffect(() => {
    loadCarriers();
  }, []);

  const filteredCarriers = carriers.filter(carrier => {
    let matchesSearch = false;

    // Akıllı arama sistemi
    if (searchTerm.startsWith('NK-')) {
      // Kod araması - sadece o nakliyeci
      matchesSearch = carrier.code === searchTerm;
    } else if (searchTerm.includes(' ')) {
      // İsim araması - tüm eşleşenler
      matchesSearch = carrier.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    } else {
      // Şehir araması - o şehirdeki tüm nakliyeciler
      matchesSearch =
        carrier.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.specialties.some((s: string) =>
          s.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    const matchesStatus =
      filterStatus === 'all' || carrier.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
        </div>

        {/* Filters Card - Mobile Optimized */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200 mb-6 sm:mb-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Kod (NK-2024-001), İsim (Hızlı Kargo) veya Şehir (İstanbul) ara...'
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
                <button
                  onClick={() => handleBulkAction('export')}
                  className='px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Dışa Aktar
                </button>
                <button
                  onClick={() => handleBulkAction('message')}
                  className='px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors'
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
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {paginatedCarriers.map(carrier => (
                      <div
                        key={carrier.id}
                        className='bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group'
                      >
                        {/* Header Section */}
                        <div className='flex items-start justify-between mb-6'>
                          <div className='flex items-center gap-4'>
                            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                              {carrier.logo}
                            </div>
                            <div>
                              <h3 className='text-lg font-bold text-slate-900 mb-1'>
                                {carrier.name}
                              </h3>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium'>
                                  {carrier.code}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <MapPin className='w-4 h-4 text-slate-400' />
                                <span className='text-sm text-slate-600 font-medium'>
                                  {carrier.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <input
                              type='checkbox'
                              checked={selectedCarriers.includes(carrier.id)}
                              onChange={() => handleToggleSelection(carrier.id)}
                              className='w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500'
                            />
                            <button className='p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'>
                              <MoreVertical className='w-4 h-4' />
                            </button>
                          </div>
                        </div>

                        {/* Rating and Status */}
                        <div className='flex items-center justify-between mb-6'>
                          <div className='flex items-center gap-2'>
                            <div className='flex items-center gap-1'>
                              <Star className='w-4 h-4 text-amber-500 fill-current' />
                              <span className='font-bold text-slate-900 text-lg'>
                                {carrier.rating}
                              </span>
                            </div>
                            <div className='w-px h-4 bg-slate-300'></div>
                            <span className='text-sm text-slate-500 font-medium'>
                              {carrier.totalShipments} gönderi
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor(carrier.status)}`}
                          >
                            {carrier.status === 'active'
                              ? 'Aktif'
                              : carrier.status === 'inactive'
                                ? 'Pasif'
                                : 'Beklemede'}
                          </span>
                        </div>

                        {/* Performance Metrics */}
                        <div className='bg-slate-50 rounded-lg p-4 mb-6'>
                          <div className='grid grid-cols-3 gap-4'>
                            <div className='text-center'>
                              <div className='text-lg font-bold text-slate-900'>
                                %{carrier.onTimeDelivery}
                              </div>
                              <div className='text-xs text-slate-500 font-medium'>
                                Zamanında Teslimat
                              </div>
                            </div>
                            <div className='text-center'>
                              <div className='text-lg font-bold text-slate-900'>
                                ₺{carrier.averageCost}
                              </div>
                              <div className='text-xs text-slate-500 font-medium'>
                                Ortalama Maliyet
                              </div>
                            </div>
                            <div className='text-center'>
                              <div className='text-lg font-bold text-slate-900'>
                                ₺{(carrier.totalSpent / 1000).toFixed(0)}K
                              </div>
                              <div className='text-xs text-slate-500 font-medium'>
                                Toplam Harcama
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Specialties */}
                        <div className='mb-6'>
                          <div className='text-sm text-slate-600 font-semibold mb-3'>
                            Uzmanlık Alanları
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {carrier.specialties.map((specialty: string, index: number) => (
                              <span
                                key={index}
                                className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200'
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className='flex items-center justify-between pt-4 border-t border-slate-200'>
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getContractTypeColor(carrier.contractType)}`}
                          >
                            {carrier.contractType === 'preferred'
                              ? 'Öncelikli Partner'
                              : carrier.contractType === 'contracted'
                                ? 'Anlaşmalı Partner'
                                : 'Genel Partner'}
                          </span>
                          <div className='flex items-center gap-1'>
                            <button
                              onClick={() => handleViewDetails(carrier.id)}
                              className='p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:scale-105'
                              title='Detayları Gör'
                            >
                              <Eye className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() =>
                                handleContactCarrier(carrier.id, 'phone')
                              }
                              className='p-2.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group-hover:scale-105'
                              title='Telefon Et'
                            >
                              <Phone className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() =>
                                handleContactCarrier(carrier.id, 'message')
                              }
                              className='p-2.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 group-hover:scale-105'
                              title='Mesaj Gönder'
                            >
                              <MessageCircle className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleCreateAgreement(carrier.id)}
                              className='p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 group-hover:scale-105'
                              title='Anlaşma Oluştur'
                            >
                              <FileText className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() =>
                                handleViewCommunicationHistory(carrier.id)
                              }
                              className='p-2.5 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 group-hover:scale-105'
                              title='İletişim Geçmişi'
                            >
                              <MessageSquare className='w-4 h-4' />
                            </button>
                          </div>
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
                            <td className='py-4 px-4'>
                              <div className='flex items-center gap-4'>
                                <div className='w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold'>
                                  {carrier.logo}
                                </div>
                                <div>
                                  <div className='font-medium text-slate-900'>
                                    {carrier.name}
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium'>
                                      {carrier.code}
                                    </span>
                                    <span className='text-sm text-slate-500'>
                                      {carrier.location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='flex items-center gap-1'>
                                <Star className='w-4 h-4 text-yellow-400 fill-current' />
                                <span className='font-medium text-slate-900'>
                                  {carrier.rating}
                                </span>
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='text-sm text-slate-900'>
                                {carrier.totalShipments}
                              </div>
                              <div className='text-xs text-slate-500'>
                                ₺{carrier.totalSpent.toLocaleString()}
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='text-sm text-slate-900'>
                                %{carrier.onTimeDelivery}
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='text-sm text-slate-900'>
                                ₺{carrier.averageCost}
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(carrier.status)}`}
                              >
                                {carrier.status === 'active'
                                  ? 'Aktif'
                                  : carrier.status === 'inactive'
                                    ? 'Pasif'
                                    : 'Beklemede'}
                              </span>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='flex items-center gap-2'>
                                <button
                                  onClick={() => handleViewDetails(carrier.id)}
                                  className='px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
                                >
                                  Detay
                                </button>
                                <button
                                  onClick={() =>
                                    handleContactCarrier(carrier.id, 'phone')
                                  }
                                  className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                                >
                                  Ara
                                </button>
                                <button
                                  onClick={() =>
                                    handleContactCarrier(carrier.id, 'message')
                                  }
                                  className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors'
                                >
                                  Mesaj
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
                  className='bg-white rounded-xl p-4 shadow-lg border border-slate-200'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                        {carrier.logo}
                      </div>
                      <div>
                        <h3 className='font-bold text-slate-900 text-lg'>
                          {carrier.name}
                        </h3>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium'>
                            {carrier.code}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center gap-1'>
                            <Star className='w-4 h-4 text-yellow-500 fill-current' />
                            <span className='text-sm font-medium text-slate-700'>
                              {carrier.rating}
                            </span>
                          </div>
                          <span className='text-sm text-slate-500'>•</span>
                          <span className='text-sm text-slate-500'>
                            {carrier.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={selectedCarriers.includes(carrier.id)}
                        onChange={() => handleToggleSelection(carrier.id)}
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                      />
                      <button className='p-1 hover:bg-slate-100 rounded-lg transition-colors'>
                        <MoreVertical className='w-4 h-4 text-slate-500' />
                      </button>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div className='text-center p-3 bg-slate-50 rounded-lg'>
                      <div className='text-lg font-bold text-slate-900'>
                        {carrier.totalShipments}
                      </div>
                      <div className='text-xs text-slate-500'>
                        Toplam Gönderi
                      </div>
                    </div>
                    <div className='text-center p-3 bg-slate-50 rounded-lg'>
                      <div className='text-lg font-bold text-slate-900'>
                        %{carrier.onTimeDelivery}
                      </div>
                      <div className='text-xs text-slate-500'>
                        Zamanında Teslimat
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <div className='text-sm font-medium text-slate-900'>
                        Ortalama Maliyet
                      </div>
                      <div className='text-lg font-bold text-green-600'>
                        ₺{carrier.averageCost}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-medium text-slate-900'>
                        Toplam Harcama
                      </div>
                      <div className='text-lg font-bold text-blue-600'>
                        ₺{carrier.totalSpent.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleViewDetails(carrier.id)}
                      className='flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors'
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => handleCreateAgreement(carrier.id)}
                      className='flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition-colors'
                    >
                      Sözleşme
                    </button>
                    <button
                      onClick={() => handleViewCommunicationHistory(carrier.id)}
                      className='flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors'
                    >
                      Mesaj
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
      </div>
    </div>
  );
}
