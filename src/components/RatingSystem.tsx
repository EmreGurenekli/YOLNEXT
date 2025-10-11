import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, User, Calendar } from 'lucide-react';

interface Rating {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  notHelpful: number;
}

interface RatingSystemProps {
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
  onAddRating?: (rating: number, comment: string) => void;
  canRate?: boolean;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  ratings,
  averageRating,
  totalRatings,
  onAddRating,
  canRate = false
}) => {
  const [showAddRating, setShowAddRating] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  const handleStarClick = (rating: number) => {
    setNewRating(rating);
  };

  const handleSubmitRating = () => {
    if (onAddRating && newRating > 0) {
      onAddRating(newRating, newComment);
      setNewRating(0);
      setNewComment('');
      setShowAddRating(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => handleStarClick(star) : undefined}
            className={`w-5 h-5 ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Mükemmel';
    if (rating >= 4) return 'Çok İyi';
    if (rating >= 3) return 'İyi';
    if (rating >= 2) return 'Orta';
    return 'Kötü';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Rating Özeti */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">{getRatingText(averageRating)}</div>
          </div>
          <div>
            {renderStars(Math.round(averageRating))}
            <div className="text-sm text-gray-600 mt-1">
              {totalRatings} değerlendirme
            </div>
          </div>
        </div>
        
        {canRate && (
          <button
            onClick={() => setShowAddRating(!showAddRating)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Değerlendir
          </button>
        )}
      </div>

      {/* Rating Dağılımı */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Değerlendirme Dağılımı</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratings.filter(r => Math.round(r.rating) === star).length;
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">{star}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Yeni Değerlendirme Formu */}
      {showAddRating && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Değerlendirmenizi Ekleyin</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puanınız
              </label>
              {renderStars(newRating, true)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yorumunuz
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Deneyiminizi paylaşın..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmitRating}
                disabled={newRating === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Gönder
              </button>
              <button
                onClick={() => setShowAddRating(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Değerlendirmeler Listesi */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Değerlendirmeler</h3>
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{rating.userName}</div>
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating)}
                      <span className="text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(rating.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    {rating.helpful}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    {rating.notHelpful}
                  </button>
                </div>
              </div>
              {rating.comment && (
                <p className="text-gray-700 ml-11">{rating.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingSystem;

