import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Hata sınırı bir hata yakaladı:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
          <div className='max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>

            <h1 className='text-2xl font-bold text-slate-900 mb-4'>
              Bir Hata Oluştu
            </h1>

            <p className='text-slate-600 mb-6'>
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi
              deneyin.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className='mb-6 text-left'>
                <summary className='cursor-pointer text-sm font-medium text-slate-700 mb-2'>
                  Hata Detayları (Geliştirici Modu)
                </summary>
                <div className='bg-slate-100 rounded-lg p-3 text-xs text-slate-600 overflow-auto max-h-32'>
                  <pre>{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <pre className='mt-2'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className='flex space-x-3'>
              <button
                onClick={this.handleRetry}
                className='flex-1 bg-gradient-to-r from-slate-800 to-blue-900 text-white py-2 px-4 rounded-lg hover:from-slate-700 hover:to-blue-800 transition-colors flex items-center justify-center space-x-2'
              >
                <RefreshCw className='w-4 h-4' />
                <span>Yenile</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className='flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2'
              >
                <Home className='w-4 h-4' />
                <span>Ana Sayfa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
