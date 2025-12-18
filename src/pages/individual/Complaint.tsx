import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle,
  FileText,
  Camera,
  Upload,
  Send,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { createApiUrl } from '../../config/api';

interface ComplaintData {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  attachments: File[];
}

const Complaint: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [complaintData, setComplaintData] = useState<ComplaintData>({
    type: '',
    title: '',
    description: '',
    priority: 'medium',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const complaintTypes = [
    { id: 'delivery_delay', name: 'Teslimat Gecikmesi', icon: '⏰' },
    { id: 'damage', name: 'Hasarlı Teslimat', icon: '📦' },
    { id: 'communication', name: 'İletişim Sorunu', icon: '💬' },
    { id: 'payment', name: 'Ödeme Sorunu', icon: '💳' },
    { id: 'service', name: 'Hizmet Kalitesi', icon: '⭐' },
    { id: 'other', name: 'Diğer', icon: '❓' },
  ];

  const handleInputChange = (field: keyof ComplaintData, value: any) => {
    setComplaintData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setComplaintData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setComplaintData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('type', complaintData.type);
      formData.append('title', complaintData.title);
      formData.append('description', complaintData.description);
      formData.append('priority', complaintData.priority);
      if (shipmentId) formData.append('shipmentId', shipmentId);

      complaintData.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await fetch(createApiUrl('/api/complaints'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (response.ok) {
        navigate('/individual/my-shipments?complaint=submitted');
      } else {
        throw new Error('Complaint submission failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Düşük';
      case 'medium':
        return 'Orta';
      case 'high':
        return 'Yüksek';
      default:
        return 'Orta';
    }
  };

  return (
    <>
      <Helmet>
        <title>Şikayet - YolNext</title>
      </Helmet>

      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='mb-8'>
            <button
              onClick={() => navigate(-1)}
              className='flex items-center text-gray-600 hover:text-gray-800 mb-4'
            >
              <ArrowLeft className='w-5 h-5 mr-2' />
              Geri Dön
            </button>
            <h1 className='text-3xl font-bold text-gray-900'>Şikayet</h1>
            <p className='text-gray-600 mt-2'>
              Sorununuzu detaylı bir şekilde bildirin
            </p>
          </div>

          <div className='bg-white rounded-2xl shadow-lg p-8'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              {/* Complaint Type */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Şikayet Türü *
                </label>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  {complaintTypes.map(type => (
                    <button
                      key={type.id}
                      type='button'
                      onClick={() => handleInputChange('type', type.id)}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        complaintData.type === type.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className='text-2xl mb-2'>{type.icon}</div>
                      <div className='font-medium text-sm'>{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Öncelik Seviyesi
                </label>
                <div className='flex space-x-4'>
                  {['low', 'medium', 'high'].map(priority => (
                    <button
                      key={priority}
                      type='button'
                      onClick={() => handleInputChange('priority', priority)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        complaintData.priority === priority
                          ? getPriorityColor(priority)
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {getPriorityLabel(priority)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Başlık *
                </label>
                <input
                  type='text'
                  value={complaintData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className='w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Şikayetinizi kısaca özetleyin'
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Detaylı Açıklama *
                </label>
                <textarea
                  value={complaintData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  className='w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                  rows={6}
                  placeholder='Sorununuzu detaylı bir şekilde açıklayın. Ne zaman, nerede, nasıl oldu? Hangi beklentileriniz karşılanmadı?'
                  required
                />
              </div>

              {/* Attachments */}
              <div>
                <label className='block text-lg font-semibold text-gray-900 mb-4'>
                  Ek Dosyalar (Opsiyonel)
                </label>
                <div className='border-2 border-dashed border-gray-300 rounded-xl p-6 text-center'>
                  <input
                    type='file'
                    multiple
                    accept='image/*,.pdf,.doc,.docx'
                    onChange={handleFileUpload}
                    className='hidden'
                    id='file-upload'
                  />
                  <label
                    htmlFor='file-upload'
                    className='cursor-pointer flex flex-col items-center'
                  >
                    <Upload className='w-12 h-12 text-gray-400 mb-4' />
                    <span className='text-gray-600 font-medium'>
                      Dosya Yükle
                    </span>
                    <span className='text-gray-500 text-sm'>
                      Resim, PDF, Word dosyası
                    </span>
                  </label>
                </div>

                {/* File List */}
                {complaintData.attachments.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    {complaintData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center'>
                          <FileText className='w-5 h-5 text-gray-500 mr-2' />
                          <span className='text-gray-700'>{file.name}</span>
                          <span className='text-gray-500 text-sm ml-2'>
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeAttachment(index)}
                          className='text-red-500 hover:text-red-700'
                        >
                          <XCircle className='w-5 h-5' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  disabled={
                    isSubmitting ||
                    !complaintData.type ||
                    !complaintData.title ||
                    !complaintData.description
                  }
                  className='flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                >
                  {isSubmitting ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className='w-5 h-5' />
                      Şikayeti Gönder
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

          {/* Help Info */}
          <div className='mt-8 bg-blue-50 rounded-xl p-6'>
            <h3 className='text-lg font-semibold text-blue-900 mb-4'>
              Şikayet Süreci
            </h3>
            <div className='space-y-2 text-sm text-blue-800'>
              <div className='flex items-center'>
                <CheckCircle className='w-4 h-4 text-blue-600 mr-2' />
                <span>Şikayetiniz 24 saat içinde incelenir</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='w-4 h-4 text-blue-600 mr-2' />
                <span>Gerekirse ek bilgi istenebilir</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='w-4 h-4 text-blue-600 mr-2' />
                <span>Çözüm süreci hakkında bilgilendirilirsiniz</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='w-4 h-4 text-blue-600 mr-2' />
                <span>Gizlilik ve güvenlik önceliğimizdir</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Complaint;
