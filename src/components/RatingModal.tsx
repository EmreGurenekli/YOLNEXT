import React, { useState, useEffect } from 'react';
import { X, Star, User, MessageSquare, ThumbsUp, CheckCircle } from 'lucide-react';
import { createApiUrl } from '../config/api';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (payload: { shipmentId?: string; rating: number; comment: string; id?: string }) => void;
  mode?: 'rate' | 'view';
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
  onSubmitted,
  mode = 'rate',
  ratedUser,
  currentUser,
  shipmentId,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRatings, setExistingRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && ratedUser.id) {
      loadExistingRatings();
      setError('');
      setSuccess('');
    }
  }, [isOpen, ratedUser.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

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
        // Backend returns { success: true, data: { ratings: [...], averageRating: ..., totalRatings: ... } }
        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const rows = payload?.ratings || data?.ratings || data || [];
        setExistingRatings(Array.isArray(rows) ? rows : []);
        setAverageRating(Number(payload?.averageRating || 0) || 0);
        setTotalRatings(Number(payload?.totalRatings || (Array.isArray(rows) ? rows.length : 0)) || 0);
      }
    } catch (error) {
      console.error('Değerlendirmeler yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setError('');
    setSuccess('');

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Oturum açmanız gerekiyor');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(createApiUrl('/api/ratings'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rated_user_id: ratedUser.id,
          ratedUserId: ratedUser.id,
          rating,
          comment: comment.trim(),
          shipment_id: shipmentId,
          shipmentId: shipmentId,
        }),
      });

        const data = await response.json();

      if (response.ok && data.success !== false) {
        setExistingRatings(prev => [
          {
            id: data.data?.id || Date.now().toString(),
            rating: data.data?.rating || rating,
            comment: data.data?.comment || comment.trim(),
            rater_name: currentUser.name,
            created_at: data.data?.created_at || new Date().toISOString(),
          },
          ...prev,
        ]);

        if (onSubmitted) {
          onSubmitted({
            shipmentId,
            rating: Number(data.data?.rating || rating) || rating,
            comment: String(data.data?.comment || comment.trim()),
            id: data.data?.id,
          });
        }

        setRating(0);
        setComment('');
        setSuccess('Değerlendirme başarıyla gönderildi!');
        // Modal'ı 2 saniye sonra kapat
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorMessage = data.message || data.error || 'Değerlendirme gönderilemedi';
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Değerlendirme gönderilirken hata:', error);
      setError(error.message || 'Değerlendirme gönderilirken bir hata oluştu');
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
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
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
              {totalRatings > 0 && (
                <p className='text-xs text-gray-500 mt-1'>
                  Ortalama: {Number.isFinite(averageRating) ? averageRating.toFixed(1) : '0.0'} / 5 • {totalRatings} yorum
                </p>
              )}
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
          {mode !== 'view' && (
            <div className='flex-1 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Değerlendirme Yap
              </h3>

              <form onSubmit={handleSubmitRating} className='space-y-6'>
                {error && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3'>
                    <div className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5'>
                      <X className='w-5 h-5' />
                    </div>
                    <p className='text-sm text-red-800 flex-1'>{error}</p>
                    <button
                      type='button'
                      onClick={() => setError('')}
                      className='text-red-600 hover:text-red-800'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                )}

                {success && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3'>
                    <div className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5'>
                      <ThumbsUp className='w-5 h-5' />
                    </div>
                    <p className='text-sm text-green-800 flex-1'>{success}</p>
                  </div>
                )}

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
                    {rating === 0 && 'Değerlendirme puanınızı seçiniz'}
                    {rating === 1 && 'Yetersiz hizmet kalitesi'}
                    {rating === 2 && 'Geliştirilmesi gereken hizmet'}
                    {rating === 3 && 'Standart hizmet seviyesi'}
                    {rating === 4 && 'Kaliteli hizmet deneyimi'}
                    {rating === 5 && 'Olağanüstü hizmet mükemmeliyeti'}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Yorum (Opsiyonel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500'
                    rows={4}
                    placeholder='Hizmet deneyiminizi ve önerilerinizi bizimle paylaşınız...'
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
          )}

          <div className={`${mode === 'view' ? 'flex-1' : 'w-80 border-l border-gray-200'} p-6`}>
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
                {existingRatings.map((rating, idx) => (
                  <div
                    key={`${String(rating.id || '')}-${String((rating as any).created_at || (rating as any).createdAt || '')}-${String((rating as any).rater_id || (rating as any).raterId || '')}-${idx}`}
                    className='bg-gray-50 rounded-lg p-4'
                  >
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











