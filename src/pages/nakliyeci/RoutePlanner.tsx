import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Truck,
  Package,
  Weight,
  Ruler,
  Clock,
  DollarSign,
  Plus,
  Minus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Route,
  Navigation,
  Target,
  Zap,
  Calculator,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Eye,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import ErrorToast from '../../components/error/ErrorToast';
import { createApiUrl } from '../../config/api';
import { normalizeTrackingCode } from '../../utils/trackingCode';

interface Vehicle {
  id: number;
  name: string;
  type: string;
  maxWeight: number;
  maxVolume: number;
  currentWeight: number;
  currentVolume: number;
}

interface RoutePoint {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  order: number;
  type: 'pickup' | 'delivery';
  weight?: number;
  volume?: number;
  price?: number;
  deadline?: string;
}

interface AvailableLoad {
  id: number;
  title: string;
  pickupAddress: string;
  deliveryAddress: string;
  weight: number;
  volume: number;
  price: number;
  deadline: string;
  distance: number;
  driver: {
    id: string;
    name: string;
    phone: string;
    email: string;
  } | null;
  shipper: {
    name: string;
    phone: string;
    email: string;
  };
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  code?: string;
  city?: string;
  district?: string;
  status?: 'available' | 'busy';
  activeJobs?: number;
}

interface Corridor {
  pickupCity: string | null;
  deliveryCity: string | null;
}

interface RoutePlan {
  key: string;
  driver: AvailableLoad['driver'];
  vehicle: Vehicle | null;
  points: RoutePoint[];
  isOptimized: boolean;
}

