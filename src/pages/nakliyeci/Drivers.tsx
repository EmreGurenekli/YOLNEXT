import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Search, 
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Truck,
  CheckCircle2,
  Clock,
  Activity,
  MessageSquare
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import Modal from '../../components/shared-ui-elements/Modal';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
// Driver link data interface
interface DriverLinkData {
  code?: string | null;
  email?: string | null;
  driverId?: number;
}

// Temporary workaround
const driversAPI = {
  link: async (data: DriverLinkData) => {
    const response = await fetch(createApiUrl('/api/drivers/link'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await safeJsonParse(response);
  },
  lookup: async (code: string) => {
    const response = await fetch(createApiUrl(`/api/drivers/lookup/${encodeURIComponent(code)}`), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      }
    });
    return await safeJsonParse(response);
  },
  delete: async (driverId: string) => {
    const response = await fetch(createApiUrl(`/api/drivers/${driverId}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return await safeJsonParse(response);
  }
};
import { createApiUrl } from '../../config/api';
import { safeJsonParse } from '../../utils/safeFetch';
import LoadingState from '../../components/shared-ui-elements/LoadingState';

const normalizeDriverIdentifier = (raw: string) => {
  const input = (raw || '').trim();
  if (!input) return '';

  // Email
  if (input.includes('@')) return input.toLowerCase();

  const upper = input.replace(/[ıİ]/g, 'I').toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9]/g, '');

  // Accept YD-12345, YD12345, 12345
  const m = cleaned.match(/^(?:YD)?(\d{4,6})$/);
  if (m) {
    const num = m[1].padStart(5, '0');
    return `YD-${num}`;
  }

  if (cleaned.startsWith('YD') && cleaned.length >= 4) {
    const num = cleaned.slice(2).padStart(5, '0');
    return `YD-${num}`;
  }

  return upper;
};

// Backend driver response interface
interface BackendDriver {
  id: number | string;
  name?: string;
  fullName?: string;
  full_name?: string;
  code?: string;
  driverCode?: string;
  driver_code?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  vehicle?: {
    plate?: string;
    type?: string;
    capacity?: number;
    volume?: number;
  };
  status?: string;
  rating?: number | string;
  totalJobs?: number | string;
  completedJobs?: number | string;
  successRate?: number | string;
  activeJobs?: number;
  joinDate?: string;
  createdAt?: string;
  lastActive?: string;
  updatedAt?: string;
  location?: string;
  city?: string;
  district?: string;
  specialties?: string[];
}

// Frontend driver interface
interface Driver {
  id: string;
  name: string;
  code?: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicle: {
    plate: string;
    type: string;
    capacity: number;
    volume: number;
  };
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalJobs: number;
  completedJobs: number;
  successRate: number;
  joinDate: string;
  lastActive: string;
  location: string;
  specialties: string[];
}

const Drivers = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'new' | 'rating' | 'jobs'>('new');
  // Kod ile ekleme
  const [driverCode, setDriverCode] = useState('');
  const normalizedDriverIdentifier = normalizeDriverIdentifier(driverCode);
  const [linking, setLinking] = useState(false);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  interface LookupData {
    driver?: BackendDriver;
    name?: string;
    fullName?: string;
    vehicleType?: string;
    vehicle?: { type?: string };
    location?: string;
    city?: string;
    message?: string;
  }
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : '';
      
      // Gerçek API çağrısı
      const response = await fetch(createApiUrl('/api/drivers/nakliyeci'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': String(userId || '')
        }
      });
      
      if (response.ok) {
        const data = await safeJsonParse(response);
        // Backend driver response interface (defined before component)
        setDrivers((data.drivers || []).map((d: BackendDriver) => ({
          id: String(d.id),
          name: d.name || d.fullName || d.full_name || '-',
          code: d.code || d.driverCode || d.driver_code || undefined,
          phone: d.phone || '-',
          email: d.email || '-',
          licenseNumber: d.licenseNumber || '-',
          licenseExpiry: d.licenseExpiry || '-',
          vehicle: d.vehicle || { plate: '-', type: '-', capacity: 0, volume: 0 },
          status: (d.status as 'available' | 'busy' | 'offline') || ((d.activeJobs && d.activeJobs > 0) ? 'busy' : 'available'),
          rating: typeof d.rating === 'number' ? d.rating : parseFloat(String(d.rating || 0)) || 0,
          totalJobs: typeof d.totalJobs === 'number' ? d.totalJobs : parseInt(String(d.totalJobs || 0)) || 0,
          completedJobs: typeof d.completedJobs === 'number' ? d.completedJobs : parseInt(String(d.completedJobs || 0)) || 0,
          successRate: typeof d.successRate === 'number' ? d.successRate : parseFloat(String(d.successRate || 0)) || 0,
          joinDate: d.joinDate || d.createdAt || new Date().toISOString(),
          lastActive: d.lastActive || d.updatedAt || new Date().toISOString(),
          location: d.location || [d.city, d.district].filter(Boolean).join(' / ') || '-',
          specialties: d.specialties || [],
        })));
      } else {
        // Failed to load drivers
        setDrivers([]);
      }
    } catch (error) {
      // Error loading drivers
    } finally {
      setIsLoading(false);
    }
  };

  // Manuel ekleme akışı kaldırıldı

  const linkDriverByCode = async () => {
    try {
      setLinking(true);
      setCodeMsg(null);
      setLookupError(null);
      const result = await driversAPI.link({ code: normalizedDriverIdentifier || driverCode });
      
      if (result.success) {
        setCodeMsg(result.message || 'Taşıyıcı başarıyla eklendi');
        setLookupData(null);
        setLookupError(null);
        setDriverCode('');
        loadDrivers();
      } else {
        setCodeMsg(result.message || 'Kod doğrulanamadı');
        setLookupError(result.message || 'Kod doğrulanamadı');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu';
      setCodeMsg(errorMessage);
      setLookupError(errorMessage);
    } finally {
      setLinking(false);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    setDeletingDriverId(driverId);
    try {
      const result = await driversAPI.delete(driverId);
      
      if (result.success) {
        setCodeMsg('Taşıyıcı başarıyla kaldırıldı');
        loadDrivers();
        setShowDeleteConfirm(false);
        setDriverToDelete(null);
      } else {
        setCodeMsg(result.message || 'Taşıyıcı kaldırılamadı');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu';
      setCodeMsg(errorMessage);
    } finally {
      setDeletingDriverId(null);
    }
  };

  // Kod önizleme (debounce)
  useEffect(() => {
    setLookupData(null);
    setLookupError(null);
    const code = driverCode.trim();
    const normalized = normalizeDriverIdentifier(code);
    if (!normalized) return;
    const t = setTimeout(async () => {
      try {
        setLookupLoading(true);
        const res = await fetch(createApiUrl(`/api/drivers/lookup/${encodeURIComponent(normalized)}`), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });
        const json = res.ok ? await safeJsonParse(res).catch(() => ({})) : {};
        if (!res.ok || json.success === false) {
          setLookupData(null);
          setLookupError(json.message || 'Kod bulunamadı');
        } else {
          setLookupData(json.data || null);
          setLookupError(null);
        }
      } catch {
        setLookupData(null);
        setLookupError('Bağlantı hatası');
      } finally {
        setLookupLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [driverCode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'busy':
        return 'Meşgul';
      case 'offline':
        return 'Çevrimdışı';
      default:
        return status;
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm) ||
                         driver.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'jobs') return (b.totalJobs || 0) - (a.totalJobs || 0);
    // 'new' by joinDate desc
    return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
  });

  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'available').length;
  const busyDrivers = drivers.filter(d => d.status === 'busy').length;
  const averageRating = drivers.length > 0 
    ? (drivers.reduce((sum, driver) => sum + driver.rating, 0) / drivers.length).toFixed(1)
    : '0.0';

  if (isLoading) {
    return <LoadingState />;
  }

  const isMeaningful = (v: unknown) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'number') return Number.isFinite(v) && v !== 0;
    const s = String(v).trim();
    if (!s) return false;
    return s !== '-' && s !== '0' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined';
  };

  const formatShortDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Taşıyıcılarım - YolNext Nakliyeci</title>
        <meta name="description" content="Şoför ve araç yönetimi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={[
            { label: 'Taşıyıcılarım', icon: <Users className="w-4 h-4" /> }
          ]} />
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='nakliyeci.drivers'
            isEmpty={!isLoading && drivers.length === 0}
            icon={Users}
            title='Taşıyıcı Yönetimi'
            description='Taşıyıcı kodunu girerek ekle, müsait/aktif durumlarını takip et. Taşıyıcı ataması yapacağın yükleri “Aktif Yükler”de yönetirsin.'
            primaryAction={{
              label: 'Taşıyıcı Ekle',
              onClick: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => codeInputRef.current?.focus(), 350);
              },
            }}
            secondaryAction={{
              label: 'Aktif Yükler',
              to: '/nakliyeci/active-shipments',
            }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Taşıyıcılarım
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Şoför ve araç yönetimi</p>
        </div>

        {/* Top code add: long card, panel style */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-5 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Taşıyıcı Ekle</h3>
                  <p className="text-white/80 text-xs sm:text-sm">Sözleşmeli taşıyıcınızın benzersiz kodunu girin, doğrulayıp hemen ekleyin.</p>
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 py-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Taşıyıcı Kodu</label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    value={driverCode}
                    onChange={(e) => {
                      setDriverCode(e.target.value);
                    }}
                    placeholder="Örn: YD-12345 veya mehmet.kaya@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
            <button 
                  onClick={linkDriverByCode}
                  disabled={linking || !driverCode.trim()}
                  className={`px-5 py-2 rounded-lg text-white md:self-end ${linking || !driverCode ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800'}`}
            >
                  {linking ? 'Ekleniyor…' : 'Ekle'}
            </button>
              </div>
              {!!driverCode.trim() && (
                <div className="mt-2 text-xs text-slate-600">
                  Algılanan: <span className="font-semibold text-slate-900">{normalizedDriverIdentifier || driverCode.trim()}</span>
                </div>
              )}
            {codeMsg && (
              <div className={`mt-3 rounded-xl border p-4 ${codeMsg.includes('Zaten') ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className={`text-sm ${codeMsg.includes('Zaten') ? 'text-yellow-800' : 'text-green-800'}`}>{codeMsg}</div>
                </div>
              )}
            {(lookupLoading || lookupData || lookupError) && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                {lookupLoading && <div className="text-slate-600 text-sm">Kod kontrol ediliyor…</div>}
                {lookupError && !lookupLoading && <div className="text-red-600 text-sm">{lookupError}</div>}
                {lookupData && !lookupLoading && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-slate-900 truncate">{lookupData.name || lookupData.fullName || 'Taşıyıcı'}</h4>
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 border border-slate-200">Yeni</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {(lookupData.vehicleType || (lookupData.vehicle && lookupData.vehicle.type) || 'Araç')} • {(lookupData.location || lookupData.city || 'Konum')}
                      </div>
                    </div>
                    <button
                      onClick={linkDriverByCode}
                      disabled={linking || !driverCode || !lookupData}
                      className={`shrink-0 px-4 py-2 rounded-lg text-white ${linking || !driverCode ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800'}`}
                    >
                      {linking ? 'Ekleniyor…' : 'Ekle'}
            </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Manuel ekleme modalı kaldırıldı */}


        {/* Stats */}
        {drivers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Taşıyıcı</p>
                <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Müsait</p>
                <p className="text-2xl font-bold text-gray-900">{availableDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Meşgul</p>
                <p className="text-2xl font-bold text-gray-900">{busyDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama Puan</p>
                <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Filters + Tabs */}
        {drivers.length > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter==='all'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Tümü ({totalDrivers})</button>
                <button onClick={() => setStatusFilter('available')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter==='available'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Müsait ({availableDrivers})</button>
                <button onClick={() => setStatusFilter('busy')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter==='busy'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Meşgul ({busyDrivers})</button>
                <button onClick={() => setStatusFilter('offline')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter==='offline'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Çevrimdışı</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Sırala:</label>
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as 'new' | 'rating' | 'jobs')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option value="new">En Yeni</option>
                  <option value="rating">Puan Yüksek</option>
                  <option value="jobs">İş Sayısı</option>
                </select>
              </div>
            </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Taşıyıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
          </div>
        </div>
        )}

        {/* Drivers List */}
        {filteredDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredDrivers.map((driver) => {
              const showDetailsToggle =
                isMeaningful(driver.email) ||
                isMeaningful(driver.location) ||
                isMeaningful(driver.totalJobs) ||
                isMeaningful(driver.completedJobs) ||
                isMeaningful(driver.successRate) ||
                isMeaningful(driver.vehicle?.plate) ||
                isMeaningful(driver.vehicle?.type);

              return (
                <div key={driver.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">{driver.name}</h3>
                          {isMeaningful(driver.code) && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                              {driver.code}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                            {getStatusText(driver.status)}
                          </span>
                          {isMeaningful(driver.rating) && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span>{driver.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                    {showDetailsToggle && (
                      <button
                        onClick={() => setExpandedId(prev => (prev === driver.id ? null : driver.id))}
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium"
                      >
                        {expandedId === driver.id ? 'Kapat' : 'Detay'}
                      </button>
                    )}
                      <button
                        onClick={() => {
                          setDriverToDelete(driver.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium"
                        title="Taşıyıcıyı Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isMeaningful(driver.location) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {driver.location}
                      </span>
                    )}
                    {(isMeaningful(driver.vehicle?.type) || isMeaningful(driver.vehicle?.plate)) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        {driver.vehicle?.type || 'Araç'}{driver.vehicle?.plate ? ` • ${driver.vehicle.plate}` : ''}
                      </span>
                    )}
                    {isMeaningful(driver.lastActive) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700">
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                        Son aktif: {formatShortDate(driver.lastActive)}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      <div className="text-xs text-slate-500">Telefon</div>
                      <div className="font-semibold">{driver.phone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/nakliyeci/messages?userId=${driver.id}`)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-md hover:shadow-lg"
                        title="Mesajlaş"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    <a
                      href={`tel:${driver.phone}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800 shadow-md hover:shadow-lg"
                        title="Ara"
                    >
                      <Phone className="w-4 h-4" />
                      Ara
                    </a>
                    </div>
                  </div>

                  {expandedId === driver.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      {(isMeaningful(driver.email) || isMeaningful(driver.location)) && (
                        <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                          {isMeaningful(driver.email) && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <span className="truncate">{driver.email}</span>
                            </div>
                          )}
                          {isMeaningful(driver.location) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-500" />
                              <span className="truncate">{driver.location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {(isMeaningful(driver.totalJobs) || isMeaningful(driver.successRate) || isMeaningful(driver.completedJobs)) && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <div className="text-[11px] text-slate-500">Toplam İş</div>
                            <div className="text-sm font-bold text-slate-900">{driver.totalJobs}</div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <div className="text-[11px] text-slate-500">Tamamlanan</div>
                            <div className="text-sm font-bold text-slate-900">{driver.completedJobs}</div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <div className="text-[11px] text-slate-500">Başarı Oranı</div>
                            <div className="text-sm font-bold text-slate-900">{driver.successRate}%</div>
                          </div>
                        </div>
                      )}

                      {isMeaningful(driver.rating) && (
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <div>
                              <div className="text-xs text-slate-600">Ortalama Puan</div>
                              <div className="text-lg font-bold text-slate-900">{driver.rating.toFixed(1)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {(isMeaningful(driver.vehicle?.plate) || isMeaningful(driver.vehicle?.type)) && (
                        <div className="text-sm text-slate-700">
                          <div className="text-xs text-slate-500 mb-1">Araç Bilgileri</div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            <span className="truncate">{driver.vehicle?.plate || '-'} {driver.vehicle?.type ? `• ${driver.vehicle.type}` : ''}</span>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200">
                        <Link
                          to={`/nakliyeci/drivers/${driver.id}`}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-white bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Detaylı Görüntüle
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Taşıyıcı bulunamadı</h3>
            <p className="text-sm text-slate-600 mb-5">Henüz taşıyıcınız yok. Kodu yazarak hemen ekleyin.</p>
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => codeInputRef.current?.focus(), 350); }}
              className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800"
            >
              Taşıyıcı Ekle
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDriverToDelete(null);
          }}
          title="Taşıyıcıyı Kaldır"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Bu taşıyıcıyı listeden kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDriverToDelete(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                İptal
              </button>
              <button
                onClick={() => driverToDelete && handleDeleteDriver(driverToDelete)}
                disabled={deletingDriverId !== null}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingDriverId !== null ? 'Kaldırılıyor...' : 'Kaldır'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

// Code link modal
// Placed after component to preserve structure; actual JSX is conditionally rendered above
// Inject modal near root container to overlay page


export default Drivers;





















