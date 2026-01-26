import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircle,
  ArrowRight,
  X,
  User,
  Building2,
  Truck,
  Package,
  MapPin,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

interface SimpleOnboardingProps {
  userType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  onComplete: () => void;
}

const SimpleOnboarding: React.FC<SimpleOnboardingProps> = ({
  userType,
  onComplete,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const perUserStorageKey = useMemo(() => {
    const userId = user?.id ? String((user as any).id) : 'anonymous';
    return `onboardingCompleted:${userId}:${userType}`;
  }, [user, userType]);

  const perUserPendingKey = useMemo(() => {
    const userId = user?.id ? String((user as any).id) : 'anonymous';
    return `onboardingPending:${userId}:${userType}`;
  }, [user, userType]);

  const getSteps = () => {
    const baseSteps = [
      {
        id: 1,
        title: 'Hoş Geldiniz! 🎉',
        description: `${user?.firstName || 'Kullanıcı'}, YolNext platformuna hoş geldiniz!`,
        icon: <CheckCircle className='w-12 h-12 text-green-500' />,
        content: (
          <div className='space-y-4 text-center'>
            <p className='text-lg text-slate-600'>
              Hesabınız başarıyla oluşturuldu. Platformu kullanmaya başlamak için birkaç önemli bilgi:
            </p>
          </div>
        ),
      },
    ];

    if (userType === 'individual') {
      baseSteps.push(
        {
          id: 2,
          title: 'Gönderi Oluşturun',
          description: 'İlk gönderinizi oluşturarak başlayın',
          icon: <Package className='w-12 h-12 text-blue-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-blue-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  Nasıl Çalışır?
                </h3>
                <ol className='list-decimal list-inside space-y-2 text-slate-700'>
                  <li>Gönderi oluşturun (nereden, nereye, ne taşınacak)</li>
                  <li>Nakliyeciler size teklif verecek</li>
                  <li>En uygun teklifi seçin</li>
                  <li>Gönderinizi takip edin ve mesajlaşın</li>
                </ol>
              </div>
            </div>
          ),
        },
        {
          id: 3,
          title: 'Teklifleri İnceleyin',
          description: 'Gelen teklifleri karşılaştırın ve seçin',
          icon: <TrendingUp className='w-12 h-12 text-green-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-green-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  İpuçları
                </h3>
                <ul className='list-disc list-inside space-y-2 text-slate-700'>
                  <li>Teklifleri fiyat, süre ve nakliyeci puanına göre değerlendirin</li>
                  <li>Nakliyeci profillerini inceleyin</li>
                  <li>Mesajlaşma özelliğini kullanarak detayları öğrenin</li>
                </ul>
              </div>
            </div>
          ),
        }
      );
    } else if (userType === 'corporate') {
      baseSteps.push(
        {
          id: 2,
          title: 'Kurumsal Gönderi Oluşturun',
          description: 'İhtiyacınıza uygun gönderiyi yayınlayın',
          icon: <Building2 className='w-12 h-12 text-blue-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-blue-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  Kurumsal Akış
                </h3>
                <ol className='list-decimal list-inside space-y-2 text-slate-700'>
                  <li>Gönderi detaylarını girin (kategori/ölçüler)</li>
                  <li>Adres ve tarih bilgilerini ekleyin</li>
                  <li>Yayınlayın ve teklifleri toplayın</li>
                  <li>Seçiminizi yapın ve süreci yönetin</li>
                </ol>
              </div>
            </div>
          ),
        },
        {
          id: 3,
          title: 'Teklif & İletişim',
          description: 'Teklifleri yönetip nakliyecilerle iletişim kurun',
          icon: <MessageSquare className='w-12 h-12 text-green-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-green-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  İpuçları
                </h3>
                <ul className='list-disc list-inside space-y-2 text-slate-700'>
                  <li>Teklifleri SLA/süre, fiyat ve güven puanına göre kıyaslayın</li>
                  <li>Gerekirse mesajlaşma ile netleştirin</li>
                  <li>Seçimden sonra gönderiyi takip ekranından yönetin</li>
                </ul>
              </div>
            </div>
          ),
        }
      );
    } else if (userType === 'nakliyeci') {
      baseSteps.push(
        {
          id: 2,
          title: 'Gönderileri Keşfedin',
          description: 'Size uygun gönderileri bulun ve teklif verin',
          icon: <Package className='w-12 h-12 text-blue-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-blue-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  Nasıl Çalışır?
                </h3>
                <ol className='list-decimal list-inside space-y-2 text-slate-700'>
                  <li>Size uygun gönderileri bulun</li>
                  <li>Rekabetçi teklifler verin</li>
                  <li>Teklifiniz kabul edilirse taşıyıcı atayın</li>
                  <li>Gönderiyi takip edin ve tamamlayın</li>
                </ol>
                <div className='mt-4 text-sm text-slate-600'>
                  <span className='inline-flex items-center gap-2'>
                    <MapPin className='w-4 h-4 text-slate-700' />
                    Not: Şehir kuralı gereği, genelde sadece kendi şehrinizdeki gönderilere teklif verebilirsiniz.
                  </span>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 3,
          title: 'Taşıyıcı Ekleyin',
          description: 'Taşıyıcı kodları ile ekleyin',
          icon: <Truck className='w-12 h-12 text-purple-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-purple-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  Taşıyıcı Yönetimi
                </h3>
                <ul className='list-disc list-inside space-y-2 text-slate-700'>
                  <li>Taşıyıcılar sayfasından taşıyıcı ekleyebilirsiniz</li>
                  <li>Taşıyıcıların kodlarını kullanarak ekleyin</li>
                  <li>Taşıyıcılarınızı gönderilere atayabilirsiniz</li>
                </ul>
              </div>
            </div>
          ),
        }
      );
    } else if (userType === 'tasiyici') {
      baseSteps.push(
        {
          id: 2,
          title: 'Taşıyıcı Kodunuz',
          description: 'Nakliyeciler sizi bu kod ile ekleyecek',
          icon: <Truck className='w-12 h-12 text-blue-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-blue-50 rounded-xl p-6 text-center'>
                <div className='text-3xl font-bold text-blue-600 mb-2'>
                  {user?.driverCode || 'DRV-XXX-XXX'}
                </div>
                <p className='text-slate-600'>
                  Bu kodunuzu nakliyecilerle paylaşın. Sizi eklemek için bu kodu kullanacaklar.
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 3,
          title: 'İş Fırsatları',
          description: 'Nakliyecilerden iş alın',
          icon: <TrendingUp className='w-12 h-12 text-green-500' />,
          content: (
            <div className='space-y-4'>
              <div className='bg-green-50 rounded-xl p-6'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  Nasıl Çalışır?
                </h3>
                <ul className='list-disc list-inside space-y-2 text-slate-700'>
                  <li>Nakliyeciler sizi ekledikten sonra size iş atayacaklar</li>
                  <li>Atanan işleri kabul edebilir veya reddedebilirsiniz</li>
                  <li>Gönderileri tamamladıkça puanınız artacak</li>
                </ul>
              </div>
            </div>
          ),
        }
      );
    }

    baseSteps.push({
      id: baseSteps.length + 1,
      title: 'Hazırsınız! 🚀',
      description: 'Artık platformu kullanmaya başlayabilirsiniz',
      icon: <CheckCircle className='w-12 h-12 text-green-500' />,
      content: (
        <div className='space-y-4 text-center'>
          <p className='text-lg text-slate-600'>
            Tüm önemli bilgileri öğrendiniz. Şimdi dashboard'unuza gidip işlemlerinize başlayabilirsiniz!
          </p>
        </div>
      ),
    });

    return baseSteps;
  };

  const steps = getSteps();
  const currentStepData = steps.find(step => step.id === currentStep);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as completed
    try {
      // Legacy key (backward compatibility)
      localStorage.setItem('onboardingCompleted', 'true');
      // Role + user specific key (prevents cross-panel collisions)
      localStorage.setItem(perUserStorageKey, 'true');
      // Only show after first registration; consume the "pending" flag
      localStorage.removeItem(perUserPendingKey);
    } catch {
      // ignore
    }
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between'>
          <div>
            <h2 className='text-lg sm:text-xl font-bold text-slate-900'>Hızlı Başlangıç</h2>
            <p className='text-xs sm:text-sm text-slate-600'>Adım {currentStep} / {steps.length}</p>
          </div>
          <button
            onClick={handleSkip}
            className='text-slate-400 hover:text-slate-600 transition-colors p-1'
            aria-label='Kapat'
          >
            <X className='w-5 h-5 sm:w-6 sm:h-6' />
          </button>
        </div>

        {/* Progress Bar */}
        <div className='px-3 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200'>
          <div className='flex items-center gap-1 sm:gap-2'>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1.5 sm:h-2 rounded-full transition-colors ${
                  step.id <= currentStep
                    ? 'bg-gradient-to-r from-slate-800 to-blue-900'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          <div className='text-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4'>
              <div className='scale-75 sm:scale-100'>{currentStepData?.icon}</div>
            </div>
            <h3 className='text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2'>
              {currentStepData?.title}
            </h3>
            <p className='text-sm sm:text-base text-slate-600'>{currentStepData?.description}</p>
          </div>
          <div className='mb-4 sm:mb-6 text-sm sm:text-base'>{currentStepData?.content}</div>

          {/* Navigation */}
          <div className='flex items-center justify-between pt-4 sm:pt-6 border-t border-slate-200 gap-2 sm:gap-4'>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className='flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base'
            >
              <ArrowRight className='w-3 h-3 sm:w-4 sm:h-4 rotate-180' />
              <span className="hidden sm:inline">Geri</span>
            </button>
            {currentStep === steps.length ? (
              <button
                onClick={handleComplete}
                className='flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:shadow-lg transition-all text-sm sm:text-base'
              >
                <span className="hidden sm:inline">Başlayalım</span>
                <span className="sm:hidden">Başla</span>
                <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5' />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className='flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:shadow-lg transition-all text-sm sm:text-base'
              >
                <span className="hidden sm:inline">İleri</span>
                <span className="sm:hidden">İleri</span>
                <ArrowRight className='w-4 h-4 sm:w-5 sm:h-5' />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboarding;










