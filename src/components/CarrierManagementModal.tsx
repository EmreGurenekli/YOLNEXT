import React, { useState, useEffect } from 'react';
import { createApiUrl } from '../config/api';
import {
  X,
  Truck,
  MapPin,
  Package,
  Plus,
  Check,
  X as XIcon,
  Clock,
  Weight,
} from 'lucide-react';

interface CarrierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrier: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    vehicle_type: string;
    max_capacity: number;
    current_capacity: number;
    active_assignments: number;
  };
  nakliyeciId: string;
}

interface LoadSuggestion {
  id: string;
  title: string;
  from_city: string;
  to_city: string;
  pickup_date: string;
  delivery_date: string;
  weight: number;
  sender_name: string;
}

interface CarrierAssignment {
  id: string;
  shipment_id: string;
  title: string;
  from_city: string;
  to_city: string;
  pickup_date: string;
  delivery_date: string;
  weight: number;
  assignment_type: 'main' | 'additional';
  status: string;
}

const CarrierManagementModal: React.FC<CarrierManagementModalProps> = ({
  isOpen,
  onClose,
  carrier,
  nakliyeciId,
}) => {
  const [assignments, setAssignments] = useState<CarrierAssignment[]>([]);
  const [suggestions, setSuggestions] = useState<LoadSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'route' | 'suggestions'>('route');

  useEffect(() => {
    if (isOpen && carrier.id) {
      loadCarrierData();
    }
  }, [isOpen, carrier.id]);

  const loadCarrierData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      // Load current route
      const routeResponse = await fetch(
        createApiUrl(`/api/carriers/${carrier.id}/route`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        setAssignments(routeData);
      }

      // Load suggestions
      const suggestionsResponse = await fetch(
        createApiUrl(`/api/carriers/${carrier.id}/suggestions`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData);
      }
    } catch (error) {
      console.error('Taşıyıcı verileri yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignLoad = async (shipmentId: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl(`/api/carriers/${carrier.id}/assign`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipment_id: shipmentId,
            assignment_type: 'additional',
          }),
        }
      );

      if (response.ok) {
        alert('Yük başarıyla atandı! Taşıyıcı onayını bekliyor.');
        loadCarrierData(); // Reload data
      } else {
        const error = await response.json();
        alert(error.error || 'Yük atanamadı');
      }
    } catch (error) {
      console.error('Yük atanırken hata:', error);
      alert('Yük atanamadı');
    }
  };

  const getCapacityPercentage = () => {
    return Math.round((carrier.current_capacity / carrier.max_capacity) * 100);
  };

  const getCapacityColor = () => {
    const percentage = getCapacityPercentage();
    if (percentage < 50) return 'text-green-600 bg-green-100';
    if (percentage < 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
              <Truck className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {carrier.full_name}
              </h2>
              <p className='text-sm text-gray-600'>
                {carrier.vehicle_type} • {carrier.email}
              </p>
              <div className='flex items-center gap-4 mt-1'>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCapacityColor()}`}
                >
                  Kapasite: {getCapacityPercentage()}%
                </span>
                <span className='text-xs text-gray-500'>
                  {carrier.current_capacity}kg / {carrier.max_capacity}kg
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'route'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mevcut Rota
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'suggestions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yük Önerileri
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : activeTab === 'route' ? (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Mevcut Gönderiler
              </h3>

              {assignments.length === 0 ? (
                <div className='text-center text-gray-500 py-8'>
                  <Package className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p>Henüz atanmış gönderi yok</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {assignments.map((assignment, index) => (
                    <div
                      key={assignment.id}
                      className='bg-gray-50 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-sm font-medium text-blue-600'>
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              {assignment.title}
                            </h4>
                            <p className='text-sm text-gray-600'>
                              {assignment.from_city} → {assignment.to_city}
                            </p>
                            <div className='flex items-center gap-4 mt-1'>
                              <span className='text-xs text-gray-500'>
                                <Clock className='w-3 h-3 inline mr-1' />
                                {formatDate(assignment.pickup_date)} -{' '}
                                {formatDate(assignment.delivery_date)}
                              </span>
                              <span className='text-xs text-gray-500'>
                                <Weight className='w-3 h-3 inline mr-1' />
                                {assignment.weight}kg
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.assignment_type === 'main'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {assignment.assignment_type === 'main'
                              ? 'Ana Gönderi'
                              : 'Ek Yük'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : assignment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {assignment.status === 'accepted'
                              ? 'Kabul Edildi'
                              : assignment.status === 'pending'
                                ? 'Beklemede'
                                : 'Reddedildi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Önerilen Yükler
              </h3>

              {suggestions.length === 0 ? (
                <div className='text-center text-gray-500 py-8'>
                  <Package className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p>Uygun yük önerisi yok</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className='bg-gray-50 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                            <Plus className='w-4 h-4 text-green-600' />
                          </div>
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              {suggestion.title}
                            </h4>
                            <p className='text-sm text-gray-600'>
                              {suggestion.from_city} → {suggestion.to_city}
                            </p>
                            <div className='flex items-center gap-4 mt-1'>
                              <span className='text-xs text-gray-500'>
                                <Clock className='w-3 h-3 inline mr-1' />
                                {formatDate(suggestion.pickup_date)} -{' '}
                                {formatDate(suggestion.delivery_date)}
                              </span>
                              <span className='text-xs text-gray-500'>
                                <Weight className='w-3 h-3 inline mr-1' />
                                {suggestion.weight}kg
                              </span>
                              <span className='text-xs text-gray-500'>
                                Gönderen: {suggestion.sender_name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignLoad(suggestion.id)}
                          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
                        >
                          <Plus className='w-4 h-4' />
                          Yük Ata
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarrierManagementModal;
