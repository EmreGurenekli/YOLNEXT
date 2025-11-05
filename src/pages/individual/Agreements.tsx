import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Share2,
  Printer,
  Send,
  Archive,
  Star,
  Shield,
  Lock,
  Unlock,
  FileCheck,
  FileX,
  FileEdit,
  FilePlus,
  FileMinus,
  FileSearch,
  Upload,
  Image,
  Video,
  Music,
  Code,
  FileSpreadsheet,
  Presentation,
  File as FileIconAlt,
  FileSpreadsheet as FileExcel,
  Presentation as FilePowerpoint,
  FileArchive,
  FileTextIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderMinusIcon,
  FolderXIcon,
  FolderCheckIcon,
  FolderEditIcon,
  FolderSearchIcon,
  FolderDown,
  FolderUp,
  FolderLock,
  FolderArchive,
  FolderX,
  Heart,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkX,
  BookmarkCheck as BookmarkCheckIcon,
  Star as StarIcon,
  Heart as HeartIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface Agreement {
  id: string;
  shipmentId: string;
  carrierId: string;
  carrierName: string;
  carrierCompany: string;
  carrierPhone: string;
  carrierEmail: string;
  status: 'draft' | 'pending' | 'signed' | 'cancelled' | 'expired';
  title: string;
  description: string;
  price: number;
  terms: string[];
  specialConditions: string[];
  cancellationPolicy: string;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
  signatureUrl?: string;
}

