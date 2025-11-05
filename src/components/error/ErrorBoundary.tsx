import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8'>
            <div className='text-center'>
              <div className='w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-8 h-8 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Bir Hata Oluştu
              </h2>
              <p className='text-gray-600 mb-6'>
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi
                deneyin veya ana sayfaya dönün.
              </p>

              {this.state.error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left'>
                  <p className='text-sm font-semibold text-red-900 mb-2'>
                    Hata Detayları:
                  </p>
                  <p className='text-xs text-red-700 font-mono'>
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className='flex gap-4 justify-center'>
                <button
                  onClick={() => (window.location.href = '/')}
                  className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                >
                  Ana Sayfaya Dön
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className='px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium'
                >
                  Sayfayı Yenile
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
