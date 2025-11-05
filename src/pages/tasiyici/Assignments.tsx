import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/format';
import {
  Package,
  CheckCircle,
  X,
  Clock,
  MapPin,
  Weight,
  Calendar,
  Truck,
  Route,
  AlertCircle,
} from 'lucide-react';
import { createApiUrl } from '../../config/api';

interface Assignment {
  id: string;
  shipment_id: string;
  title: string;
  from_city: string;
  to_city: string;
  pickup_date: string;
  delivery_date: string;
  weight: number;
  assignment_type: 'main' | 'additional';
  status: 'pending' | 'accepted' | 'rejected' | 'active' | 'completed';
  assigned_at: string;
  accepted_at?: string;
  completed_at?: string;
}

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl('/api/carrier-assignments'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl(`/api/carrier-assignments/${assignmentId}/accept`),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Atama kabul edildi!');
        loadAssignments();
      } else {
        const error = await response.json();
        alert(error.error || 'Atama kabul edilemedi');
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
      alert('Atama kabul edilemedi');
    }
  };

  const handleRejectAssignment = async (assignmentId: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl(`/api/carrier-assignments/${assignmentId}/reject`),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Atama reddedildi!');
        loadAssignments();
      } else {
        const error = await response.json();
        alert(error.error || 'Atama reddedilemedi');
      }
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      alert('Atama reddedilemedi');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'accepted':
        return <CheckCircle className='w-4 h-4' />;
      case 'rejected':
        return <X className='w-4 h-4' />;
      case 'active':
        return <Truck className='w-4 h-4' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  // Using format helpers from utils/format.ts

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Atamalar - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Atamalar</h1>
          <p className='text-gray-600 mt-2'>Size atanan gönderileri yönetin</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
                <Clock className='w-6 h-6 text-yellow-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Bekleyen</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {assignments.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Kabul Edilen
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {assignments.filter(a => a.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Truck className='w-6 h-6 text-blue-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Aktif</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {assignments.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-gray-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Toplam</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {assignments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Atama Listesi
            </h2>
          </div>

          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : assignments.length === 0 ? (
            <div className='text-center py-12'>
              <Package className='w-12 h-12 mx-auto text-gray-300 mb-4' />
              <p className='text-gray-500'>Henüz atama yok</p>
              <p className='text-sm text-gray-400'>
                Size atanan gönderiler burada görünecek
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {assignments.map(assignment => (
                <div key={assignment.id} className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                        {getStatusIcon(assignment.status)}
                      </div>

                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h3 className='text-lg font-medium text-gray-900'>
                            {assignment.title}
                          </h3>
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
                        </div>

                        <div className='flex items-center gap-6 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='w-4 h-4' />
                            <span>
                              {assignment.from_city} → {assignment.to_city}
                            </span>
                          </div>

                          <div className='flex items-center gap-1'>
                            <Calendar className='w-4 h-4' />
                            <span>
                              {formatDate(assignment.pickup_date)} -{' '}
                              {formatDate(assignment.delivery_date)}
                            </span>
                          </div>

                          <div className='flex items-center gap-1'>
                            <Weight className='w-4 h-4' />
                            <span>{assignment.weight}kg</span>
                          </div>
                        </div>

                        <div className='mt-2 text-xs text-gray-500'>
                          Atandı: {formatDateTime(assignment.assigned_at)}
                          {assignment.accepted_at && (
                            <span className='ml-4'>
                              Kabul: {formatDateTime(assignment.accepted_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}
                      >
                        {getStatusText(assignment.status)}
                      </span>

                      {assignment.status === 'pending' && (
                        <div className='flex gap-2'>
                          <button
                            onClick={() =>
                              handleAcceptAssignment(assignment.id)
                            }
                            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2'
                          >
                            <CheckCircle className='w-4 h-4' />
                            Kabul Et
                          </button>
                          <button
                            onClick={() =>
                              handleRejectAssignment(assignment.id)
                            }
                            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2'
                          >
                            <X className='w-4 h-4' />
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
