import React from 'react';
import { Helmet } from 'react-helmet-async';

interface CorporatePageTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const CorporatePageTemplate: React.FC<CorporatePageTemplateProps> = ({ title, description, icon, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Helmet>
        <title>{title} - YolNet Kurumsal</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 mb-6">
          <div className="px-6 py-4 border-b border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
                {icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">{title}</h1>
                <p className="text-sm text-blue-600">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporatePageTemplate;












