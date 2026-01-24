import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Settings2 } from 'lucide-react';
import { api } from '../../services/apiClient';
import { getConsentVersion, getCookieConsent, setCookieConsent } from '../../utils/cookieConsent';

type Props = {
  className?: string;
};

export default function CookieConsentBanner({ className }: Props) {
  const existing = useMemo(() => getCookieConsent(), []);
  const [open, setOpen] = useState(!existing);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(Boolean(existing?.analytics));

  useEffect(() => {
    const handler = () => {
      const cur = getCookieConsent();
      setAnalyticsEnabled(Boolean(cur?.analytics));
      setShowPrefs(true);
      setOpen(true);
    };

    window.addEventListener('yolnext:cookie-preferences', handler as EventListener);
    return () => {
      window.removeEventListener('yolnext:cookie-preferences', handler as EventListener);
    };
  }, []);

  if (!open) return null;

  const persistServerSide = async (analytics: boolean) => {
    try {
      await api.post('/kvkk/cookie-consent', {
        analytics: Boolean(analytics),
        version: getConsentVersion(),
      });
    } catch {
      // best-effort
    }
  };

  const acceptAll = () => {
    setCookieConsent({ analytics: true });
    void persistServerSide(true);
    setOpen(false);
  };

  const rejectNonEssential = () => {
    setCookieConsent({ analytics: false });
    void persistServerSide(false);
    setOpen(false);
  };

  const savePrefs = () => {
    setCookieConsent({ analytics: analyticsEnabled });
    void persistServerSide(analyticsEnabled);
    setOpen(false);
  };

  return (
    <div
      className={
        className ||
        'fixed bottom-0 left-0 right-0 z-[60] bg-slate-900 text-white border-t border-slate-800'
      }
      role='dialog'
      aria-label='Çerez tercihleri'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        <div className='flex flex-col md:flex-row md:items-center gap-4'>
          <div className='flex-1'>
            <div className='text-sm font-semibold'>Çerez Tercihleri</div>
            <div className='text-xs text-slate-300 mt-1'>
              Zorunlu çerezler platformun çalışması için gereklidir. Analitik çerezleri, ürünü
              geliştirmek için kullanım istatistikleri toplar. Tercihlerinizi istediğiniz zaman
              güncelleyebilirsiniz.
              <span className='ml-2'>
                <Link to='/cookie-policy' className='underline text-white'>
                  Çerez Politikası
                </Link>
                <span className='mx-2 text-slate-500'>|</span>
                <Link to='/privacy' className='underline text-white'>
                  Gizlilik Politikası
                </Link>
              </span>
            </div>
          </div>

          {!showPrefs ? (
            <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
              <button
                type='button'
                onClick={rejectNonEssential}
                className='px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold'
              >
                Sadece Zorunlu
              </button>
              <button
                type='button'
                onClick={acceptAll}
                className='px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold'
              >
                Hepsini Kabul Et
              </button>
              <button
                type='button'
                onClick={() => setShowPrefs(true)}
                className='px-4 py-2 rounded-lg bg-transparent border border-slate-700 hover:border-slate-500 text-sm font-semibold inline-flex items-center justify-center gap-2'
              >
                <Settings2 className='w-4 h-4' />
                Tercihler
              </button>
              <button
                type='button'
                onClick={() => {
                  setCookieConsent({ analytics: false });
                  setOpen(false);
                }}
                className='p-2 rounded-lg hover:bg-slate-800 self-start sm:self-auto'
                aria-label='Kapat'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          ) : (
            <div className='w-full md:w-[420px] bg-slate-800 rounded-xl p-4 border border-slate-700'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='text-sm font-bold'>Tercihler</div>
                  <div className='text-xs text-slate-300 mt-1'>
                    Zorunlu çerezler kapatılamaz. Analitik tercihini seçebilirsiniz.
                  </div>
                </div>
                <button
                  type='button'
                  className='p-2 rounded-lg hover:bg-slate-700'
                  aria-label='Tercihleri kapat'
                  onClick={() => setShowPrefs(false)}
                >
                  <X className='w-4 h-4' />
                </button>
              </div>

              <div className='mt-4 space-y-3'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <div className='text-sm font-semibold'>Zorunlu</div>
                    <div className='text-xs text-slate-300'>Giriş, güvenlik ve oturum için gerekli.</div>
                  </div>
                  <div className='text-xs font-bold text-emerald-300'>Açık</div>
                </div>

                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <div className='text-sm font-semibold'>Analitik</div>
                    <div className='text-xs text-slate-300'>Kullanım istatistikleri ve A/B testleri.</div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      className='sr-only peer'
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className='flex gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={savePrefs}
                    className='flex-1 px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold'
                  >
                    Kaydet
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setCookieConsent({ analytics: false });
                      setOpen(false);
                    }}
                    className='px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold'
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}











