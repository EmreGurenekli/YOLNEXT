import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Award,
  Truck,
  UserPlus,
  RefreshCw,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { createApiUrl } from '../../config/api';
import LoadingState from '../../components/common/LoadingState';

interface Driver {
  id: string;
  name: string;
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
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'new' | 'rating' | 'jobs'>('new');
  // Kod ile ekleme
  const [driverCode, setDriverCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [showCodeInline, setShowCodeInline] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      
      // Gerçek API çağrısı
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? (JSON.parse(storedUser)?.id || '') : '';
      const response = await fetch(createApiUrl('/api/drivers/nakliyeci'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      } else {
        console.error('Failed to load drivers');
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
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
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? (JSON.parse(storedUser)?.id || '') : '';
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/drivers/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ code: driverCode })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        setCodeMsg(data.message || 'Kod doğrulanamadı');
        setLookupError(data.message || 'Kod doğrulanamadı');
        return;
      }
      setCodeMsg(data.message || 'Taşıyıcı başarıyla eklendi');
      setLookupData(null);
      setLookupError(null);
      setDriverCode('');
      loadDrivers();
      setShowCodeInline(false);
    } catch (e) {
      setCodeMsg('Beklenmeyen bir hata oluştu');
      setLookupError('Beklenmeyen bir hata oluştu');
    } finally {
      setLinking(false);
    }
  };

  // Kod önizleme (debounce)
  useEffect(() => {
    setLookupData(null);
    setLookupError(null);
    const code = driverCode.trim();
    // Accept both DRV-XXX-XXX format and email format
    const pattern = /^DRV-[A-Z]{3}-[0-9]{3,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(code) && !emailPattern.test(code)) return;
    const t = setTimeout(async () => {
      try {
        setLookupLoading(true);
        const res = await fetch(createApiUrl(`/api/drivers/lookup/${encodeURIComponent(code)}`));
        const json = await res.json().catch(() => ({}));
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
                      const raw = e.target.value;
                      const normalized = raw.replace(/[ıİi]/g, 'I').toUpperCase();
                      setDriverCode(normalized);
                    }}
                    placeholder="Örn: DRV-IST-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
            <button 
                  onClick={linkDriverByCode}
                  disabled={linking || !driverCode}
                  className={`px-5 py-2 rounded-lg text-white md:self-end ${linking || !driverCode ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800'}`}
            >
                  {linking ? 'Ekleniyor…' : 'Ekle'}
            </button>
              </div>
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
                        <h4 className="text-base font-semibold text-slate-900 truncate">{lookupData.name}</h4>
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 border border-slate-200">Yeni</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {(lookupData.vehicleType || (lookupData.vehicle && lookupData.vehicle.type) || 'Araç')} • {(lookupData.location || 'Konum')}
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
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
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
          <div className="grid gap-6">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{driver.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                            {getStatusText(driver.status)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{driver.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">İletişim Bilgileri</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Telefon</div>
                                <a
                                  href={`tel:${driver.phone}`}
                                  className="font-bold text-blue-600 hover:text-blue-700 text-base"
                                >
                                  {driver.phone}
                                </a>
                              </div>
                            </div>
                            <a
                              href={`tel:${driver.phone}`}
                              className="px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                              <Phone className="w-4 h-4" />
                              Ara
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{driver.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{driver.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Araç Bilgileri</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span>{driver.vehicle.plate} - {driver.vehicle.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>{driver.vehicle.capacity}kg / {driver.vehicle.volume}m³</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            <span>Ehliyet: {driver.licenseNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">Toplam İş</h5>
                        <p className="text-2xl font-bold text-blue-600">{driver.totalJobs}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">Tamamlanan</h5>
                        <p className="text-2xl font-bold text-green-600">{driver.completedJobs}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 mb-1">Başarı Oranı</h5>
                        <p className="text-2xl font-bold text-purple-600">{driver.successRate}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Uzmanlık Alanları</h5>
                      <div className="flex flex-wrap gap-2">
                        {driver.specialties.map((specialty, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>Katılım: {new Date(driver.joinDate).toLocaleDateString('tr-TR')}</p>
                      <p>Son Aktif: {new Date(driver.lastActive).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        Detay
                      </button>
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Kaldır
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
      </div>
    </div>
  );
};

// Code link modal
// Placed after component to preserve structure; actual JSX is conditionally rendered above
// Inject modal near root container to overlay page


export default Drivers;