const Agreements: React.FC = () => {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'draft' | 'pending' | 'signed' | 'cancelled' | 'expired'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agreements/individual', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load agreements');
      }

      const data = await response.json();
      setAgreements(data.agreements || []);
    } catch (error) {
      console.error('Error loading agreements:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'pending':
        return 'Beklemede';
      case 'signed':
        return 'İmzalandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className='w-4 h-4' />;
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'signed':
        return <CheckCircle className='w-4 h-4' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4' />;
      case 'expired':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <FileText className='w-4 h-4' />;
    }
  };

  const filteredAgreements = agreements.filter(agreement => {
    const matchesStatus =
      filterStatus === 'all' || agreement.status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      agreement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.carrierCompany.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const breadcrumbItems = [
    {
      label: 'Ana Sayfa',
      icon: <BarChart3 className='w-4 h-4' />,
      href: '/individual/dashboard',
    },
    { label: 'Sözleşmeler', icon: <FileText className='w-4 h-4' /> },
  ];

  if (loading) {
    return <LoadingState message='Sözleşmeler yükleniyor...' />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Sözleşmeler - YolNext</title>
        <meta name='description' content='Taşıma sözleşmelerinizi yönetin' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Breadcrumb items={breadcrumbItems} />

        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Sözleşmeler</h1>
          <p className='mt-2 text-gray-600'>
            Taşıma sözleşmelerinizi görüntüleyin ve yönetin
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <FileText className='w-6 h-6 text-blue-600' />
              </div>
              <div className='ml-4'>
                <div className='text-2xl font-bold text-gray-900'>
                  {agreements.length}
                </div>
                <div className='text-sm text-gray-600'>Toplam Sözleşme</div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 rounded-lg'>
                <Clock className='w-6 h-6 text-yellow-600' />
              </div>
              <div className='ml-4'>
                <div className='text-2xl font-bold text-gray-900'>
                  {agreements.filter(a => a.status === 'pending').length}
                </div>
                <div className='text-sm text-gray-600'>Beklemede</div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
              <div className='ml-4'>
                <div className='text-2xl font-bold text-gray-900'>
                  {agreements.filter(a => a.status === 'signed').length}
                </div>
                <div className='text-sm text-gray-600'>İmzalandı</div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-red-100 rounded-lg'>
                <XCircle className='w-6 h-6 text-red-600' />
              </div>
              <div className='ml-4'>
                <div className='text-2xl font-bold text-gray-900'>
                  {agreements.filter(a => a.status === 'cancelled').length}
                </div>
                <div className='text-sm text-gray-600'>İptal Edildi</div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <AlertCircle className='w-6 h-6 text-orange-600' />
              </div>
              <div className='ml-4'>
                <div className='text-2xl font-bold text-gray-900'>
                  {agreements.filter(a => a.status === 'expired').length}
                </div>
                <div className='text-sm text-gray-600'>Süresi Doldu</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow mb-6'>
          <div className='p-6'>
            <div className='flex flex-wrap gap-4'>
              <div className='flex items-center space-x-2'>
                <Filter className='w-5 h-5 text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>
                  Filtrele:
                </span>
              </div>

              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü ({agreements.length})
              </button>

              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Beklemede (
                {agreements.filter(a => a.status === 'pending').length})
              </button>

              <button
                onClick={() => setFilterStatus('signed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'signed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                İmzalandı (
                {agreements.filter(a => a.status === 'signed').length})
              </button>

              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                İptal Edildi (
                {agreements.filter(a => a.status === 'cancelled').length})
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className='bg-white rounded-lg shadow mb-6'>
          <div className='p-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Sözleşme ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>
        </div>

        {/* Agreements List */}
        {filteredAgreements.length === 0 ? (
          <EmptyState
            icon={FileText}
            title='Sözleşme bulunamadı'
            description='Bu filtreye uygun sözleşme bulunmuyor.'
          />
        ) : (
          <div className='space-y-6'>
            {filteredAgreements.map(agreement => (
              <div key={agreement.id} className='bg-white rounded-lg shadow'>
                <div className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {agreement.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(agreement.status)}`}
                        >
                          {getStatusIcon(agreement.status)}
                          <span>{getStatusText(agreement.status)}</span>
                        </span>
                      </div>

                      <p className='text-gray-600 mb-4'>
                        {agreement.description}
                      </p>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                        <div>
                          <h4 className='text-sm font-medium text-gray-700 mb-2'>
                            Nakliyeci Bilgileri
                          </h4>
                          <div className='space-y-1'>
                            <div className='flex items-center space-x-2'>
                              <User className='w-4 h-4 text-gray-400' />
                              <span className='text-sm text-gray-600'>
                                {agreement.carrierName}
                              </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Building className='w-4 h-4 text-gray-400' />
                              <span className='text-sm text-gray-600'>
                                {agreement.carrierCompany}
                              </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Phone className='w-4 h-4 text-gray-400' />
                              <span className='text-sm text-gray-600'>
                                {agreement.carrierPhone}
                              </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Mail className='w-4 h-4 text-gray-400' />
                              <span className='text-sm text-gray-600'>
                                {agreement.carrierEmail}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className='text-sm font-medium text-gray-700 mb-2'>
                            Sözleşme Detayları
                          </h4>
                          <div className='space-y-1'>
                            <div className='flex items-center space-x-2'>
                              <DollarSign className='w-4 h-4 text-gray-400' />
                              <span className='text-sm text-gray-600'>
                                ₺{agreement.price.toLocaleString()}
                              </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Calendar className='w-4 h-4 text-gray-400' />
                              <span className='text-sm text-gray-600'>
                                {new Date(
                                  agreement.createdAt
                                ).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            {agreement.signedAt && (
                              <div className='flex items-center space-x-2'>
                                <CheckCircle className='w-4 h-4 text-gray-400' />
                                <span className='text-sm text-gray-600'>
                                  İmzalandı:{' '}
                                  {new Date(
                                    agreement.signedAt
                                  ).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Terms */}
                      {agreement.terms && agreement.terms.length > 0 && (
                        <div className='mb-4'>
                          <h4 className='text-sm font-medium text-gray-700 mb-2'>
                            Şartlar
                          </h4>
                          <ul className='list-disc list-inside space-y-1'>
                            {agreement.terms.map((term, index) => (
                              <li key={index} className='text-sm text-gray-600'>
                                {term}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Special Conditions */}
                      {agreement.specialConditions &&
                        agreement.specialConditions.length > 0 && (
                          <div className='mb-4'>
                            <h4 className='text-sm font-medium text-gray-700 mb-2'>
                              Özel Koşullar
                            </h4>
                            <ul className='list-disc list-inside space-y-1'>
                              {agreement.specialConditions.map(
                                (condition, index) => (
                                  <li
                                    key={index}
                                    className='text-sm text-gray-600'
                                  >
                                    {condition}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Cancellation Policy */}
                      {agreement.cancellationPolicy && (
                        <div className='mb-4'>
                          <h4 className='text-sm font-medium text-gray-700 mb-2'>
                            İptal Politikası
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {agreement.cancellationPolicy}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => setSelectedAgreement(agreement)}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium'
                      >
                        Detayları Gör
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agreements;
