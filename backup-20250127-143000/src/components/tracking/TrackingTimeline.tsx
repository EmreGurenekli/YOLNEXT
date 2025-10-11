import React from 'react';
import { CheckCircle, Clock, AlertCircle, Truck, MapPin, Package } from 'lucide-react';

interface TrackingEvent {
  id: string;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  title: string;
  description: string;
  timestamp: Date;
  location?: string;
  icon?: React.ComponentType<any>;
}

interface TrackingTimelineProps {
  updates: TrackingEvent[];
  currentStatus: string;
}

export default function TrackingTimeline({ updates, currentStatus }: TrackingTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in-progress':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-gray-400 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'in-progress':
        return <Clock className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventIcon = (event: TrackingEvent) => {
    if (event.icon) {
      return <event.icon className="w-5 h-5" />;
    }

    switch (event.title.toLowerCase()) {
      case 'gönderi alındı':
        return <Package className="w-5 h-5" />;
      case 'yola çıktı':
        return <Truck className="w-5 h-5" />;
      case 'teslim edildi':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Truck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Takip Durumu</h2>
          <p className="text-sm text-gray-600">Gönderi durumu: {currentStatus}</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Events */}
        <div className="space-y-6">
          {updates.map((event, index) => (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(event.status)}`}>
                {getEventIcon(event)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <span className="text-sm text-gray-500">
                    {event.timestamp.toLocaleDateString()} {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{event.description}</p>
                {event.location && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">Mevcut Durum</h4>
            <p className="text-sm text-blue-700">{currentStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}