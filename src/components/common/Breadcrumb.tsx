import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <Link to="/" className="flex items-center text-slate-500 hover:text-slate-700">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.href ? (
            <Link to={item.href} className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
              {item.icon && <span className="flex items-center">{item.icon}</span>}
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium flex items-center gap-1">
              {item.icon && <span className="flex items-center">{item.icon}</span>}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;