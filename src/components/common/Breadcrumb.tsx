import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const p = location.pathname || '';
  const homeTo = p.startsWith('/individual')
    ? '/individual/dashboard'
    : p.startsWith('/corporate')
      ? '/corporate/dashboard'
      : p.startsWith('/nakliyeci')
        ? '/nakliyeci/dashboard'
        : p.startsWith('/tasiyici')
          ? '/tasiyici/dashboard'
          : '/';

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <Link
        to={homeTo}
        className='flex items-center text-gray-500 hover:text-gray-700 transition-colors'
      >
        <Home className='w-4 h-4' />
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className='w-4 h-4 text-gray-400' />
          {item.href ? (
            <Link
              to={item.href}
              className='text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1'
            >
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <span className='text-gray-900 font-medium flex items-center gap-1'>
              {item.icon}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
