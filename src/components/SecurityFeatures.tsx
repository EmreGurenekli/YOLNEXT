import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  onStrengthChange,
}) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const calculateStrength = (pwd: string) => {
      let score = 0;
      const feedbacks = [];

      if (pwd.length >= 8) score += 1;
      else feedbacks.push('En az 8 karakter olmalı');

      if (pwd.length >= 12) score += 1;

      if (/[a-z]/.test(pwd)) score += 1;
      else feedbacks.push('Küçük harf içermeli');

      if (/[A-Z]/.test(pwd)) score += 1;
      else feedbacks.push('Büyük harf içermeli');

      if (/[0-9]/.test(pwd)) score += 1;
      else feedbacks.push('Rakam içermeli');

      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
      else feedbacks.push('Özel karakter içermeli');

      setStrength(score);
      setFeedback(feedbacks.join(', '));
      onStrengthChange?.(score);
    };

    calculateStrength(password);
  }, [password, onStrengthChange]);

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return 'Zayıf';
    if (strength <= 4) return 'Orta';
    return 'Güçlü';
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center space-x-2'>
        <div className='flex-1 bg-gray-200 rounded-full h-2'>
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
            style={{ width: `${(strength / 6) * 100}%` }}
          />
        </div>
        <span className='text-sm font-medium text-gray-700'>
          {getStrengthText(strength)}
        </span>
      </div>
      {feedback && <p className='text-xs text-gray-600'>{feedback}</p>}
    </div>
  );
};

interface TwoFactorAuthProps {
  onSetup?: () => void;
  onDisable?: () => void;
  isEnabled?: boolean;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  onSetup,
  onDisable,
  isEnabled = false,
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      onSetup?.();
    }, 2000);
  };

  if (isEnabled) {
    return (
      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <div className='flex items-center'>
          <CheckCircle className='h-5 w-5 text-green-600 mr-2' />
          <span className='text-sm font-medium text-green-800'>
            İki faktörlü kimlik doğrulama aktif
          </span>
        </div>
        <button
          onClick={onDisable}
          className='mt-2 text-sm text-red-600 hover:text-red-800'
        >
          Devre dışı bırak
        </button>
      </div>
    );
  }

  return (
    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
      <div className='flex items-center mb-3'>
        <AlertTriangle className='h-5 w-5 text-yellow-600 mr-2' />
        <span className='text-sm font-medium text-yellow-800'>
          İki faktörlü kimlik doğrulama devre dışı
        </span>
      </div>
      <div className='space-y-3'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Doğrulama Kodu
          </label>
          <input
            type='text'
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder='6 haneli kod'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            maxLength={6}
          />
        </div>
        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || isVerifying}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isVerifying ? 'Doğrulanıyor...' : 'Aktif Et'}
        </button>
      </div>
    </div>
  );
};

interface SecurityLogProps {
  logs: Array<{
    id: string;
    action: string;
    timestamp: string;
    ip: string;
    location?: string;
    device?: string;
  }>;
}

export const SecurityLog: React.FC<SecurityLogProps> = ({ logs }) => {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium text-gray-900'>Güvenlik Geçmişi</h3>
      <div className='space-y-2'>
        {logs.map(log => (
          <div key={log.id} className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {log.action}
                </p>
                <p className='text-xs text-gray-500'>
                  {log.timestamp} • {log.ip}
                  {log.location && ` • ${log.location}`}
                </p>
              </div>
              {log.device && (
                <span className='text-xs text-gray-500'>{log.device}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SessionManagerProps {
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  onTerminate?: (sessionId: string) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  onTerminate,
}) => {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium text-gray-900'>Aktif Oturumlar</h3>
      <div className='space-y-3'>
        {sessions.map(session => (
          <div key={session.id} className='bg-white border rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <Shield className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {session.device}
                    {session.current && (
                      <span className='ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                        Mevcut
                      </span>
                    )}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {session.location} • {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => onTerminate?.(session.id)}
                  className='text-red-600 hover:text-red-800 text-sm'
                >
                  Sonlandır
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SecuritySettingsProps {
  onSave?: (settings: any) => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onSave,
}) => {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
  });

  const handleSave = () => {
    onSave?.(settings);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Güvenlik Ayarları
        </h3>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                Email Bildirimleri
              </label>
              <p className='text-xs text-gray-500'>
                Güvenlik olayları hakkında email alın
              </p>
            </div>
            <input
              type='checkbox'
              checked={settings.emailNotifications}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  emailNotifications: e.target.checked,
                }))
              }
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                Giriş Uyarıları
              </label>
              <p className='text-xs text-gray-500'>
                Yeni girişlerde bildirim alın
              </p>
            </div>
            <input
              type='checkbox'
              checked={settings.loginAlerts}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  loginAlerts: e.target.checked,
                }))
              }
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Oturum Zaman Aşımı (dakika)
            </label>
            <select
              value={settings.sessionTimeout}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  sessionTimeout: parseInt(e.target.value),
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value={15}>15 dakika</option>
              <option value={30}>30 dakika</option>
              <option value={60}>1 saat</option>
              <option value={120}>2 saat</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Şifre Değiştirme Zorunluluğu (gün)
            </label>
            <select
              value={settings.passwordExpiry}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  passwordExpiry: parseInt(e.target.value),
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value={30}>30 gün</option>
              <option value={60}>60 gün</option>
              <option value={90}>90 gün</option>
              <option value={0}>Hiçbir zaman</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className='mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700'
        >
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
};
