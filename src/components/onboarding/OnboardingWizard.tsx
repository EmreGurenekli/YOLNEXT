import { useState } from 'react';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Truck,
  Package,
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userType, setUserType] = useState<string>('');

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Hoş Geldiniz!',
      description:
        'YolNext platformuna hoş geldiniz. Size en uygun hesap türünü seçin.',
      icon: <User className='w-8 h-8' />,
      content: (
        <div className='space-y-6'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Hesap Türünüzü Seçin
            </h2>
            <p className='text-gray-600'>
              Size en uygun hesap türünü seçerek başlayın
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <button
              onClick={() => setUserType('individual')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                userType === 'individual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className='flex items-center space-x-4'>
                <User className='w-8 h-8 text-blue-600' />
                <div className='text-left'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Bireysel
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Kişisel gönderileriniz için
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setUserType('corporate')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                userType === 'corporate'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className='flex items-center space-x-4'>
                <Building2 className='w-8 h-8 text-green-600' />
                <div className='text-left'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Kurumsal
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Şirket gönderileriniz için
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setUserType('carrier')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                userType === 'carrier'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className='flex items-center space-x-4'>
                <Truck className='w-8 h-8 text-purple-600' />
                <div className='text-left'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Nakliyeci
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Taşımacılık hizmeti verin
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setUserType('driver')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                userType === 'driver'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className='flex items-center space-x-4'>
                <Package className='w-8 h-8 text-orange-600' />
                <div className='text-left'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Taşıyıcı
                  </h3>
                  <p className='text-sm text-gray-600'>Bireysel taşımacılık</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Profil Bilgileri',
      description: 'Temel bilgilerinizi girin',
      icon: <User className='w-8 h-8' />,
      content: (
        <div className='space-y-6'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Profil Bilgileriniz
            </h2>
            <p className='text-gray-600'>
              Hesabınızı oluşturmak için gerekli bilgileri girin
            </p>
          </div>

          <div className='max-w-md mx-auto space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Ad Soyad
              </label>
              <input
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Adınızı ve soyadınızı girin'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                E-posta
              </label>
              <input
                type='email'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='ornek@email.com'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Telefon
              </label>
              <input
                type='tel'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='+90 5XX XXX XX XX'
              />
            </div>

            {userType === 'corporate' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Şirket Adı
                </label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Şirket adınızı girin'
                />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Hesap Oluşturuldu',
      description: 'Hesabınız başarıyla oluşturuldu!',
      icon: <CheckCircle className='w-8 h-8' />,
      content: (
        <div className='text-center space-y-6'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
            <CheckCircle className='w-10 h-10 text-green-600' />
          </div>

          <div>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Tebrikler!
            </h2>
            <p className='text-gray-600 mb-6'>
              {userType === 'individual' &&
                'Bireysel hesabınız başarıyla oluşturuldu.'}
              {userType === 'corporate' &&
                'Kurumsal hesabınız başarıyla oluşturuldu.'}
              {userType === 'carrier' &&
                'Nakliyeci hesabınız başarıyla oluşturuldu.'}
              {userType === 'driver' &&
                'Taşıyıcı hesabınız başarıyla oluşturuldu.'}
            </p>
            <p className='text-sm text-gray-500'>
              Artık platformumuzun tüm özelliklerini kullanabilirsiniz.
            </p>
          </div>

          <div className='space-y-4'>
            <button className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-900 hover:to-slate-800 transition-colors'>
              Dashboard'a Git
            </button>
            <button className='w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors'>
              Profili Düzenle
            </button>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Onboarding tamamlandı, dashboard'a yönlendir
    window.location.href = '/dashboard';
  };

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='max-w-4xl w-full'>
        {/* Progress Bar */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            {steps.map((step, index) => (
              <div key={step.id} className='flex items-center'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className='w-6 h-6' />
                  ) : (
                    <span className='font-semibold'>{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className='bg-white rounded-2xl shadow-xl p-8'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              {currentStepData?.icon}
            </div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              {currentStepData?.title}
            </h1>
            <p className='text-gray-600'>{currentStepData?.description}</p>
          </div>

          {currentStepData?.content}

          {/* Navigation */}
          <div className='flex justify-between mt-8 pt-6 border-t border-gray-200'>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className='flex items-center px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Geri
            </button>

            {currentStep === steps.length ? (
              <button
                onClick={handleComplete}
                className='flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
              >
                Tamamla
                <CheckCircle className='w-4 h-4 ml-2' />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !userType}
                className='flex items-center px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                İleri
                <ArrowRight className='w-4 h-4 ml-2' />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;











