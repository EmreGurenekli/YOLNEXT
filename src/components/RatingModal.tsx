import React, { useState, useEffect } from 'react';
import { X, Star, User, MessageSquare, ThumbsUp } from 'lucide-react';
import { createApiUrl } from '../config/api';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratedUser: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  currentUser: {
    id: string;
    name: string;
  };
  shipmentId?: string;
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  rater_name: string;
  created_at: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  ratedUser,
  currentUser,
  shipmentId,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRatings, setExistingRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ratedUser.id) {
      loadExistingRatings();
    }
  }, [isOpen, ratedUser.id]);

  const loadExistingRatings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl(`/api/ratings/${ratedUser.id}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingRatings(data);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(createApiUrl('/api/ratings'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rated_user_id: ratedUser.id,
          rating,
          comment: comment.trim(),
          shipment_id: shipmentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExistingRatings(prev => [
          {
            id: data.data.id,
            rating: data.data.rating,
            comment: data.data.comment,
            rater_name: currentUser.name,
            created_at: data.data.created_at,
          },
          ...prev,
        ]);
        setRating(0);
        setComment('');
        alert('Değerlendirme başarıyla gönderildi!');
      } else {
        const error = await response.json();
        alert(error.error || 'Değerlendirme gönderilemedi');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Değerlendirme gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center'>
              <Star className='w-5 h-5 text-yellow-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Değerlendirme</h2>
              <p className='text-sm text-gray-600'>
                {ratedUser.name} - {ratedUser.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        <div className='flex-1 overflow-hidden flex'>
          {/* Rating Form */}
          <div className='flex-1 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Değerlendirme Yap
            </h3>

            <form onSubmit={handleSubmitRating} className='space-y-6'>
              {/* Star Rating */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>
                  Puan
                </label>
                <div className='flex gap-2'>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type='button'
                      onClick={() => setRating(star)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        star <= rating
                          ? 'text-yellow-400 bg-yellow-50'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className='w-6 h-6 fill-current' />
                    </button>
                  ))}
                </div>
                <p className='text-sm text-gray-500 mt-2'>
                  {rating === 0 && 'Puan seçin'}
                  {rating === 1 && 'Çok kötü'}
                  {rating === 2 && 'Kötü'}
                  {rating === 3 && 'Orta'}
                  {rating === 4 && 'İyi'}
                  {rating === 5 && 'Mükemmel'}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Yorum (Opsiyonel)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500'
                  rows={4}
                  placeholder='Deneyiminizi paylaşın...'
                />
              </div>

              <button
                type='submit'
                disabled={rating === 0 || isSubmitting}
                className='w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {isSubmitting ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <>
                    <ThumbsUp className='w-4 h-4' />
                    Değerlendirme Gönder
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing Ratings */}
          <div className='w-80 border-l border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Önceki Değerlendirmeler
            </h3>

            {isLoading ? (
              <div className='flex justify-center items-center h-32'>
                <div className='w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin' />
              </div>
            ) : existingRatings.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <Star className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                <p>Henüz değerlendirme yok</p>
              </div>
            ) : (
              <div className='space-y-4 max-h-96 overflow-y-auto'>
                {existingRatings.map(rating => (
                  <div key={rating.id} className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='flex'>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className='text-sm text-gray-500'>
                        {formatDateTime(rating.created_at)}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className='text-sm text-gray-700 mb-2'>
                        {rating.comment}
                      </p>
                    )}
                    <div className='flex items-center gap-1 text-xs text-gray-500'>
                      <User className='w-3 h-3' />
                      <span>{rating.rater_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
