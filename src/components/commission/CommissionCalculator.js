import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calculator, DollarSign, Percent, TrendingUp, Info } from 'lucide-react';
export default function CommissionCalculator() {
    const [formData, setFormData] = useState({
        shipmentValue: 0,
        userType: 'individual',
        monthlyVolume: 0,
        loyaltyLevel: 'bronze'
    });
    const [calculation, setCalculation] = useState(null);
    const userTypes = [
        { value: 'individual', label: 'Bireysel', baseRate: 0.01 },
        { value: 'corporate', label: 'Kurumsal', baseRate: 0.008 },
        { value: 'nakliyeci', label: 'Nakliyeci', baseRate: 0.01 },
        { value: 'tasiyici', label: 'Taşıyıcı', baseRate: 0.01 }
    ];
    const loyaltyLevels = [
        { value: 'bronze', label: 'Bronz', discount: 0 },
        { value: 'silver', label: 'Gümüş', discount: 0.1 },
        { value: 'gold', label: 'Altın', discount: 0.2 },
        { value: 'platinum', label: 'Platin', discount: 0.3 }
    ];
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const calculateCommission = () => {
        const selectedUserType = userTypes.find(u => u.value === formData.userType);
        const selectedLoyalty = loyaltyLevels.find(l => l.value === formData.loyaltyLevel);
        if (!selectedUserType || !selectedLoyalty)
            return;
        const baseCommission = formData.shipmentValue * selectedUserType.baseRate;
        // Hacim indirimi
        let volumeDiscount = 0;
        if (formData.monthlyVolume >= 100) {
            volumeDiscount = baseCommission * 0.2; // %20 indirim
        }
        else if (formData.monthlyVolume >= 50) {
            volumeDiscount = baseCommission * 0.1; // %10 indirim
        }
        // Sadakat indirimi
        const loyaltyDiscount = baseCommission * selectedLoyalty.discount;
        const totalDiscount = volumeDiscount + loyaltyDiscount;
        const finalCommission = baseCommission - totalDiscount;
        const netAmount = formData.shipmentValue - finalCommission;
        setCalculation({
            shipmentValue: formData.shipmentValue,
            commissionRate: selectedUserType.baseRate,
            commissionAmount: finalCommission,
            netAmount,
            breakdown: {
                baseCommission,
                volumeDiscount,
                loyaltyDiscount,
                totalDiscount
            }
        });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Komisyon Hesaplay\u0131c\u0131 - YolNet" }), _jsx("meta", { name: "description", content: "YolNet komisyon hesaplay\u0131c\u0131 ile komisyon maliyetinizi hesaplay\u0131n" })] }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Komisyon Hesaplay\u0131c\u0131" }), _jsx("p", { className: "text-xl text-gray-600", children: "YolNet komisyon maliyetinizi hesaplay\u0131n ve tasarruf f\u0131rsatlar\u0131n\u0131 ke\u015Ffedin" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Hesaplama Bilgileri" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(DollarSign, { className: "w-4 h-4 inline mr-2" }), "G\u00F6nderi De\u011Feri (\u20BA)"] }), _jsx("input", { type: "number", value: formData.shipmentValue, onChange: (e) => handleInputChange('shipmentValue', Number(e.target.value)), placeholder: "10000", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Percent, { className: "w-4 h-4 inline mr-2" }), "Kullan\u0131c\u0131 T\u00FCr\u00FC"] }), _jsx("select", { value: formData.userType, onChange: (e) => handleInputChange('userType', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: userTypes.map((type) => (_jsxs("option", { value: type.value, children: [type.label, " (", (type.baseRate * 100).toFixed(1), "%)"] }, type.value))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(TrendingUp, { className: "w-4 h-4 inline mr-2" }), "Ayl\u0131k G\u00F6nderi Say\u0131s\u0131"] }), _jsx("input", { type: "number", value: formData.monthlyVolume, onChange: (e) => handleInputChange('monthlyVolume', Number(e.target.value)), placeholder: "25", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "50+ g\u00F6nderi: %10 indirim, 100+ g\u00F6nderi: %20 indirim" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Info, { className: "w-4 h-4 inline mr-2" }), "Sadakat Seviyesi"] }), _jsx("select", { value: formData.loyaltyLevel, onChange: (e) => handleInputChange('loyaltyLevel', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: loyaltyLevels.map((level) => (_jsxs("option", { value: level.value, children: [level.label, " (", (level.discount * 100).toFixed(0), "% indirim)"] }, level.value))) })] }), _jsxs("button", { onClick: calculateCommission, className: "w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2", children: [_jsx(Calculator, { className: "w-5 h-5" }), "Komisyon Hesapla"] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Hesaplama Sonucu" }), calculation ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 rounded-xl p-6 text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-blue-600 mb-2", children: ["\u20BA", calculation.commissionAmount.toLocaleString()] }), _jsx("div", { className: "text-gray-600", children: "Toplam Komisyon" }), _jsxs("div", { className: "text-sm text-gray-500 mt-1", children: ["(", (calculation.commissionRate * 100).toFixed(1), "% oran\u0131nda)"] })] }), _jsxs("div", { className: "bg-green-50 rounded-xl p-6 text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-green-600 mb-2", children: ["\u20BA", calculation.netAmount.toLocaleString()] }), _jsx("div", { className: "text-gray-600", children: "Net Alaca\u011F\u0131n\u0131z" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Komisyon D\u00F6k\u00FCm\u00FC" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Temel Komisyon" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.baseCommission.toLocaleString()] })] }), calculation.breakdown.volumeDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-green-600", children: [_jsx("span", { children: "Hacim \u0130ndirimi" }), _jsxs("span", { className: "font-medium", children: ["-\u20BA", calculation.breakdown.volumeDiscount.toLocaleString()] })] })), calculation.breakdown.loyaltyDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-green-600", children: [_jsx("span", { children: "Sadakat \u0130ndirimi" }), _jsxs("span", { className: "font-medium", children: ["-\u20BA", calculation.breakdown.loyaltyDiscount.toLocaleString()] })] })), _jsx("hr", { className: "my-2" }), _jsxs("div", { className: "flex justify-between text-lg font-bold", children: [_jsx("span", { children: "Toplam Komisyon" }), _jsxs("span", { children: ["\u20BA", calculation.commissionAmount.toLocaleString()] })] })] })] }), calculation.breakdown.totalDiscount > 0 && (_jsxs("div", { className: "bg-green-50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-green-700", children: [_jsx(TrendingUp, { className: "w-5 h-5" }), _jsx("span", { className: "font-semibold", children: "Tasarruf Sa\u011Flad\u0131n\u0131z!" })] }), _jsxs("p", { className: "text-sm text-green-600 mt-1", children: ["Toplam \u20BA", calculation.breakdown.totalDiscount.toLocaleString(), " tasarruf sa\u011Flad\u0131n\u0131z."] })] }))] })) : (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Calculator, { className: "w-16 h-16 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "Komisyon hesaplamak i\u00E7in formu doldurun" })] }))] })] }), _jsxs("div", { className: "mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Komisyon Sistemi Hakk\u0131nda" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx(Percent, { className: "w-6 h-6 text-blue-600" }) }), _jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "D\u00FC\u015F\u00FCk Komisyon" }), _jsx("p", { className: "text-sm text-gray-600", children: "Sadece %1 komisyon ile en d\u00FC\u015F\u00FCk maliyet" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx(TrendingUp, { className: "w-6 h-6 text-green-600" }) }), _jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Hacim \u0130ndirimi" }), _jsx("p", { className: "text-sm text-gray-600", children: "Daha fazla g\u00F6nderi, daha az komisyon" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx(Info, { className: "w-6 h-6 text-purple-600" }) }), _jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "\u015Eeffaf Fiyatland\u0131rma" }), _jsx("p", { className: "text-sm text-gray-600", children: "Gizli \u00FCcret yok, her \u015Fey a\u00E7\u0131k" })] })] })] })] })] }));
}
