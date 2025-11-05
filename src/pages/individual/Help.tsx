import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Package,
  Truck,
  MapPin,
  DollarSign,
  Shield,
  MessageCircle,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const IndividualHelp = () => {
  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/individual/dashboard' },
    { label: 'Yardım', href: '/individual/help' },
  ];

  const faqItems = [
    {
      question: 'Gönderi nasıl oluştururum?',
      answer: 'Dashboard\'dan "Gönderi Oluştur" butonuna tıklayın, kategori seçin, adres bilgilerini girin ve yayınlayın. Nakliyeciler size teklif gönderecek.',
      icon: Package,
    },
    {
      question: 'Teklifleri nasıl görüntülerim?',
      answer: 'Gönderilerim sayfasından gönderinizi seçin ve "Teklifler" sekmesine bakın. Teklifleri fiyat, süre ve nakliyeci puanına göre karşılaştırabilirsiniz.',
      icon: DollarSign,
    },
    {
      question: 'Gönderimi nasıl takip ederim?',
      answer: 'Gönderilerim sayfasından gönderinizin durumunu görebilirsiniz. Ayrıca "Canlı Takip" sayfasından gerçek zamanlı konum takibi yapabilirsiniz.',
      icon: MapPin,
    },
    {
      question: 'Ödeme nasıl yapılır?',
      answer: 'Teklifi kabul ettikten sonra ödeme ekranına yönlendirilirsiniz. Kredi kartı, havale veya cüzdan bakiyenizle ödeme yapabilirsiniz.',
      icon: DollarSign,
    },
    {
      question: 'Gönderim iptal edilebilir mi?',
      answer: 'Evet, gönderi henüz kabul edilmediyse iptal edebilirsiniz. Ancak kabul edilen gönderiler için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır.',
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Yardım - Bireysel Gönderici | YolNext</title>
        <meta name="description" content="YolNext bireysel gönderici yardım ve destek sayfası" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Yardım ve{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
              Destek
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Size nasıl yardımcı olabiliriz? Sorularınızın cevaplarını burada bulabilirsiniz.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/individual/create-shipment"
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group"
          >
            <Package className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Gönderi Oluştur</h3>
            <p className="text-sm text-slate-600 mb-4">
              Yeni bir gönderi oluşturun ve nakliyecilerden teklif alın
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              Başla <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/individual/my-shipments"
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group"
          >
            <Truck className="w-8 h-8 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Gönderilerim</h3>
            <p className="text-sm text-slate-600 mb-4">
              Gönderilerinizi takip edin ve yönetin
            </p>
            <div className="flex items-center text-green-600 font-medium">
              Görüntüle <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/individual/messages"
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group"
          >
            <MessageCircle className="w-8 h-8 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Mesajlar</h3>
            <p className="text-sm text-slate-600 mb-4">
              Nakliyecilerle iletişime geçin
            </p>
            <div className="flex items-center text-purple-600 font-medium">
              Mesajlar <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 mb-12">
          <div className="flex items-center mb-8">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
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
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
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
        <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Hala Yardıma İhtiyacınız mı Var?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Sorularınız için bizimle iletişime geçebilirsiniz. Destek ekibimiz size yardımcı olmaktan mutluluk duyar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                İletişime Geç
              </Link>
              <a
                href="mailto:destek@yolnext.com"
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
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

export default IndividualHelp;
