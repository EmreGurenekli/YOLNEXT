import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Download, Filter, Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users } from 'lucide-react';
export default function DetailedReporting() {
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedType, setSelectedType] = useState('all');
    const reportTemplates = [
        {
            id: '1',
            name: 'Gönderi Raporu',
            description: 'Gönderi istatistikleri ve analizi',
            category: 'shipment',
            isActive: true
        },
        {
            id: '2',
            name: 'Mali Rapor',
            description: 'Gelir ve gider analizi',
            category: 'financial',
            isActive: true
        },
        {
            id: '3',
            name: 'Performans Raporu',
            description: 'Operasyonel performans metrikleri',
            category: 'performance',
            isActive: true
        },
        {
            id: '4',
            name: 'Kullanıcı Raporu',
            description: 'Kullanıcı aktivite analizi',
            category: 'user',
            isActive: true
        }
    ];
    const sampleReports = [
        {
            id: '1',
            title: 'Aylık Gönderi Raporu',
            type: 'shipment',
            period: 'monthly',
            data: {
                labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                datasets: [{
                        label: 'Gönderi Sayısı',
                        data: [120, 150, 180, 200, 220, 250],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)'
                    }]
            },
            summary: {
                total: 250,
                change: 15.5,
                changeType: 'increase',
                period: 'Bu ay'
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
        },
        {
            id: '2',
            title: 'Gelir Analizi',
            type: 'financial',
            period: 'monthly',
            data: {
                labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                datasets: [{
                        label: 'Gelir (₺)',
                        data: [45000, 52000, 61000, 68000, 75000, 82000],
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 1)'
                    }]
            },
            summary: {
                total: 82000,
                change: 12.3,
                changeType: 'increase',
                period: 'Bu ay'
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
        }
    ];
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'shipment':
                return _jsx(Package, { className: "w-5 h-5" });
            case 'financial':
                return _jsx(DollarSign, { className: "w-5 h-5" });
            case 'performance':
                return _jsx(TrendingUp, { className: "w-5 h-5" });
            case 'user':
                return _jsx(Users, { className: "w-5 h-5" });
            default:
                return _jsx(BarChart3, { className: "w-5 h-5" });
        }
    };
    const getCategoryColor = (category) => {
        switch (category) {
            case 'shipment':
                return 'bg-blue-100 text-blue-600';
            case 'financial':
                return 'bg-green-100 text-green-600';
            case 'performance':
                return 'bg-purple-100 text-purple-600';
            case 'user':
                return 'bg-orange-100 text-orange-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Detayl\u0131 Raporlama - YolNet" }), _jsx("meta", { name: "description", content: "YolNet detayl\u0131 raporlama sistemi" })] }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Detayl\u0131 Raporlama" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Kapsaml\u0131 analiz ve raporlar olu\u015Fturun" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { className: "bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2", children: [_jsx(Filter, { size: 20 }), "Filtrele"] }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2", children: [_jsx(Download, { size: 20 }), "D\u0131\u015Fa Aktar"] })] })] }), _jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Rapor T\u00FCr\u00FC" }), _jsxs("select", { value: selectedType, onChange: (e) => setSelectedType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "T\u00FCm\u00FC" }), _jsx("option", { value: "shipment", children: "G\u00F6nderi" }), _jsx("option", { value: "financial", children: "Mali" }), _jsx("option", { value: "performance", children: "Performans" }), _jsx("option", { value: "user", children: "Kullan\u0131c\u0131" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Zaman Aral\u0131\u011F\u0131" }), _jsxs("select", { value: selectedPeriod, onChange: (e) => setSelectedPeriod(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "daily", children: "G\u00FCnl\u00FCk" }), _jsx("option", { value: "weekly", children: "Haftal\u0131k" }), _jsx("option", { value: "monthly", children: "Ayl\u0131k" }), _jsx("option", { value: "yearly", children: "Y\u0131ll\u0131k" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tarih Aral\u0131\u011F\u0131" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "date", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-gray-500", children: "-" }), _jsx("input", { type: "date", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Rapor \u015Eablonlar\u0131" }) }), _jsx("div", { className: "p-4 space-y-3", children: reportTemplates.map((template) => (_jsxs("div", { className: "p-4 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(template.category)}`, children: getCategoryIcon(template.category) }), _jsx("h3", { className: "font-semibold text-gray-900", children: template.name })] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: template.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: `px-2 py-1 rounded-full text-xs ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`, children: template.isActive ? 'Aktif' : 'Pasif' }), _jsx("button", { className: "text-blue-600 hover:text-blue-800 text-sm font-medium", children: "Kullan" })] })] }, template.id))) })] }) }), _jsx("div", { className: "lg:col-span-3", children: _jsx("div", { className: "space-y-6", children: sampleReports.map((report) => (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: report.title }), _jsxs("p", { className: "text-gray-600 mt-1", children: [report.period === 'monthly' ? 'Aylık' :
                                                                            report.period === 'weekly' ? 'Haftalık' :
                                                                                report.period === 'daily' ? 'Günlük' : 'Yıllık', " Rapor"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(Download, { size: 20 }) }), _jsx("button", { className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(Calendar, { size: 20 }) })] })] }) }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-blue-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { className: "text-sm font-medium text-blue-700", children: "Toplam" })] }), _jsx("div", { className: "text-2xl font-bold text-blue-900", children: report.type === 'financial' ? `₺${report.summary.total.toLocaleString()}` : report.summary.total.toLocaleString() })] }), _jsxs("div", { className: "bg-green-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [report.summary.changeType === 'increase' ?
                                                                                _jsx(TrendingUp, { className: "w-5 h-5 text-green-600" }) :
                                                                                _jsx(TrendingDown, { className: "w-5 h-5 text-red-600" }), _jsx("span", { className: "text-sm font-medium text-green-700", children: "De\u011Fi\u015Fim" })] }), _jsxs("div", { className: `text-2xl font-bold ${report.summary.changeType === 'increase' ? 'text-green-900' : 'text-red-900'}`, children: ["%", report.summary.change] })] }), _jsxs("div", { className: "bg-purple-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { className: "w-5 h-5 text-purple-600" }), _jsx("span", { className: "text-sm font-medium text-purple-700", children: "D\u00F6nem" })] }), _jsx("div", { className: "text-2xl font-bold text-purple-900", children: report.summary.period })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-8 text-center", children: [_jsx(BarChart3, { className: "w-16 h-16 mx-auto mb-4 text-gray-300" }), _jsx("p", { className: "text-gray-600", children: "Grafik burada g\u00F6r\u00FCnt\u00FClenecek" })] })] })] }, report.id))) }) })] })] })] }));
}
