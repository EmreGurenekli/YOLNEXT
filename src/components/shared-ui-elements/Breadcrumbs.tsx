import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumbs({ 
  items = [], 
  showHome = true, 
  className = '' 
}: BreadcrumbsProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert path segment to readable label
      let label = segment.replace(/-/g, ' ').replace(/_/g, ' ');
      label = label.charAt(0).toUpperCase() + label.slice(1);
      
      // Special cases for known paths
      switch (segment) {
        case 'individual':
          label = 'Bireysel Gönderici';
          break;
        case 'corporate':
          label = 'Kurumsal Gönderici';
          break;
        case 'nakliyeci':
          label = 'Nakliyeci';
          break;
        case 'tasiyici':
          label = 'Taşıyıcı';
          break;
        case 'dashboard':
          label = 'Ana Sayfa';
          break;
        case 'create-shipment':
          label = 'Gönderi Oluştur';
          break;
        case 'my-shipments':
          label = 'Gönderilerim';
          break;
        case 'offers':
          label = 'Teklifler';
          break;
        case 'market':
          label = 'İş Pazarı';
          break;
        case 'islerim':
          label = 'İşlerim';
          break;
        case 'messages':
          label = 'Mesajlar';
          break;
        case 'settings':
          label = 'Ayarlar';
          break;
        case 'help':
          label = 'Yardım';
          break;
        case 'login':
          label = 'Giriş Yap';
          break;
        case 'register':
          label = 'Kayıt Ol';
          break;
        case 'forgot-password':
          label = 'Şifremi Unuttum';
          break;
      }
      
      breadcrumbs.push({
        label,
        path: currentPath,
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();

  if (breadcrumbItems.length === 0 && !showHome) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
      aria-label="Breadcrumb navigation"
    >
      {showHome && (
        <Link
          to="/"
          className="flex items-center hover:text-blue-600 transition-colors"
          title="Ana Sayfa"
        >
          <Home className="w-4 h-4" />
          <span className="sr-only">Ana Sayfa</span>
        </Link>
      )}
      
      {(showHome && breadcrumbItems.length > 0) && (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
      
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isHome = item.path === '/';
        
        return (
          <React.Fragment key={`${item.path}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="flex items-center text-gray-900 font-medium">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Predefined breadcrumb configurations for common pages
export const BreadcrumbConfig = {
  // Individual sender
  individualDashboard: [
    { label: 'Bireysel Gönderici', path: '/individual/dashboard' },
    { label: 'Ana Sayfa' },
  ],
  individualCreateShipment: [
    { label: 'Bireysel Gönderici', path: '/individual/dashboard' },
    { label: 'Gönderi Oluştur' },
  ],
  individualOffers: [
    { label: 'Bireysel Gönderici', path: '/individual/dashboard' },
    { label: 'Teklifler' },
  ],
  
  // Corporate sender
  corporateDashboard: [
    { label: 'Kurumsal Gönderici', path: '/corporate/dashboard' },
    { label: 'Ana Sayfa' },
  ],
  corporateCreateShipment: [
    { label: 'Kurumsal Gönderici', path: '/corporate/dashboard' },
    { label: 'Gönderi Oluştur' },
  ],
  
  // Carrier
  carrierDashboard: [
    { label: 'Nakliyeci', path: '/nakliyeci/dashboard' },
    { label: 'Ana Sayfa' },
  ],
  carrierMarket: [
    { label: 'Nakliyeci', path: '/nakliyeci/dashboard' },
    { label: 'İş Pazarı' },
  ],
  
  // Transporter
  transporterDashboard: [
    { label: 'Taşıyıcı', path: '/tasiyici/dashboard' },
    { label: 'Ana Sayfa' },
  ],
  transporterMarket: [
    { label: 'Taşıyıcı', path: '/tasiyici/dashboard' },
    { label: 'İş Pazarı' },
  ],
};
