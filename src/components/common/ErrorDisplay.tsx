import React from 'react';
import { AlertTriangle, RefreshCw, Mail, Phone } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showSupport?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Bir Hata Oluştu',
  message,
  onRetry,
  showSupport = true,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center ${className}`}>
      <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
        <AlertTriangle className='w-8 h-8 text-red-600' />
      </div>

      <h3 className='text-xl font-bold text-slate-900 mb-2'>{title}</h3>
      <p className='text-slate-600 mb-6 leading-relaxed'>{message}</p>

      <div className='flex flex-col sm:flex-row gap-3 justify-center'>
        {onRetry && (
          <button
            onClick={onRetry}
            className='px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
            aria-label='Tekrar dene'
          >
            <RefreshCw className='w-5 h-5' />
            Tekrar Dene
          </button>
        )}

        {showSupport && (
          <div className='flex flex-col sm:flex-row gap-2 text-sm text-slate-600'>
            <a
              href='mailto:destek@yolnext.com.tr'
              className='flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors'
              aria-label='E-posta ile destek al'
            >
              <Mail className='w-4 h-4' />
              <span className='hidden sm:inline'>E-posta</span>
            </a>
            <a
              href='tel:+902124567890'
              className='flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors'
              aria-label='Telefon ile destek al'
            >
              <Phone className='w-4 h-4' />
              <span className='hidden sm:inline'>Telefon</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;






<<<<<<< HEAD




=======
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
