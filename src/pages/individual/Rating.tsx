import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

interface RatingData {
  rating: number;
  comment: string;
  categories: {
    punctuality: number;
    communication: number;
    service: number;
    value: number;
  };
}

const Rating: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [ratingData, setRatingData] = useState<RatingData>({
    rating: 0,
    comment: '',
    categories: {
      punctuality: 0,
      communication: 0,
      service: 0,
      value: 0,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (rating: number) => {
    setRatingData(prev => ({ ...prev, rating }));
  };

  const handleCategoryChange = (
    category: keyof RatingData['categories'],
    rating: number
  ) => {
    setRatingData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: rating,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // API call to submit rating
      const response = await fetch(`/api/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          shipmentId,
          ...ratingData,
        }),
      });

      if (response.ok) {
        navigate('/individual/my-shipments?rated=true');
      } else {
        throw new Error('Rating submission failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    onRatingChange,
    size = 'w-6 h-6',
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: string;
  }) => {
    return (
      <div className='flex space-x-1'>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type='button'
            onClick={() => onRatingChange(star)}
            className={`${size} transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <Star className='w-full h-full fill-current' />
          </button>
        ))}
      </div>
    );
  };

  const categoryLabels = {
    punctuality: 'Zamanında Teslimat',
    communication: 'İletişim',
    service: 'Hizmet Kalitesi',
    value: 'Fiyat/Değer',
  };

  return (
    <>
      <Helmet>
        <title>Değerlendirme - YolNext</title>
      </Helmet>

      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='mb-8'>
            <button
              onClick={() => navigate(-1)}
              className='flex items-center text-gray-600 hover:text-gray-800 mb-4'
            >
              <ArrowLeft className='w-5 h-5 mr-2' />
              Geri Dön
            </button>
            <h1 className='text-3xl font-bold text-gray-900'>Değerlendirme</h1>
            <p className='text-gray-600 mt-2'>
              Gönderinizi değerlendirin ve deneyiminizi paylaşın
            </p>
          </div>

          <div className='bg-white rounded-2xl shadow-lg p-8'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              {/* Overall Rating */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Genel Değerlendirme *
                </label>
                <div className='flex items-center space-x-4'>
                  <StarRating
                    rating={ratingData.rating}
                    onRatingChange={handleRatingChange}
                    size='w-8 h-8'
                  />
                  <span className='text-gray-600'>
                    {ratingData.rating === 0
                      ? 'Değerlendirme seçin'
                      : ratingData.rating === 1
                        ? 'Çok Kötü'
                        : ratingData.rating === 2
                          ? 'Kötü'
                          : ratingData.rating === 3
                            ? 'Orta'
                            : ratingData.rating === 4
                              ? 'İyi'
                              : 'Mükemmel'}
                  </span>
                </div>
              </div>

              {/* Category Ratings */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Detaylı Değerlendirme
                </label>
                <div className='space-y-6'>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className='flex items-center justify-between'
                    >
                      <span className='text-gray-700 font-medium'>{label}</span>
                      <StarRating
                        rating={
                          ratingData.categories[
                            key as keyof RatingData['categories']
                          ]
                        }
                        onRatingChange={rating =>
                          handleCategoryChange(
                            key as keyof RatingData['categories'],
                            rating
                          )
                        }
                        size='w-5 h-5'
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Yorumunuz
                </label>
                <textarea
                  value={ratingData.comment}
                  onChange={e =>
                    setRatingData(prev => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className='w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                  rows={4}
                  placeholder='Deneyiminizi paylaşın (opsiyonel)'
                />
              </div>

              {/* Quick Feedback */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Hızlı Geri Bildirim
                </label>
                <div className='grid grid-cols-2 gap-4'>
                  <button
                    type='button'
                    className='flex items-center justify-center p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-colors'
                  >
                    <ThumbsUp className='w-6 h-6 text-green-600 mr-2' />
                    <span className='text-green-700 font-medium'>
                      Memnun Kaldım
                    </span>
                  </button>
                  <button
                    type='button'
                    className='flex items-center justify-center p-4 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors'
                  >
                    <ThumbsDown className='w-6 h-6 text-red-600 mr-2' />
                    <span className='text-red-700 font-medium'>
                      Memnun Kalmadım
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className='flex space-x-4'>
                <button
                  type='button'
                  onClick={() => navigate(-1)}
                  className='flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                >
                  İptal
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting || ratingData.rating === 0}
                  className='flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                >
                  {isSubmitting ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className='w-5 h-5' />
                      Değerlendirmeyi Gönder
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
                  <div className='flex items-center'>
                    <XCircle className='w-5 h-5 text-red-500 mr-2' />
                    <span className='text-red-700'>{error}</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Rating Guidelines */}
          <div className='mt-8 bg-blue-50 rounded-xl p-6'>
            <h3 className='text-lg font-semibold text-blue-900 mb-4'>
              Değerlendirme Rehberi
            </h3>
            <div className='space-y-2 text-sm text-blue-800'>
              <div className='flex items-center'>
                <Star className='w-4 h-4 text-yellow-500 mr-2' />
                <span>
                  5 yıldız: Mükemmel hizmet, kesinlikle tavsiye ederim
                </span>
              </div>
              <div className='flex items-center'>
                <Star className='w-4 h-4 text-yellow-500 mr-2' />
                <span>4 yıldız: İyi hizmet, genel olarak memnunum</span>
              </div>
              <div className='flex items-center'>
                <Star className='w-4 h-4 text-yellow-500 mr-2' />
                <span>3 yıldız: Orta seviye hizmet, iyileştirilebilir</span>
              </div>
              <div className='flex items-center'>
                <Star className='w-4 h-4 text-yellow-500 mr-2' />
                <span>2 yıldız: Kötü hizmet, memnun değilim</span>
              </div>
              <div className='flex items-center'>
                <Star className='w-4 h-4 text-yellow-500 mr-2' />
                <span>1 yıldız: Çok kötü hizmet, asla tavsiye etmem</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rating;
