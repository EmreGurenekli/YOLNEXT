import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Menu, X, Bell, User } from 'lucide-react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  userType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  title: string;
}

export default function MobileOptimizedLayout({ 
  children, 
  userType, 
  title 
}: MobileOptimizedLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{title} - YolNet</title>
        <meta name="description" content={`YolNet ${userType} mobil panel`} />
      </Helmet>

      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-2 px-3 text-blue-600">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <span className="text-xs mt-1">Ana Sayfa</span>
          </button>
          <button className="flex flex-col items-center py-2 px-3 text-gray-500">
            <div className="w-6 h-6"></div>
            <span className="text-xs mt-1">Gönderiler</span>
          </button>
          <button className="flex flex-col items-center py-2 px-3 text-gray-500">
            <div className="w-6 h-6"></div>
            <span className="text-xs mt-1">Mesajlar</span>
          </button>
          <button className="flex flex-col items-center py-2 px-3 text-gray-500">
            <div className="w-6 h-6"></div>
            <span className="text-xs mt-1">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}