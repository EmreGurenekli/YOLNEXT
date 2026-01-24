import React from 'react';
import { Star, Shield, CheckCircle, AlertTriangle, User } from 'lucide-react';

/**
 * BUSINESS COMPONENT: User trust and reliability display
 * 
 * PURPOSE: Shows user's credibility score to build marketplace trust
 * Critical for user decisions when choosing carriers or accepting offers
 * 
 * TRUST FACTORS:
 * - Average rating from completed jobs (1-5 stars)
 * - Total number of ratings (social proof)
 * - Verification status (KYC/business verification)
 * - Completed job count (experience indicator)
 * - Success rate (reliability percentage)
 * 
 * BUSINESS IMPACT: Higher trust scores lead to more job opportunities and better pricing
 */
interface UserTrustDisplayProps {
  userId: string;              // Platform user identifier
  userType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';  // User role in marketplace
  averageRating?: number;      // Average rating from completed jobs (1-5 stars)
  totalRatings?: number;       // Total number of ratings received (social proof)
  isVerified?: boolean;        // KYC/business verification status (trust indicator)
  completedJobs?: number;      // Number of successfully completed jobs (experience)
  successRate?: number;        // Percentage of jobs completed without issues (0-100)
  className?: string;          // Custom CSS classes for styling
}

const UserTrustRating: React.FC<UserTrustDisplayProps> = ({
  userId,
  userType,
  averageRating = 0,
  totalRatings = 0,
  isVerified = false,
  completedJobs = 0,
  successRate = 0,
  className = '',
}) => {
  // 🔒 Trust Score Algorithm - Multiple factors
  const calculateTrustScore = (): number => {
    let score = 0;
    
    // Base verification bonus
    if (isVerified) score += 20;
    
    // Rating contribution (0-40 points)
    if (totalRatings > 0 && averageRating > 0) {
      const ratingScore = (averageRating / 5) * 30;
      const volumeBonus = Math.min(totalRatings / 10, 10); // Max 10 points for volume
      score += ratingScore + volumeBonus;
    }
    
    // Experience contribution (0-25 points)
    if (completedJobs > 0) {
      const experienceScore = Math.min(completedJobs / 10, 20); // Max 20 points
      const successBonus = (successRate / 100) * 5; // Max 5 points
      score += experienceScore + successBonus;
    }
    
    // Activity bonus (0-15 points) - users with recent activity
    score += 5; // Base activity score for registered users
    
    return Math.min(Math.round(score), 100);
  };

  const trustScore = calculateTrustScore();
  
  const getTrustLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 80) return { 
      level: 'Çok Güvenilir', 
      color: 'text-green-700 bg-green-100 border-green-200', 
      description: 'Yüksek deneyim ve mükemmel geçmiş' 
    };
    if (score >= 60) return { 
      level: 'Güvenilir', 
      color: 'text-blue-700 bg-blue-100 border-blue-200', 
      description: 'İyi deneyim ve olumlu geçmiş' 
    };
    if (score >= 40) return { 
      level: 'Orta Güven', 
      color: 'text-yellow-700 bg-yellow-100 border-yellow-200', 
      description: 'Sınırlı deneyim, dikkatli değerlendirin' 
    };
    if (score >= 20) return { 
      level: 'Düşük Güven', 
      color: 'text-orange-700 bg-orange-100 border-orange-200', 
      description: 'Az deneyim, extra dikkat gerekli' 
    };
    return { 
      level: 'Yeni Kullanıcı', 
      color: 'text-gray-700 bg-gray-100 border-gray-200', 
      description: 'Henüz yeterli işlem geçmişi yok' 
    };
  };

  const trustInfo = getTrustLevel(trustScore);
  
  const getUserTypeLabel = (type: string): string => {
    switch (type) {
      case 'individual': return 'Bireysel Gönderici';
      case 'corporate': return 'Kurumsal Gönderici';
      case 'nakliyeci': return 'Nakliyeci';
      case 'tasiyici': return 'Taşıyıcı';
      default: return 'Kullanıcı';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
      {/* Trust Score Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-600" />
          <span className="font-semibold text-slate-900">Güven Skoru</span>
        </div>
      </div>

      {/* Trust Level Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${trustInfo.color} mb-3`}>
        {trustScore >= 80 && <CheckCircle className="w-4 h-4" />}
        {trustScore >= 40 && trustScore < 80 && <Shield className="w-4 h-4" />}
        {trustScore < 40 && <AlertTriangle className="w-4 h-4" />}
        {trustInfo.level}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
        <User className="w-4 h-4" />
        <span>{getUserTypeLabel(userType)}</span>
        {isVerified && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </div>

      {/* Trust Factors */}
      <div className="space-y-2 text-sm">
        {/* Rating Information */}
        {totalRatings > 0 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>{averageRating.toFixed(1)}/5</span>
            </div>
            <span className="text-slate-500">({totalRatings} değerlendirme)</span>
          </div>
        ) : (
          <div className="text-slate-500">Henüz değerlendirme yok</div>
        )}

        {/* Experience Information */}
        {completedJobs > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Tamamlanan İş</span>
            <span className="font-medium">{completedJobs}</span>
          </div>
        )}

        {/* Success Rate */}
        {successRate > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Başarı Oranı</span>
            <span className="font-medium">%{successRate}</span>
          </div>
        )}
      </div>

      {/* Trust Description */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500 leading-relaxed">
          {trustInfo.description}
        </p>
      </div>
    </div>
  );
};

export default UserTrustRating;











