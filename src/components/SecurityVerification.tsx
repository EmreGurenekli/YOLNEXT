import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Camera, Upload, FileText, User } from 'lucide-react';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'in_review';
  required: boolean;
  documents?: string[];
}

interface SecurityVerificationProps {
  userType: 'individual' | 'corporate' | 'carrier' | 'logistics';
  onComplete: () => void;
}

const SecurityVerification: React.FC<SecurityVerificationProps> = ({ userType, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File[] }>({});
  const [isUploading, setIsUploading] = useState(false);

  const getVerificationSteps = (): VerificationStep[] => {
    const baseSteps: VerificationStep[] = [
      {
        id: 'identity',
        title: 'Kimlik Doğrulama',
        description: 'Kimlik belgenizi yükleyin',
        status: 'pending',
        required: true,
        documents: ['Kimlik kartı ön yüz', 'Kimlik kartı arka yüz']
      },
      {
        id: 'phone',
        title: 'Telefon Doğrulama',
        description: 'Telefon numaranızı doğrulayın',
        status: 'pending',
        required: true
      },
      {
        id: 'email',
        title: 'E-posta Doğrulama',
        description: 'E-posta adresinizi doğrulayın',
        status: 'verified',
        required: true
      }
    ];

    if (userType === 'corporate') {
      baseSteps.push(
        {
          id: 'company',
          title: 'Şirket Belgesi',
          description: 'Ticaret sicil belgesi yükleyin',
          status: 'pending',
          required: true,
          documents: ['Ticaret sicil belgesi', 'Vergi levhası']
        },
        {
          id: 'tax',
          title: 'Vergi Belgesi',
          description: 'Vergi mükellefiyet belgesi yükleyin',
          status: 'pending',
          required: true,
          documents: ['Vergi mükellefiyet belgesi']
        }
      );
    }

    if (userType === 'carrier') {
      baseSteps.push(
        {
          id: 'license',
          title: 'Nakliye Ruhsatı',
          description: 'Nakliye ruhsatınızı yükleyin',
          status: 'pending',
          required: true,
          documents: ['Nakliye ruhsatı', 'Sigorta belgesi']
        },
        {
          id: 'vehicle',
          title: 'Araç Belgesi',
          description: 'Araç ruhsatını yükleyin',
          status: 'pending',
          required: true,
          documents: ['Araç ruhsatı', 'Muayene belgesi']
        }
      );
    }

    if (userType === 'logistics') {
      baseSteps.push(
        {
          id: 'driver_license',
          title: 'Sürücü Belgesi',
          description: 'Sürücü belgenizi yükleyin',
          status: 'pending',
          required: true,
          documents: ['Sürücü belgesi ön', 'Sürücü belgesi arka']
        },
        {
          id: 'health',
          title: 'Sağlık Raporu',
          description: 'Sağlık raporunuzu yükleyin',
          status: 'pending',
          required: true,
          documents: ['Sağlık raporu']
        }
      );
    }

    return baseSteps;
  };

  const steps = getVerificationSteps();
  const currentStepData = steps[currentStep];

  const handleFileUpload = (stepId: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => ({
        ...prev,
        [stepId]: [...(prev[stepId] || []), ...fileArray]
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_review':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Doğrulandı';
      case 'rejected':
        return 'Reddedildi';
      case 'in_review':
        return 'İnceleniyor';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'in_review':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Güvenlik Doğrulaması</h1>
        <p className="text-gray-600">
          Hesabınızı güvence altına almak için kimlik doğrulaması yapmanız gerekiyor
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">
            Adım {currentStep + 1} / {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            %{Math.round(((currentStep + 1) / steps.length) * 100)} tamamlandı
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              index === currentStep
                ? 'border-blue-500 bg-blue-50'
                : index < currentStep
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
            onClick={() => setCurrentStep(index)}
          >
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(step.status)}
              <span className="font-medium text-gray-900">{step.title}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(step.status)}`}>
              {getStatusText(step.status)}
            </span>
          </div>
        ))}
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {getStatusIcon(currentStepData.status)}
          <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{currentStepData.description}</p>

        {/* File Upload */}
        {currentStepData.documents && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gerekli Belgeler:
              </label>
              <ul className="text-sm text-gray-600 space-y-1">
                {currentStepData.documents.map((doc, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Belgelerinizi yüklemek için tıklayın veya sürükleyin
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(currentStepData.id, e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Dosya Seç
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles[currentStepData.id] && uploadedFiles[currentStepData.id].length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Yüklenen Dosyalar:</p>
                {uploadedFiles[currentStepData.id].map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phone Verification */}
        {currentStepData.id === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Numarası
              </label>
              <input
                type="tel"
                placeholder="+90 5XX XXX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Doğrulama Kodu Gönder
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Geri
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {steps.filter(s => s.status === 'verified').length} / {steps.length} tamamlandı
          </span>
        </div>

        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {currentStep === steps.length - 1 ? 'Tamamla' : 'İleri'}
        </button>
      </div>
    </div>
  );
};

export default SecurityVerification;

