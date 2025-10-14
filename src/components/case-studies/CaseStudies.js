import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Helmet } from 'react-helmet-async';
import { Building2, Users, Star, ArrowRight } from 'lucide-react';
const caseStudies = [
    {
        id: 'migros',
        title: 'Migros Ticaret A.Ş.',
        company: 'Migros Ticaret A.Ş.',
        industry: 'Perakende',
        challenge: 'Migros, 50+ şehirdeki mağazalarına düzenli olarak ürün sevkiyatı yapıyordu. Geleneksel lojistik firmaları ile çalışırken yüksek maliyetler ve zaman kaybı yaşıyordu.',
        solution: 'YolNet platformu ile tüm sevkiyatlarını merkezi olarak yönetmeye başladı. Otomatik fiyat karşılaştırması ve gerçek zamanlı takip ile süreçleri optimize etti.',
        results: {
            savings: 35,
            efficiency: 40,
            satisfaction: 95,
            timeSaved: 60
        },
        testimonial: {
            author: 'Ahmet Yılmaz',
            position: 'Lojistik Müdürü',
            content: 'YolNet sayesinde lojistik maliyetlerimizi %35 azalttık. Gerçek zamanlı takip ve otomatik optimizasyon ile süreçlerimiz çok daha verimli hale geldi.',
            rating: 5
        },
        image: '/api/placeholder/400/300'
    },
    {
        id: 'ekol',
        title: 'Ekol Lojistik',
        company: 'Ekol Lojistik',
        industry: 'Lojistik',
        challenge: 'Ekol Lojistik, araçlarının boş dönüş oranını azaltmak ve daha fazla yük bulmak istiyordu. Geleneksel yöntemlerle yeterli yük bulamıyordu.',
        solution: 'YolNet platformu ile boş dönüşleri minimize etti. Şehir içi ve şehirler arası yükleri kolayca buldu ve araç doluluk oranını artırdı.',
        results: {
            savings: 25,
            efficiency: 50,
            satisfaction: 92,
            timeSaved: 45
        },
        testimonial: {
            author: 'Mehmet Demir',
            position: 'Operasyon Müdürü',
            content: 'YolNet ile araçlarımızın boş dönüş oranını %50 azalttık. Platform sayesinde sürekli yük bulabiliyoruz ve karlılığımız arttı.',
            rating: 5
        },
        image: '/api/placeholder/400/300'
    },
    {
        id: 'trendyol',
        title: 'Trendyol',
        company: 'Trendyol',
        industry: 'E-ticaret',
        challenge: 'Trendyol, hızlı büyüme ile birlikte lojistik kapasitesini artırmak zorundaydı. Mevcut lojistik firmaları yetersiz kalıyordu.',
        solution: 'YolNet platformu ile geniş bir nakliyeci ağına erişim sağladı. Dinamik fiyatlandırma ve otomatik atama ile lojistik süreçlerini optimize etti.',
        results: {
            savings: 30,
            efficiency: 45,
            satisfaction: 98,
            timeSaved: 70
        },
        testimonial: {
            author: 'Zeynep Kaya',
            position: 'Lojistik Direktörü',
            content: 'YolNet ile lojistik kapasitemizi 3 katına çıkardık. Platform sayesinde müşteri memnuniyetimiz %98\'e ulaştı.',
            rating: 5
        },
        image: '/api/placeholder/400/300'
    }
];
export default function CaseStudies() {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Ba\u015Far\u0131 Hikayeleri - YolNet" }), _jsx("meta", { name: "description", content: "YolNet ile ba\u015Far\u0131ya ula\u015Fan \u015Firketlerin hikayeleri" })] }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Ba\u015Far\u0131 Hikayeleri" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "YolNet ile birlikte \u00E7al\u0131\u015Fan \u015Firketlerin nas\u0131l ba\u015Far\u0131ya ula\u015Ft\u0131\u011F\u0131n\u0131 ke\u015Ffedin" })] }), _jsx("div", { className: "space-y-12", children: caseStudies.map((study, index) => (_jsx("div", { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-200", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(Building2, { className: "w-8 h-8 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: study.title }), _jsx("p", { className: "text-gray-600", children: study.industry })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Sorun" }), _jsx("p", { className: "text-gray-600", children: study.challenge })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "\u00C7\u00F6z\u00FCm" }), _jsx("p", { className: "text-gray-600", children: study.solution })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-green-50 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["%", study.results.savings] }), _jsx("div", { className: "text-sm text-green-700", children: "Maliyet Tasarrufu" })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: ["%", study.results.efficiency] }), _jsx("div", { className: "text-sm text-blue-700", children: "Verimlilik Art\u0131\u015F\u0131" })] }), _jsxs("div", { className: "bg-purple-50 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-purple-600", children: ["%", study.results.satisfaction] }), _jsx("div", { className: "text-sm text-purple-700", children: "M\u00FC\u015Fteri Memnuniyeti" })] }), _jsxs("div", { className: "bg-orange-50 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-orange-600", children: ["%", study.results.timeSaved] }), _jsx("div", { className: "text-sm text-orange-700", children: "Zaman Tasarrufu" })] })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-6", children: [_jsx("div", { className: "flex items-center gap-1 mb-4", children: [...Array(study.testimonial.rating)].map((_, i) => (_jsx(Star, { className: "w-5 h-5 text-yellow-400 fill-current" }, i))) }), _jsxs("blockquote", { className: "text-gray-700 mb-4 italic", children: ["\"", study.testimonial.content, "\""] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(Users, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-gray-900", children: study.testimonial.author }), _jsx("div", { className: "text-sm text-gray-600", children: study.testimonial.position })] })] })] })] }) }, study.id))) }), _jsxs("div", { className: "mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center", children: [_jsx("h2", { className: "text-3xl font-bold mb-4", children: "Siz de Ba\u015Far\u0131ya Ula\u015F\u0131n!" }), _jsx("p", { className: "text-xl mb-6", children: "YolNet ile lojistik s\u00FCre\u00E7lerinizi optimize edin" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs("button", { className: "bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 text-lg", children: [_jsx(ArrowRight, { size: 20 }), "Hemen Ba\u015Flay\u0131n"] }), _jsxs("button", { className: "bg-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center gap-2 text-lg", children: [_jsx(Building2, { size: 20 }), "Kurumsal \u00C7\u00F6z\u00FCmler"] })] })] })] })] }));
}