export default function RoutePlanner() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const focusShipmentId = searchParams.get('shipmentId');
  const didAutoAddLoadRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [loadsLoading, setLoadsLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [plans, setPlans] = useState<RoutePlan[]>([
    {
      key: 'unassigned',
      driver: null,
      vehicle: null,
      points: [],
      isOptimized: false,
    },
  ]);
  const [activePlanKey, setActivePlanKey] = useState<string>('unassigned');
  const [availableLoads, setAvailableLoads] = useState<AvailableLoad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [weightFilter, setWeightFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [showLoadDetails, setShowLoadDetails] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [corridor, setCorridor] = useState<Corridor | null>(null);
  const [corridorLoads, setCorridorLoads] = useState<AvailableLoad[]>([]);
  const [corridorLoading, setCorridorLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedLoadForOffer, setSelectedLoadForOffer] = useState<AvailableLoad | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const toTrackingCode = normalizeTrackingCode;

  const focusTrackingCode = focusShipmentId ? toTrackingCode(focusShipmentId) : '';

  const breadcrumbItems = [
    ...(focusShipmentId
      ? [
          {
            label: 'Aktif Yükler',
            href: '/nakliyeci/active-shipments',
            icon: <Truck className='w-4 h-4' />,
          },
          {
            label: focusTrackingCode || `#${focusShipmentId}`,
            href: `/nakliyeci/active-shipments?shipmentId=${focusShipmentId}`,
            icon: <Package className='w-4 h-4' />,
          },
        ]
      : []),
    { label: 'Akıllı Rota', icon: <Route className='w-4 h-4' /> },
  ];

  // Araç listesi state'i
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const getPlanKeyForDriver = (driver: AvailableLoad['driver']) =>
    driver?.id ? `driver:${String(driver.id)}` : 'unassigned';

  const activePlan = useMemo(() => {
    const found = plans.find(p => p.key === activePlanKey);
    if (found) return found;
    return plans[0] || null;
  }, [plans, activePlanKey]);

  useEffect(() => {
    if (activePlan && activePlan.key !== activePlanKey) {
      setActivePlanKey(activePlan.key);
    }
  }, [activePlan, activePlanKey]);

  const selectedVehicle = activePlan?.vehicle || null;
  const routePoints = activePlan?.points || [];
  const isOptimized = Boolean(activePlan?.isOptimized);

  const ensurePlanExists = (key: string, driver: AvailableLoad['driver'], preferredVehicle?: Vehicle | null) => {
    setPlans(prev => {
      if (prev.some(p => p.key === key)) return prev;
      const fallbackVehicle = preferredVehicle || prev.find(p => p.key === activePlanKey)?.vehicle || vehicles[0] || null;
      return [
        ...prev,
        {
          key,
          driver,
          vehicle: fallbackVehicle,
          points: [],
          isOptimized: false,
        },
      ];
    });
  };

  const setPlanVehicle = (planKey: string, vehicle: Vehicle | null) => {
    setPlans(prev => prev.map(p => (p.key === planKey ? { ...p, vehicle } : p)));
  };

  const setPlanPoints = (planKey: string, points: RoutePoint[], optimized?: boolean) => {
    setPlans(prev =>
      prev.map(p =>
        p.key === planKey
          ? {
              ...p,
              points: normalizeRouteOrder(points),
              isOptimized: typeof optimized === 'boolean' ? optimized : p.isOptimized,
            }
          : p
      )
    );
  };

  const normalizeRouteOrder = (points: RoutePoint[]) =>
    points.map((p, idx) => ({ ...p, order: idx + 1 }));

  // Load vehicles from API
  const loadVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const userId =
        user?.id ||
        (localStorage.getItem('user')
          ? (() => {
              try {
                return JSON.parse(localStorage.getItem('user') || '{}').id;
              } catch {
                return undefined;
              }
            })()
          : null);
      const token = localStorage.getItem('authToken');

      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }

      const response = await fetch(createApiUrl('/api/vehicles/nakliyeci'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Araçlar yüklenemedi');
      }

      const data = await response.json();
      // Backend format: { success: true, vehicles: [...] }
      const vehicles = data.vehicles || data.data || [];
      setVehicles(vehicles);

      if (vehicles.length > 0) {
        setPlans(prev =>
          prev.map(p => (p.vehicle ? p : { ...p, vehicle: vehicles[0] }))
        );
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Araçlar yüklenirken hata:', error);
      }
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Load available loads from API
  const loadAvailableLoads = async () => {
    setLoadsLoading(true);
    try {
      const userId =
        user?.id ||
        (localStorage.getItem('user')
          ? (() => {
              try {
                return JSON.parse(localStorage.getItem('user') || '{}').id;
              } catch {
                return undefined;
              }
            })()
          : null);
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/loads/available?scope=mine'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Uygun yükler yüklenemedi');
      }

      const data = await response.json();
      // Backend format: { success: true, data: [...] }
      const loads = data.data || data.loads || [];
      setAvailableLoads(loads);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Uygun yükler yüklenirken hata:', error);
      }
      setAvailableLoads([]);
    } finally {
      setLoadsLoading(false);
    }
  };

  // Load drivers
  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const userId =
        user?.id ||
        (localStorage.getItem('user')
          ? (() => {
              try {
                return JSON.parse(localStorage.getItem('user') || '{}').id;
              } catch {
                return undefined;
              }
            })()
          : null);
      const token = localStorage.getItem('authToken');

      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }

      const response = await fetch(createApiUrl('/api/drivers/nakliyeci'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Taşıyıcılar yüklenemedi');
      }

      const data = await response.json();
      const driversList = data.drivers || data.data || [];
      setDrivers(driversList);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Taşıyıcılar yüklenirken hata:', error);
      }
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  };

  // Load corridor for driver
  const loadCorridor = async (driverId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/loads/corridor/${driverId}`), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.corridor || null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Koridor yüklenirken hata:', error);
      }
      return null;
    }
  };

  // Load corridor loads
  const loadCorridorLoads = async (driverId: string) => {
    setCorridorLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/loads/corridor-loads/${driverId}`), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Koridor yükleri yüklenemedi');
      }

      const data = await response.json();
      setCorridorLoads(data.data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Koridor yükleri yüklenirken hata:', error);
      }
      setCorridorLoads([]);
    } finally {
      setCorridorLoading(false);
    }
  };

  // Handle driver selection
  const handleDriverClick = async (driverId: string) => {
    setSelectedDriverId(driverId);
    const corridorData = await loadCorridor(driverId);
    setCorridor(corridorData);
    if (corridorData && corridorData.deliveryCity) {
      await loadCorridorLoads(driverId);
    } else {
      setCorridorLoads([]);
    }
  };

  // Handle offer submission
  const handleSubmitOffer = async () => {
    if (!selectedLoadForOffer || !offerPrice || !selectedDriverId) {
      setToastType('error');
      setErrorMessage('Lütfen tüm alanları doldurun');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      setToastType('error');
      setErrorMessage('Geçerli bir fiyat girin');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setSubmittingOffer(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/offers'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: selectedLoadForOffer.id,
          price: price,
          message: offerMessage || '',
          driverId: selectedDriverId, // For auto-assignment
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Teklif gönderilemedi');
      }

      setToastType('success');
      setErrorMessage('Teklif başarıyla gönderildi. 30 dakika içinde yanıt bekleniyor.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);

      setShowOfferModal(false);
      setSelectedLoadForOffer(null);
      setOfferPrice('');
      setOfferMessage('');

      // Reload corridor loads to remove the one we just offered
      if (selectedDriverId) {
        await loadCorridorLoads(selectedDriverId);
      }
    } catch (error: any) {
      setToastType('error');
      setErrorMessage(error?.message || 'Teklif gönderilemedi');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setSubmittingOffer(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadAvailableLoads();
    loadDrivers();
  }, []);

  useEffect(() => {
    setIsLoading(vehiclesLoading || loadsLoading);
  }, [vehiclesLoading, loadsLoading]);

  const totals = useMemo(() => {
    const pickups = routePoints.filter(p => p.type === 'pickup');
    const totalWeight = pickups.reduce((sum, point) => sum + (point.weight || 0), 0);
    const totalEarnings = pickups.reduce((sum, point) => sum + (point.price || 0), 0);

    let totalDistance = 0;
    if (routePoints.length > 1) {
      for (let i = 0; i < routePoints.length - 1; i++) {
        const point1 = routePoints[i];
        const point2 = routePoints[i + 1];
        if (
          point1.coordinates &&
          point2.coordinates &&
          point1.coordinates.lat !== 0 &&
          point2.coordinates.lat !== 0
        ) {
          const R = 6371;
          const dLat = (point2.coordinates.lat - point1.coordinates.lat) * Math.PI / 180;
          const dLon = (point2.coordinates.lng - point1.coordinates.lng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.coordinates.lat * Math.PI / 180) *
              Math.cos(point2.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          totalDistance += R * c;
        }
      }
    }

    return { totalWeight, totalEarnings, totalDistance };
  }, [routePoints]);

  const addLoadToRoute = (load: AvailableLoad, vehicleOverride?: Vehicle | null) => {
    const planKey = getPlanKeyForDriver(load.driver);
    const vehicle = vehicleOverride || selectedVehicle;
    ensurePlanExists(planKey, load.driver, vehicle);
    if (activePlanKey !== planKey) {
      setActivePlanKey(planKey);
    }
    if (!vehicle) return;

    const pickupId = `pickup-${load.id}`;
    const deliveryId = `delivery-${load.id}`;
    const targetPlan = plans.find(p => p.key === planKey);
    const planPoints = targetPlan?.points || [];
    const alreadyAdded = planPoints.some(p => p.id === pickupId || p.id === deliveryId);
    if (alreadyAdded) {
      setToastType('info');
      setErrorMessage('Bu yük zaten rotada');
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
      return;
    }

    const currentRouteWeight = planPoints.reduce(
      (sum, point) => sum + (point.type === 'pickup' ? (point.weight || 0) : 0),
      0
    );
    const currentRouteVolume = planPoints.reduce(
      (sum, point) => sum + (point.type === 'pickup' ? (point.volume || 0) : 0),
      0
    );
    const newWeight = currentRouteWeight + load.weight;
    const newVolume = currentRouteVolume + load.volume;

    // Kapasite kontrolü
    if (newWeight > vehicle.maxWeight) {
      setToastType('error');
      setErrorMessage(
        `Ağırlık limiti aşıldı! Maksimum: ${vehicle.maxWeight}kg, Mevcut: ${newWeight}kg`
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    if (newVolume > vehicle.maxVolume) {
      setToastType('error');
      setErrorMessage(
        `Hacim limiti aşıldı! Maksimum: ${vehicle.maxVolume}m³, Mevcut: ${newVolume}m³`
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    const pickupPoint: RoutePoint = {
      id: `pickup-${load.id}`,
      name: `Yükleme - ${load.title}`,
      address: load.pickupAddress,
      coordinates: { lat: 0, lng: 0 }, // Will be geocoded when address is available
      // Note: For production, use a geocoding service (Google Maps, Mapbox, etc.)
      // This is a placeholder - coordinates should be set via geocoding API
      order: 0,
      type: 'pickup',
      weight: load.weight,
      volume: load.volume,
      price: load.price,
      deadline: load.deadline,
    };

    const deliveryPoint: RoutePoint = {
      id: `delivery-${load.id}`,
      name: `Teslimat - ${load.title}`,
      address: load.deliveryAddress,
      coordinates: { lat: 0, lng: 0 }, // Will be geocoded when address is available
      // Note: For production, use a geocoding service (Google Maps, Mapbox, etc.)
      // This is a placeholder - coordinates should be set via geocoding API
      order: 0,
      type: 'delivery',
      weight: load.weight,
      volume: load.volume,
      price: load.price,
      deadline: load.deadline,
    };

    setPlanVehicle(planKey, vehicle);
    setPlanPoints(planKey, [...planPoints, pickupPoint, deliveryPoint], false);
  };

  useEffect(() => {
    if (!focusShipmentId) return;
    const focusKey = String(focusShipmentId);
    if (didAutoAddLoadRef.current === focusKey || didAutoAddLoadRef.current === `pending:${focusKey}`) return;
    if (vehiclesLoading || loadsLoading) return;

    const targetId = Number(focusShipmentId);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      didAutoAddLoadRef.current = focusKey;
      return;
    }

    didAutoAddLoadRef.current = `pending:${focusKey}`;

    let cancelled = false;
    const run = async () => {
      const token = localStorage.getItem('authToken');

      const pickFromObject = (row: any, ...keys: string[]) => {
        for (const k of keys) {
          if (row && row[k] != null && String(row[k]).trim() !== '') return row[k];
        }
        return null;
      };

      const normalizeTracking = (value: any) => {
        const v = String(value ?? '').trim();
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) return Math.trunc(n).toString();
        const m = v.match(/(\d+)/);
        return m && m[1] ? String(Number(m[1])) : '';
      };

      let load: AvailableLoad | null = availableLoads.find(l => Number(l.id) === targetId) || null;

      let vehicleTypeHint: string | null = null;
      let vehiclePlateHint: string | null = null;

      if (!load || token) {
        try {
          if (token) {
            const res = await fetch(createApiUrl(`/api/shipments/${targetId}`), {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (res.ok) {
              const payload = await res.json().catch(() => ({} as any));
              const row = payload?.data || payload?.shipment || null;

              const vType = pickFromObject(row, 'vehicleType', 'vehicle_type');
              const vPlate = pickFromObject(row, 'vehiclePlate', 'vehicle_plate');
              vehicleTypeHint = vType != null ? String(vType) : null;
              vehiclePlateHint = vPlate != null ? String(vPlate) : null;

              if (!load && row) {
                const pickup =
                  pickFromObject(row, 'pickupCity', 'pickup_city', 'fromCity', 'from_city', 'pickupAddress', 'pickup_address') || '';
                const delivery =
                  pickFromObject(row, 'deliveryCity', 'delivery_city', 'toCity', 'to_city', 'deliveryAddress', 'delivery_address') || '';
                const title = pickFromObject(row, 'title', 'name') || `Yük #${targetId}`;
                const weight = Number(pickFromObject(row, 'weight') || 0);
                const volume = Number(pickFromObject(row, 'volume') || 0);
                const price = Number(pickFromObject(row, 'price', 'agreed_price', 'agreedPrice') || 0);
                const deadline = String(pickFromObject(row, 'deadline', 'deliveryDate', 'delivery_date', 'pickupDate', 'pickup_date') || '');

                const driverId = pickFromObject(row, 'assignedDriverId', 'driver_id', 'driverId', 'driverID');
                const driverName = pickFromObject(row, 'driverName');
                const driverPhone = pickFromObject(row, 'driverPhone');
                const driverEmail = pickFromObject(row, 'driverEmail');

                const shipperName = pickFromObject(row, 'ownerName');
                const shipperPhone = pickFromObject(row, 'ownerPhone');
                const shipperEmail = pickFromObject(row, 'ownerEmail');

                load = {
                  id: targetId,
                  title: String(title),
                  pickupAddress: String(pickup),
                  deliveryAddress: String(delivery),
                  weight: Number.isFinite(weight) ? weight : 0,
                  volume: Number.isFinite(volume) ? volume : 0,
                  price: Number.isFinite(price) ? price : 0,
                  deadline,
                  distance: 0,
                  driver: driverId
                    ? {
                        id: String(driverId),
                        name: String(driverName || ''),
                        phone: String(driverPhone || ''),
                        email: String(driverEmail || ''),
                      }
                    : null,
                  shipper: {
                    name: String(shipperName || 'Gönderici'),
                    phone: String(shipperPhone || ''),
                    email: String(shipperEmail || ''),
                  },
                };

                setAvailableLoads(prev => {
                  const exists = prev.some(p => Number(p.id) === Number(load?.id));
                  if (exists || !load) return prev;
                  return [load, ...prev];
                });
              }
            }
          }
        } catch {
          vehicleTypeHint = null;
          vehiclePlateHint = null;
        }
      }

      if (cancelled) return;

      if (!load) {
        didAutoAddLoadRef.current = focusKey;
        setToastType('info');
        setErrorMessage('Yük bulunamadı (listeye dahil değil).');
        setShowError(true);
        setTimeout(() => setShowError(false), 3500);
        return;
      }

      const resolvedLoad = load;

      setShowLoadDetails(resolvedLoad.id);
      setSearchTerm(normalizeTracking(resolvedLoad.id));
      setWeightFilter('all');
      setPriceFilter('all');
      setDriverFilter(resolvedLoad.driver?.id ? String(resolvedLoad.driver.id) : 'all');

      const deepLinkPlanKey = getPlanKeyForDriver(resolvedLoad.driver);
      ensurePlanExists(deepLinkPlanKey, resolvedLoad.driver, selectedVehicle);
      if (activePlanKey !== deepLinkPlanKey) {
        setActivePlanKey(deepLinkPlanKey);
      }

      try {
        requestAnimationFrame(() => {
          const el = document.getElementById(`load-card-${load?.id}`);
          el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
      } catch {
        // ignore
      }

      const deepLinkPlan = plans.find(p => p.key === deepLinkPlanKey);
      const deepLinkPoints = deepLinkPlan?.points || [];

      if (deepLinkPoints.length > 0) {
        didAutoAddLoadRef.current = focusKey;
        return;
      }

      const currentRouteWeight = deepLinkPoints.reduce(
        (sum, point) => sum + (point.type === 'pickup' ? (point.weight || 0) : 0),
        0
      );
      const currentRouteVolume = deepLinkPoints.reduce(
        (sum, point) => sum + (point.type === 'pickup' ? (point.volume || 0) : 0),
        0
      );

      const fits = (v: Vehicle | null) => {
        if (!v) return false;
        return (
          currentRouteWeight + resolvedLoad.weight <= v.maxWeight &&
          currentRouteVolume + resolvedLoad.volume <= v.maxVolume
        );
      };

      const normalizeText = (value: any) =>
        String(value ?? '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/ı/g, 'i')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c');

      const matchesTypeHint = (v: Vehicle) => {
        if (!vehicleTypeHint) return true;
        const a = normalizeText(v.type);
        const b = normalizeText(vehicleTypeHint);
        if (!a || !b) return true;
        return a === b || a.includes(b) || b.includes(a);
      };

      const plateNorm = vehiclePlateHint ? normalizeText(vehiclePlateHint) : '';
      const matchesPlateHint = (v: Vehicle) => {
        if (!plateNorm) return true;
        const nameNorm = normalizeText(v.name);
        return nameNorm.includes(plateNorm);
      };

      const candidateVehicles = [...vehicles].filter(v => fits(v));
      const hintedVehicles = candidateVehicles.filter(v => matchesTypeHint(v) && matchesPlateHint(v));
      const typeOnlyVehicles = candidateVehicles.filter(v => matchesTypeHint(v));

      const pickBest = (items: Vehicle[]) =>
        items
          .slice()
          .sort((a, b) => (a.maxWeight - b.maxWeight) || (a.maxVolume - b.maxVolume) || (a.id - b.id))[0] || null;

      const preferredVehicle =
        (selectedVehicle && fits(selectedVehicle) && matchesTypeHint(selectedVehicle) && matchesPlateHint(selectedVehicle)
          ? selectedVehicle
          : null) ||
        pickBest(hintedVehicles) ||
        pickBest(typeOnlyVehicles) ||
        pickBest(candidateVehicles) ||
        null;

      if (!preferredVehicle) {
        didAutoAddLoadRef.current = focusKey;
        setToastType('warning');
        setErrorMessage('Uygun araç bulunamadı. Önce bir araç seçin veya aracınızın kapasitesini kontrol edin.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4500);
        return;
      }

      if (preferredVehicle && selectedVehicle?.id !== preferredVehicle.id) {
        setPlanVehicle(deepLinkPlanKey, preferredVehicle);
      }

      addLoadToRoute(resolvedLoad, preferredVehicle);
      didAutoAddLoadRef.current = focusKey;
    };

    run();
    return () => {
      cancelled = true;
      if (didAutoAddLoadRef.current === `pending:${focusKey}`) {
        didAutoAddLoadRef.current = null;
      }
    };
  }, [focusShipmentId, vehiclesLoading, loadsLoading, selectedVehicle, routePoints, availableLoads, addLoadToRoute, vehicles, plans, activePlanKey]);

  const removePointFromRoute = (pointId: string) => {
    const m = String(pointId || '').match(/^(?:pickup|delivery)-(\d+)$/);
    if (m && m[1]) {
      const id = m[1];
      setPlanPoints(
        activePlanKey,
        routePoints.filter(point => point.id !== `pickup-${id}` && point.id !== `delivery-${id}`),
        false
      );
      return;
    }
    setPlanPoints(activePlanKey, routePoints.filter(point => point.id !== pointId), false);
  };

  const optimizeRoute = () => {
    // Basit optimizasyon - gerçekte daha karmaşık algoritma olacak
    const sortedPoints = [...routePoints].sort((a, b) => {
      if (a.type === 'pickup' && b.type === 'delivery') return -1;
      if (a.type === 'delivery' && b.type === 'pickup') return 1;
      return 0;
    });

    setPlanPoints(activePlanKey, sortedPoints, true);
    setToastType('success');
    setErrorMessage('Güzergah optimize edildi');
    setShowError(true);
    setTimeout(() => setShowError(false), 2500);
  };

  const getShipmentIdFromPointId = (pointId: string) => {
    const m = String(pointId || '').match(/^(?:pickup|delivery)-(\d+)$/);
    if (!m || !m[1]) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const calculateSummaryForPoints = (points: RoutePoint[], optimized: boolean) => {
    const pickups = points.filter(p => p.type === 'pickup');
    const totalWeight = pickups.reduce((sum, point) => sum + (point.weight || 0), 0);
    const totalEarnings = pickups.reduce((sum, point) => sum + (point.price || 0), 0);

    let totalDistance = 0;
    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];
        if (
          point1.coordinates &&
          point2.coordinates &&
          point1.coordinates.lat !== 0 &&
          point2.coordinates.lat !== 0
        ) {
          const R = 6371;
          const dLat = (point2.coordinates.lat - point1.coordinates.lat) * Math.PI / 180;
          const dLon = (point2.coordinates.lng - point1.coordinates.lng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.coordinates.lat * Math.PI / 180) *
              Math.cos(point2.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          totalDistance += R * c;
        }
      }
    }

    return {
      totalWeight,
      totalEarnings,
      totalDistance,
      isOptimized: optimized,
    };
  };

  const saveRoutePlan = async () => {
    const nonEmptyPlans = plans.filter(p => Array.isArray(p.points) && p.points.length > 0);
    if (!nonEmptyPlans.length) {
      setToastType('error');
      setErrorMessage('Kaydedilecek rota noktası yok');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setToastType('error');
      setErrorMessage('Oturum bulunamadı');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    try {
      setSavingPlan(true);

      const payloadPlans = nonEmptyPlans
        .map(plan => {
          const normalizedPoints = normalizeRouteOrder(plan.points);
          const shipmentIds = Array.from(
            new Set(normalizedPoints.map(p => getShipmentIdFromPointId(p.id)).filter(Boolean) as number[])
          );
          return {
            shipmentIds,
            points: normalizedPoints.map((p, idx) => ({
              id: p.id,
              order: idx + 1,
              type: p.type,
              address: p.address,
              name: p.name,
              weight: p.weight,
              volume: p.volume,
              price: p.price,
              deadline: p.deadline,
            })),
            vehicle: plan.vehicle
              ? {
                  id: plan.vehicle.id,
                  name: plan.vehicle.name,
                  type: plan.vehicle.type,
                  maxWeight: plan.vehicle.maxWeight,
                  maxVolume: plan.vehicle.maxVolume,
                }
              : null,
            summary: calculateSummaryForPoints(normalizedPoints, Boolean(plan.isOptimized)),
          };
        })
        .filter(p => Array.isArray(p.shipmentIds) && p.shipmentIds.length > 0);

      if (!payloadPlans.length) {
        throw new Error('Kaydedilecek plan üretilemedi');
      }

      const body = { plans: payloadPlans };

      const res = await fetch(createApiUrl('/api/shipments/route-plan'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const resp = await res.json().catch(() => ({}));
      if (!res.ok || !resp.success) {
        throw new Error(resp.message || 'Rota planı kaydedilemedi');
      }

      setToastType('success');
      setErrorMessage(payloadPlans.length > 1 ? 'Rota planları kaydedildi' : 'Rota planı kaydedildi');
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
    } catch (e: any) {
      setToastType('error');
      setErrorMessage(e?.message || 'Rota planı kaydedilemedi');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setSavingPlan(false);
    }
  };

  const driverOptions = useMemo(() => {
    const map = new Map<string, NonNullable<AvailableLoad['driver']>>();
    for (const load of availableLoads) {
      if (load.driver?.id) {
        map.set(String(load.driver.id), load.driver);
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'));
  }, [availableLoads]);

  const filteredLoads = useMemo(() => {
    return availableLoads.filter(load => {
      const s = searchTerm.toLowerCase();
      const idText = String(load.id);
      const trackingText = toTrackingCode(load.id).toLowerCase();
      const matchesSearch =
        !s ||
        idText.includes(s) ||
        trackingText.includes(s) ||
        load.title.toLowerCase().includes(s) ||
        load.pickupAddress.toLowerCase().includes(s) ||
        load.deliveryAddress.toLowerCase().includes(s);

      const matchesWeight =
        weightFilter === 'all' ||
        (weightFilter === 'light' && load.weight < 3000) ||
        (weightFilter === 'medium' && load.weight >= 3000 && load.weight < 7000) ||
        (weightFilter === 'heavy' && load.weight >= 7000);

      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'low' && load.price < 2000) ||
        (priceFilter === 'medium' && load.price >= 2000 && load.price < 4000) ||
        (priceFilter === 'high' && load.price >= 4000);

      const matchesDriver =
        driverFilter === 'all' ||
        (driverFilter === 'unassigned' ? !load.driver?.id : String(load.driver?.id) === driverFilter);

      return matchesSearch && matchesWeight && matchesPrice && matchesDriver;
    });
  }, [availableLoads, searchTerm, weightFilter, priceFilter, driverFilter]);

  const getCapacityPercentage = () => {
    if (!selectedVehicle) return 0;
    return (totals.totalWeight / selectedVehicle.maxWeight) * 100;
  };

  const getVolumePercentage = () => {
    if (!selectedVehicle) return 0;
    const currentVolume = routePoints.reduce((sum, point) => sum + (point.type === 'pickup' ? (point.volume || 0) : 0), 0);
    return (currentVolume / selectedVehicle.maxVolume) * 100;
  };

  if (isLoading) {
    return <LoadingState message='Akıllı rota yükleniyor...' />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Akıllı Rota - YolNext Nakliyeci</title>
        <meta
          name='description'
          content='Akıllı rota planlama ve yol üstü yük arama sistemi'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Route className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Akıllı{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Rota
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Akıllı rota planlama ve yol üstü yük arama sistemi
          </p>
        </div>

        {/* Ana İçerik */}
        <div className='max-w-4xl mx-auto space-y-6'>
          {/* Taşıyıcı Listesi */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center gap-3 mb-4'>
              <Truck className='w-6 h-6 text-slate-700' />
              <h2 className='text-xl font-bold text-slate-900'>Taşıyıcı Seçin</h2>
            </div>
            <p className='text-sm text-slate-600 mb-4'>
              Bir taşıyıcı seçin, sistem otomatik olarak o taşıyıcının güzergahındaki yükleri gösterecek.
            </p>
            {driversLoading ? (
              <div className='flex items-center justify-center py-8'>
                <RefreshCw className='w-5 h-5 animate-spin text-slate-600' />
                <span className='ml-2 text-slate-600'>Taşıyıcılar yükleniyor...</span>
              </div>
            ) : drivers.length === 0 ? (
              <div className='text-center py-8 text-slate-500'>
                <Truck className='w-12 h-12 mx-auto mb-3 text-slate-300' />
                <p className='text-sm'>Henüz taşıyıcı bulunmuyor</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {drivers.map(driver => (
                  <div
                    key={driver.id}
                    onClick={() => handleDriverClick(driver.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDriverId === driver.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='font-semibold text-slate-900 mb-1'>
                          {driver.name || driver.email || driver.phone || driver.id}
                        </div>
                        {driver.code && (
                          <div className='text-xs text-slate-500 mb-1'>Kod: {driver.code}</div>
                        )}
                        {driver.status && (
                          <div className={`text-xs font-medium ${
                            driver.status === 'available' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {driver.status === 'available' ? '✓ Müsait' : '⚠ Meşgul'}
                          </div>
                        )}
                      </div>
                      {corridor && selectedDriverId === driver.id && (
                        <div className='ml-3 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full'>
                          Aktif
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Güzergah Bilgisi */}
          {corridor && selectedDriverId ? (
            <div className='bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 text-white shadow-lg'>
              <div className='flex items-center gap-3 mb-4'>
                <Route className='w-6 h-6 text-white' />
                <h3 className='text-lg font-bold'>Aktif Güzergah</h3>
              </div>
              <div className='bg-white bg-opacity-10 rounded-lg p-4'>
                <div className='flex items-center justify-center gap-3'>
                  <div className='text-center'>
                    <div className='text-xs text-blue-200 mb-1'>Başlangıç</div>
                    <div className='text-lg font-bold'>
                      {corridor.pickupCity || '—'}
                    </div>
                  </div>
                  <ArrowRight className='w-5 h-5 text-white' />
                  <div className='text-center'>
                    <div className='text-xs text-blue-200 mb-1'>Hedef</div>
                    <div className='text-lg font-bold'>
                      {corridor.deliveryCity || '—'}
                    </div>
                  </div>
                </div>
              </div>
              <p className='text-xs text-blue-200 mt-3 text-center'>
                Bu güzergahtaki yükler aşağıda gösteriliyor
              </p>
            </div>
          ) : selectedDriverId && !corridor ? (
            <div className='bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200'>
              <div className='flex items-center gap-3 mb-2'>
                <AlertCircle className='w-6 h-6 text-yellow-600' />
                <h3 className='text-lg font-semibold text-yellow-900'>Güzergah Bulunamadı</h3>
              </div>
              <p className='text-sm text-yellow-800'>
                Bu taşıyıcının henüz aktif bir yükü yok. Taşıyıcıya bir yük atandığında güzergah otomatik olarak oluşacak.
              </p>
            </div>
          ) : null}

          {/* Güzergah Yükleri */}
          {corridor && selectedDriverId ? (
            <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
              <div className='flex items-center gap-3 mb-4'>
                <Package className='w-6 h-6 text-slate-700' />
                <h2 className='text-xl font-bold text-slate-900'>Güzergah Yükleri</h2>
              </div>
              <p className='text-sm text-slate-600 mb-4'>
                Bu güzergahtaki yüklere teklif vererek taşıyıcınızın dolu gidip dolu gelmesini sağlayın.
              </p>
              {corridorLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <RefreshCw className='w-5 h-5 animate-spin text-slate-600' />
                  <span className='ml-3 text-slate-600'>Yükler yükleniyor...</span>
                </div>
              ) : corridorLoads.length === 0 ? (
                <div className='text-center py-8 text-slate-500'>
                  <Package className='w-12 h-12 mx-auto mb-3 text-slate-300' />
                  <p className='text-base font-medium mb-1'>Bu güzergahta yük bulunamadı</p>
                  <p className='text-sm'>Başka bir taşıyıcı seçebilir veya daha sonra tekrar kontrol edebilirsiniz.</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {corridorLoads.map(load => (
                    <div
                      key={load.id}
                      className='p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <h4 className='font-medium text-slate-900'>{load.title}</h4>
                        <button
                          onClick={() => {
                            setSelectedLoadForOffer(load);
                            setOfferPrice(load.price > 0 ? String(load.price) : '');
                            setShowOfferModal(true);
                          }}
                          className='px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors'
                        >
                          Teklif Ver
                        </button>
                      </div>
                      <div className='space-y-2 text-sm text-slate-600'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='w-4 h-4' />
                          <span>{load.pickupAddress} → {load.deliveryAddress}</span>
                        </div>
                        <div className='flex items-center gap-4'>
                          <span className='flex items-center gap-1'>
                            <Weight className='w-4 h-4' />
                            {load.weight.toLocaleString()}kg
                          </span>
                          <span className='flex items-center gap-1'>
                            <DollarSign className='w-4 h-4' />₺
                            {load.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !selectedDriverId ? (
            <div className='bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-300 text-center'>
              <Truck className='w-16 h-16 mx-auto mb-4 text-slate-400' />
              <p className='text-slate-600 font-medium'>
                Bir taşıyıcı seçin, güzergah yükleri görüntülenecek
              </p>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Offer Modal */}
      {showOfferModal && selectedLoadForOffer && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl p-6 max-w-md w-full shadow-2xl'>
            <h3 className='text-xl font-bold text-slate-900 mb-4'>Teklif Ver</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Yük
                </label>
                <div className='p-3 bg-slate-50 rounded-lg text-sm'>
                  <div className='font-medium'>{selectedLoadForOffer.title}</div>
                  <div className='text-slate-600 mt-1'>
                    {selectedLoadForOffer.pickupAddress} → {selectedLoadForOffer.deliveryAddress}
                  </div>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Fiyat (₺) *
                </label>
                <input
                  type='number'
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Fiyat girin'
                  min='0'
                  step='0.01'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Mesaj (Opsiyonel)
                </label>
                <textarea
                  value={offerMessage}
                  onChange={e => setOfferMessage(e.target.value)}
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  rows={3}
                  placeholder='Göndericiye mesajınız...'
                />
              </div>
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800'>
                <div className='flex items-center gap-2 mb-1'>
                  <Clock className='w-4 h-4' />
                  <span className='font-medium'>Teklif Süresi</span>
                </div>
                <p>Bu teklif 30 dakika içinde yanıtlanmalıdır. Aksi halde otomatik olarak iptal edilir.</p>
              </div>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    setSelectedLoadForOffer(null);
                    setOfferPrice('');
                    setOfferMessage('');
                  }}
                  className='flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors'
                  disabled={submittingOffer}
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitOffer}
                  disabled={submittingOffer || !offerPrice}
                  className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors'
                >
                  {submittingOffer ? 'Gönderiliyor...' : 'Teklif Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showError && errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setShowError(false)}
          type={toastType}
        />
      )}
    </div>
  );
}
