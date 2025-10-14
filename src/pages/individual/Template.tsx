import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Package } from 'lucide-react';

interface PageTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const PageTemplate: React.FC<PageTemplateProps> = ({ title, description, icon, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Helmet>
        <title>{title} - YolNet</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                <p className="text-sm text-slate-600">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTemplate;

