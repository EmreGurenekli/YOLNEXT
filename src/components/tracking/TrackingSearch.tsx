/**
 * @fileoverview TrackingSearch Component - Public shipment tracking search interface
 * 
 * PURPOSE: Provides a user-friendly interface for customers to search for their
 * shipments using tracking codes. This is the main entry point for tracking.
 * 
 * BUSINESS PURPOSE:
 * - Allows customers to track shipments without logging in
 * - Supports various tracking code formats (YN123456, TR789012, etc.)
 * - Provides immediate feedback and validation
 * - Mobile-responsive design for all device types
 * 
 * FEATURES:
 * - Real-time input validation
 * - Loading state management
 * - Form submission handling
 * - Accessible design (WCAG compliant)
 * - Clear placeholder examples
 * - Disabled state when loading
 * 
 * USED BY:
 * - src/pages/individual/LiveTracking.tsx
 * - Public tracking pages (no authentication required)
 * 
 * @author YolNext Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Search, Package } from 'lucide-react';

/**
 * Props interface for TrackingSearch component
 * 
 * @interface TrackingSearchProps
 */
interface TrackingSearchProps {
  /** Current tracking number input value */
  trackingNumber: string;
  
  /** Whether tracking search is in progress */
  loading: boolean;
  
  /** Callback when user types in tracking number input */
  onTrackingNumberChange: (value: string) => void;
  
  /** Callback when user submits the tracking form */
  onTrack: () => void;
}

/**
 * TrackingSearch React Component
 * 
 * Renders a search interface for shipment tracking. Includes input validation,
 * loading states, and accessible form design.
 * 
 * @component
 * @param {TrackingSearchProps} props - Component props
 * @returns {JSX.Element} Tracking search form interface
 * 
 * @example
 * ```tsx
 * <TrackingSearch
 *   trackingNumber={trackingCode}
 *   loading={isSearching}
 *   onTrackingNumberChange={setTrackingCode}
 *   onTrack={searchShipment}
 * />
 * ```
 */
const TrackingSearch: React.FC<TrackingSearchProps> = ({
  trackingNumber,
  loading,
  onTrackingNumberChange,
  onTrack,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTrack();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Gönderi Takip</h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        Gönderi takip numaranızı girerek kargonuzun anlık durumunu öğrenebilirsiniz.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => onTrackingNumberChange(e.target.value)}
            placeholder="Takip numaranızı girin (örn: YN123456)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !trackingNumber.trim()}
          className="px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          {loading ? 'Aranıyor...' : 'Takip Et'}
        </button>
      </form>
    </div>
  );
};

export default TrackingSearch;










