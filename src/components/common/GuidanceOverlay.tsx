import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import GuidanceBanner from './GuidanceBanner';

type Action = {
  label: string;
  to?: string;
  onClick?: () => void;
};

interface GuidanceOverlayProps {
  storageKey: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction: Action;
  secondaryAction?: Action;
  className?: string;
  isEmpty?: boolean;
}

const GuidanceOverlay: React.FC<GuidanceOverlayProps> = ({
  storageKey,
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
  isEmpty,
}) => {
  const localStorageKey = useMemo(() => `guidance:dismissed:${storageKey}`, [storageKey]);

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(localStorageKey) === '1';
      setIsDismissed(dismissed);

      // If a page tells us whether it's empty, we only auto-open when empty.
      // If isEmpty is not provided, keep the legacy "first visit" behavior.
      const shouldAutoOpen = isEmpty === undefined ? !dismissed : (!dismissed && isEmpty);
      setIsOverlayOpen(shouldAutoOpen);
    } catch {
      setIsDismissed(false);
      setIsOverlayOpen(isEmpty === undefined ? true : Boolean(isEmpty));
    }
  }, [localStorageKey, isEmpty]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    try {
      if (isOverlayOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    } catch (error) {
      console.warn('Failed to set body overflow:', error);
    }

    return () => {
      try {
        if (typeof document !== 'undefined' && document.body) {
          document.body.style.overflow = 'unset';
        }
      } catch (error) {
        console.warn('Failed to reset body overflow:', error);
      }
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    if (isOverlayOpen) {
      try {
        document.addEventListener('keydown', handleEscape);
      } catch (error) {
        console.warn('Failed to add escape listener:', error);
      }
    }

    return () => {
      try {
        if (typeof document !== 'undefined') {
          document.removeEventListener('keydown', handleEscape);
        }
      } catch (error) {
        console.warn('Failed to remove escape listener:', error);
      }
    };
  }, [isOverlayOpen]);

  const dismiss = () => {
    setIsOverlayOpen(false);
    setIsDismissed(true);
    try {
      localStorage.setItem(localStorageKey, '1');
    } catch {
      /* noop */
    }
  };

  const open = () => setIsOverlayOpen(true);

  const showInlineBanner = !isDismissed && (isEmpty === undefined ? true : Boolean(isEmpty));
  const showHelpLink = isDismissed || isEmpty === false;

  return (
    <>
      <div className={`w-full ${className}`}>
        {showInlineBanner && (
          <GuidanceBanner
            icon={icon}
            title={title}
            description={description}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
          />
        )}

        {showHelpLink && (
          <div className='flex justify-end'>
            <button
              type='button'
              onClick={open}
              className='text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4'
            >
              Yardım / Tekrar Göster
            </button>
          </div>
        )}
      </div>

      {isOverlayOpen && (
        <div className='fixed inset-0 z-50'>
          <div
            className='absolute inset-0 bg-black/40 backdrop-blur-sm'
            onClick={dismiss}
          />

          <div className='relative flex min-h-full items-center justify-center p-4'>
            <div className='relative w-full max-w-2xl'>
              <button
                type='button'
                onClick={dismiss}
                className='absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900'
                aria-label='Kapat'
              >
                <X className='w-5 h-5' />
              </button>

              <div className='bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6'>
                <GuidanceBanner
                  icon={icon}
                  title={title}
                  description={description}
                  primaryAction={{
                    ...primaryAction,
                    onClick: () => {
                      primaryAction.onClick?.();
                      dismiss();
                    },
                  }}
                  secondaryAction={
                    secondaryAction
                      ? {
                          ...secondaryAction,
                          onClick: () => {
                            secondaryAction.onClick?.();
                            dismiss();
                          },
                        }
                      : undefined
                  }
                />

                <div className='mt-4 flex justify-end'>
                  <button
                    type='button'
                    onClick={dismiss}
                    className='px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-all duration-200 border border-slate-200'
                  >
                    Anladım
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuidanceOverlay;
