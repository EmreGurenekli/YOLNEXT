import React from 'react';
import { Helmet } from 'react-helmet-async';

interface TasiyiciPageTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const TasiyiciPageTemplate: React.FC<TasiyiciPageTemplateProps> = ({ title, description, icon, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Helmet>
        <title>{title} - YolNet Taşıyıcı</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-green-200 mb-6">
          <div className="px-6 py-4 border-b border-green-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                {icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-900">{title}</h1>
                <p className="text-sm text-green-600">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-green-200">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasiyiciPageTemplate;












