import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ArrowLeft, CheckCircle, User, Building2, Truck, Package } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  fields: OnboardingField[];
}

interface OnboardingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'user-type',
    title: 'Kullanıcı Türünüzü Seçin',
    description: 'Hangi tür kullanıcı olduğunuzu belirleyin',
    icon: User,
    fields: [
      {
        name: 'userType',
        label: 'Kullanıcı Türü',
        type: 'select',
        required: true,
        options: ['individual', 'corporate', 'nakliyeci', 'tasiyici']
      }
    ]
  },
  {
    id: 'personal-info',
    title: 'Kişisel Bilgileriniz',
    description: 'Temel bilgilerinizi girin',
    icon: User,
    fields: [
      {
        name: 'name',
        label: 'Ad Soyad',
        type: 'text',
        required: true,
        placeholder: 'Adınızı ve soyadınızı girin'
      },
      {
        name: 'email',
        label: 'E-posta',
        type: 'email',
        required: true,
        placeholder: 'ornek@email.com'
      },
      {
        name: 'phone',
        label: 'Telefon',
        type: 'text',
        required: true,
        placeholder: '0555 123 45 67'
      }
    ]
  },
  {
    id: 'business-info',
    title: 'İş Bilgileriniz',
    description: 'İşletme bilgilerinizi girin',
    icon: Building2,
    fields: [
      {
        name: 'companyName',
        label: 'Şirket Adı',
        type: 'text',
        required: true,
        placeholder: 'Şirket adınızı girin'
      },
      {
        name: 'industry',
        label: 'Sektör',
        type: 'select',
        required: true,
        options: ['Perakende', 'Lojistik', 'E-ticaret', 'İmalat', 'Diğer']
      },
      {
        name: 'companySize',
        label: 'Şirket Büyüklüğü',
        type: 'select',
        required: true,
        options: ['1-10', '11-50', '51-200', '201-1000', '1000+']
      }
    ]
  },
  {
    id: 'vehicle-info',
    title: 'Araç Bilgileriniz',
    description: 'Araç bilgilerinizi girin',
    icon: Truck,
    fields: [
      {
        name: 'vehicleType',
        label: 'Araç Türü',
        type: 'select',
        required: true,
        options: ['Kamyon', 'Kamyonet', 'Tır', 'Minibüs', 'Diğer']
      },
      {
        name: 'vehicleCapacity',
        label: 'Yük Kapasitesi',
        type: 'text',
        required: true,
        placeholder: 'Örn: 5 ton'
      },
      {
        name: 'licensePlate',
        label: 'Plaka',
        type: 'text',
        required: true,
        placeholder: '34 ABC 123'
      }
    ]
  },
  {
    id: 'preferences',
    title: 'Tercihleriniz',
    description: 'Hizmet tercihlerinizi belirleyin',
    icon: Package,
    fields: [
      {
        name: 'serviceAreas',
        label: 'Hizmet Bölgeleri',
        type: 'textarea',
        required: true,
        placeholder: 'Hangi şehirlerde hizmet veriyorsunuz?'
      },
      {
        name: 'workingHours',
        label: 'Çalışma Saatleri',
        type: 'text',
        required: true,
        placeholder: 'Örn: 08:00 - 18:00'
      }
    ]
  }
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Onboarding completed:', formData);
    // Here you would typically save the data and redirect
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Hoş Geldiniz!
          </h1>
          <p className="text-gray-600 mb-6">
            Onboarding süreciniz tamamlandı. Artık YolNet'i kullanmaya başlayabilirsiniz.
          </p>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  const currentStepData = onboardingSteps[currentStep];
  const isStepValid = currentStepData.fields.every(field => 
    field.required ? formData[field.name] : true
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Hoş Geldiniz - YolNet</title>
        <meta name="description" content="YolNet'e hoş geldiniz. Onboarding sürecini tamamlayın." />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Adım {currentStep + 1} / {onboardingSteps.length}
            </span>
            <span className="text-sm text-gray-500">
              %{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <currentStepData.icon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          <div className="space-y-6">
            {currentStepData.fields.map((field, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {field.options?.map((option: string, optionIndex: number) => (
                      <option key={optionIndex} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              Geri
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === onboardingSteps.length - 1 ? 'Tamamla' : 'İleri'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}