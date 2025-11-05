import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Truck,
  MapPin,
  DollarSign,
  Shield,
  MessageCircle,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  Briefcase,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const TasiyiciHelp = () => {
  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/tasiyici/dashboard' },
    { label: 'Yardım', href: '/tasiyici/help' },
  ];

  const faqItems = [
    {
      question: 'İşlere nasıl başvururum?',
      answer: 'İş Pazarı sayfasından açık ilanları görüntüleyebilir ve başvurabilirsiniz. Ayrıca nakliyecilerden gelen doğrudan atamaları da alabilirsiniz.',
      icon: Briefcase,
    },
    {
      question: 'Kazançlarımı nasıl görüntülerim?',
      answer: 'Dashboard\'dan toplam kazanç ve bu ay kazancınızı görebilirsiniz. Detaylı raporlar için Analitik sayfasını ziyaret edebilirsiniz.',
      icon: DollarSign,
    },
    {
      question: 'Görevleri nasıl takip ederim?',
      answer: 'Aktif İşler sayfasından atanmış görevlerinizi görüntüleyebilir ve durumlarını güncelleyebilirsiniz. Konum takibi için GPS özelliğini kullanabilirsiniz.',
      icon: MapPin,
    },
    {
      question: 'Ödemeleri nasıl alırım?',
      answer: 'Tamamlanan işler için ödemeler otomatik olarak cüzdanınıza yüklenir. Cüzdan bakiyenizden para çekebilirsiniz.',
      icon: DollarSign,
    },
    {
      question: 'Belgelerimi nasıl güncellerim?',
      answer: 'Ayarlar sayfasından ehliyet, ruhsat ve diğer belgelerinizi yükleyebilir ve güncelleyebilirsiniz.',
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Helmet>
        <title>Yardım - Taşıyıcı | YolNext</title>
        <meta name="description" content="YolNext taşıyıcı yardım ve destek sayfası" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Yardım ve{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
              Destek
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Taşıyıcı olarak platformu nasıl kullanacağınız hakkında bilgiler
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/tasiyici/market"
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group"
          >
            <Briefcase className="w-8 h-8 text-orange-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">İş Pazarı</h3>
            <p className="text-sm text-slate-600 mb-4">
              Açık ilanları görüntüleyin ve başvurun
            </p>
            <div className="flex items-center text-orange-600 font-medium">
              İş Ara <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/tasiyici/active-jobs"
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group"
          >
            <Truck className="w-8 h-8 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aktif İşler</h3>
            <p className="text-sm text-slate-600 mb-4">
              Atanmış görevlerinizi takip edin
            </p>
            <div className="flex items-center text-green-600 font-medium">
              Görüntüle <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/tasiyici/settings"
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group"
          >
            <User className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ayarlar</h3>
            <p className="text-sm text-slate-600 mb-4">
              Profil ve belgelerinizi yönetin
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              Ayarlar <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 mb-12">
          <div className="flex items-center mb-8">
            <FileText className="w-8 h-8 text-orange-600 mr-3" />
            <h2 className="text-3xl font-bold text-slate-900">Sık Sorulan Sorular</h2>
          </div>

          <div className="space-y-6">
            {faqItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {item.question}
                      </h3>
                      <p className="text-slate-600">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-br from-orange-600 to-yellow-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Hala Yardıma İhtiyacınız mı Var?</h2>
            <p className="text-orange-100 mb-8 max-w-2xl mx-auto">
              Sorularınız için bizimle iletişime geçebilirsiniz. Destek ekibimiz size yardımcı olmaktan mutluluk duyar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                İletişime Geç
              </Link>
              <a
                href="mailto:destek@yolnext.com"
                className="bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-800 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Email Gönder
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasiyiciHelp;
