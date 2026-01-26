import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X } from 'lucide-react';

type Step = {
  id: string;
  title: string;
  description?: string;
  to: string;
  done?: boolean;
};

interface QuickStartChecklistProps {
  storageKey: string;
  title: string;
  subtitle?: string;
  steps: Step[];
  className?: string;
}

const QuickStartChecklist: React.FC<QuickStartChecklistProps> = ({
  storageKey,
  title,
  subtitle,
  steps,
  className = '',
}) => {
  const localStorageKey = useMemo(
    () => `quickstart:dismissed:${storageKey}`,
    [storageKey]
  );

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      setIsDismissed(localStorage.getItem(localStorageKey) === '1');
    } catch {
      setIsDismissed(false);
    }
  }, [localStorageKey]);

  const dismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(localStorageKey, '1');
    } catch {
      /* noop */
    }
  };

  if (isDismissed) return null;

  return (
    <div
      className={`w-full rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className='flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-200'>
        <div className='min-w-0'>
          <div className='text-sm sm:text-base font-extrabold text-slate-900'>
            {title}
          </div>
          {subtitle && (
            <div className='text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed'>
              {subtitle}
            </div>
          )}
        </div>

        <button
          type='button'
          onClick={dismiss}
          className='w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 flex-shrink-0'
          aria-label='Kapat'
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      <div className='p-4 sm:p-5 space-y-3'>
        {steps.map(step => {
          const done = !!step.done;
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <Link
              key={step.id}
              to={step.to}
              className='block rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-3'
            >
              <div className='flex items-start gap-3'>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                  aria-hidden='true'
                >
                  <Icon className='w-5 h-5' />
                </div>
                <div className='min-w-0'>
                  <div className='text-sm font-bold text-slate-900'>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className='text-xs text-slate-600 mt-0.5 leading-relaxed'>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickStartChecklist;

