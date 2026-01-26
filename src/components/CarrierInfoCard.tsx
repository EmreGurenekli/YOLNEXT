import React from 'react';
import { Star, MessageCircle, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import UserTrustRating from './UserTrustRating';

// Kompakt TrustScore Badge Component
interface TrustScoreBadgeProps {
  averageRating: number;
  totalRatings: number;
  isVerified: boolean;
  completedJobs: number;
  successRate: number;
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  averageRating,
  totalRatings,
  isVerified,
  completedJobs,
  successRate,
}) => {
  const calculateTrustScore = (): number => {
    let score = 0;
    if (isVerified) score += 20;
    if (totalRatings > 0 && averageRating > 0) {
      const ratingScore = (averageRating / 5) * 30;
      const volumeBonus = Math.min(totalRatings / 10, 10);
      score += ratingScore + volumeBonus;
    }
    if (completedJobs > 0) {
      const experienceScore = Math.min(completedJobs / 10, 20);
      const successBonus = (successRate / 100) * 5;
      score += experienceScore + successBonus;
    }
    score += 5;
    return Math.min(Math.round(score), 100);
  };

  const trustScore = calculateTrustScore();
  
  const getTrustLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'Çok Güvenilir', color: 'text-green-700 bg-green-100 border-green-200' };
    if (score >= 60) return { level: 'Güvenilir', color: 'text-blue-700 bg-blue-100 border-blue-200' };
    if (score >= 40) return { level: 'Orta Güven', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
    if (score >= 20) return { level: 'Düşük Güven', color: 'text-orange-700 bg-orange-100 border-orange-200' };
    return { level: 'Yeni', color: 'text-gray-700 bg-gray-100 border-gray-200' };
  };

  const trustInfo = getTrustLevel(trustScore);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${trustInfo.color}`}>
      {trustScore >= 80 && <CheckCircle className="w-3 h-3" />}
      {trustScore >= 40 && trustScore < 80 && <Shield className="w-3 h-3" />}
      {trustScore < 40 && <AlertTriangle className="w-3 h-3" />}
      <span className="font-semibold">{trustInfo.level}</span>
    </div>
  );
};

interface CarrierInfoCardProps {
  carrierId?: string;
  carrierName: string;
  companyName?: string;
  carrierRating?: number;
  carrierReviews?: number;
  carrierVerified?: boolean;
  successRate?: number;
  completedJobs?: number;
  variant?: 'compact' | 'detailed';
  showMessaging?: boolean;
  messagingEnabled?: boolean;
  onMessageClick?: () => void;
  className?: string;
}

const CarrierInfoCard: React.FC<CarrierInfoCardProps> = ({
  carrierId,
  carrierName,
  companyName,
  carrierRating = 0,
  carrierReviews = 0,
  carrierVerified = false,
  successRate = 0,
  completedJobs = 0,
  variant = 'compact',
  showMessaging = false,
  messagingEnabled = false,
  onMessageClick,
  className = '',
}) => {
  // Avatar: İlk harf (fotoğraf yok)
  const getInitials = (name: string, company?: string): string => {
    if (company && company.trim()) {
      return company.trim().charAt(0).toUpperCase();
    }
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
      return name.trim().charAt(0).toUpperCase();
    }
    return 'N';
  };

  const displayName = companyName && companyName.trim() ? companyName.trim() : (carrierName && carrierName.trim() ? carrierName.trim() : 'Nakliyeci');
  const initials = getInitials(carrierName, companyName);

  // Puan gösterimi: ⭐⭐⭐⭐⭐ formatında
  const renderStars = (rating: number): React.ReactNode => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-current" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 text-yellow-500 fill-current opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-slate-300" />
        ))}
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 truncate">
              {displayName}
            </span>
            {carrierVerified && (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {carrierRating > 0 ? (
              <>
                {renderStars(carrierRating)}
                <span className="text-slate-600 font-medium">
                  {carrierRating.toFixed(1)}
                </span>
                {carrierReviews > 0 && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">
                      {carrierReviews} {carrierReviews === 1 ? 'yorum' : 'yorum'}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-slate-500">Henüz değerlendirilmemiş</span>
            )}
          </div>
        </div>

        {/* TrustScore Badge (Kompakt) - Sadece badge göster */}
        {carrierId && (carrierRating > 0 || carrierReviews > 0) && (
          <div className="flex-shrink-0">
            <TrustScoreBadge
              averageRating={carrierRating}
              totalRatings={carrierReviews}
              isVerified={carrierVerified}
              completedJobs={completedJobs}
              successRate={successRate}
            />
          </div>
        )}

        {/* Mesajlaş Butonu */}
        {showMessaging && (
          <button
            onClick={onMessageClick}
            disabled={!messagingEnabled}
            title={!messagingEnabled ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
            className={`flex-shrink-0 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${
              messagingEnabled
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Mesajlaş
          </button>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 ${className}`}>
      <div className="flex items-start gap-6 mb-6">
        {/* Avatar */}
        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-xl flex-shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-2xl font-bold text-slate-900">
              {displayName}
            </h4>
            {carrierVerified && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                <Shield className="w-4 h-4" />
                Doğrulanmış
              </div>
            )}
          </div>

          {/* Puan ve Yorumlar */}
          {carrierRating > 0 || carrierReviews > 0 ? (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {renderStars(carrierRating)}
                <span className="text-lg font-bold text-slate-900">
                  {carrierRating.toFixed(1)}
                </span>
              </div>
              {carrierReviews > 0 && (
                <span className="text-slate-600">
                  ({carrierReviews} {carrierReviews === 1 ? 'değerlendirme' : 'değerlendirme'})
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-500 mb-4">Henüz değerlendirme yapılmamış</div>
          )}

          {/* TrustScore */}
          {carrierId && (
            <div className="mb-4">
              <UserTrustRating
                userId={carrierId}
                userType="nakliyeci"
                averageRating={carrierRating}
                totalRatings={carrierReviews}
                isVerified={carrierVerified}
                completedJobs={completedJobs}
                successRate={successRate}
                className="!p-3"
              />
            </div>
          )}

          {/* Mesajlaş Butonu */}
          {showMessaging && (
            <button
              onClick={onMessageClick}
              disabled={!messagingEnabled}
              title={!messagingEnabled ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 ${
                messagingEnabled
                  ? 'bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              Mesajlaş
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarrierInfoCard;












