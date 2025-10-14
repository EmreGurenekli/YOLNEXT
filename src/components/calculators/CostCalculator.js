import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calculator, Package, MapPin, Clock, DollarSign, Truck, Weight, Ruler } from 'lucide-react';
export default function CostCalculator() {
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        distance: 0,
        weight: 0,
        volume: 0,
        vehicleType: 'kamyon',
        priority: 'normal',
        insurance: false
    });
    const [calculation, setCalculation] = useState(null);
    const vehicleTypes = [
        { value: 'kamyon', label: 'Kamyon', baseRate: 2.5 },
        { value: 'kamyonet', label: 'Kamyonet', baseRate: 2.0 },
        { value: 'tir', label: 'Tır', baseRate: 3.0 },
        { value: 'minibus', label: 'Minibüs', baseRate: 1.8 }
    ];
    const priorities = [
        { value: 'normal', label: 'Normal', multiplier: 1.0 },
        { value: 'hizli', label: 'Hızlı', multiplier: 1.5 },
        { value: 'acil', label: 'Acil', multiplier: 2.0 }
    ];
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const calculateCost = () => {
        const selectedVehicle = vehicleTypes.find(v => v.value === formData.vehicleType);
        const selectedPriority = priorities.find(p => p.value === formData.priority);
        if (!selectedVehicle || !selectedPriority)
            return;
        const baseCost = 100; // Temel ücret
        const distanceCost = formData.distance * selectedVehicle.baseRate;
        const weightCost = formData.weight * 0.5; // kg başına 0.5 TL
        const volumeCost = formData.volume * 2; // m³ başına 2 TL
        const priorityCost = (baseCost + distanceCost) * (selectedPriority.multiplier - 1);
        const insuranceCost = formData.insurance ? (baseCost + distanceCost) * 0.1 : 0;
        const commission = (baseCost + distanceCost + weightCost + volumeCost + priorityCost + insuranceCost) * 0.01;
        const totalCost = baseCost + distanceCost + weightCost + volumeCost + priorityCost + insuranceCost + commission;
        const breakdown = {
            baseCost,
            distanceCost,
            weightCost,
            volumeCost,
            priorityCost,
            insuranceCost,
            commission
        };
        setCalculation({
            ...formData,
            totalCost,
            breakdown
        });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Maliyet Hesaplay\u0131c\u0131 - YolNet" }), _jsx("meta", { name: "description", content: "YolNet maliyet hesaplay\u0131c\u0131 ile ta\u015F\u0131ma maliyetinizi hesaplay\u0131n" })] }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Maliyet Hesaplay\u0131c\u0131" }), _jsx("p", { className: "text-xl text-gray-600", children: "Ta\u015F\u0131ma maliyetinizi hesaplay\u0131n ve en uygun fiyat\u0131 bulun" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "G\u00F6nderi Bilgileri" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(MapPin, { className: "w-4 h-4 inline mr-2" }), "Kalk\u0131\u015F \u015Eehri"] }), _jsx("input", { type: "text", value: formData.from, onChange: (e) => handleInputChange('from', e.target.value), placeholder: "\u0130stanbul", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(MapPin, { className: "w-4 h-4 inline mr-2" }), "Var\u0131\u015F \u015Eehri"] }), _jsx("input", { type: "text", value: formData.to, onChange: (e) => handleInputChange('to', e.target.value), placeholder: "Ankara", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Ruler, { className: "w-4 h-4 inline mr-2" }), "Mesafe (km)"] }), _jsx("input", { type: "number", value: formData.distance, onChange: (e) => handleInputChange('distance', Number(e.target.value)), placeholder: "450", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Weight, { className: "w-4 h-4 inline mr-2" }), "A\u011F\u0131rl\u0131k (kg)"] }), _jsx("input", { type: "number", value: formData.weight, onChange: (e) => handleInputChange('weight', Number(e.target.value)), placeholder: "2500", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Package, { className: "w-4 h-4 inline mr-2" }), "Hacim (m\u00B3)"] }), _jsx("input", { type: "number", value: formData.volume, onChange: (e) => handleInputChange('volume', Number(e.target.value)), placeholder: "45", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Truck, { className: "w-4 h-4 inline mr-2" }), "Ara\u00E7 T\u00FCr\u00FC"] }), _jsx("select", { value: formData.vehicleType, onChange: (e) => handleInputChange('vehicleType', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: vehicleTypes.map((vehicle) => (_jsx("option", { value: vehicle.value, children: vehicle.label }, vehicle.value))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Clock, { className: "w-4 h-4 inline mr-2" }), "\u00D6ncelik"] }), _jsx("select", { value: formData.priority, onChange: (e) => handleInputChange('priority', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: priorities.map((priority) => (_jsx("option", { value: priority.value, children: priority.label }, priority.value))) })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "insurance", checked: formData.insurance, onChange: (e) => handleInputChange('insurance', e.target.checked), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("label", { htmlFor: "insurance", className: "ml-2 text-sm font-medium text-gray-700", children: "Sigorta dahil" })] }), _jsxs("button", { onClick: calculateCost, className: "w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2", children: [_jsx(Calculator, { className: "w-5 h-5" }), "Maliyet Hesapla"] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Hesaplama Sonucu" }), calculation ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 rounded-xl p-6 text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-blue-600 mb-2", children: ["\u20BA", calculation.totalCost.toLocaleString()] }), _jsx("div", { className: "text-gray-600", children: "Toplam Ta\u015F\u0131ma Maliyeti" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Maliyet D\u00F6k\u00FCm\u00FC" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Temel \u00DCcret" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.baseCost.toLocaleString()] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Mesafe \u00DCcreti" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.distanceCost.toLocaleString()] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "A\u011F\u0131rl\u0131k \u00DCcreti" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.weightCost.toLocaleString()] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Hacim \u00DCcreti" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.volumeCost.toLocaleString()] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\u00D6ncelik \u00DCcreti" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.priorityCost.toLocaleString()] })] }), calculation.breakdown.insuranceCost > 0 && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Sigorta" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.insuranceCost.toLocaleString()] })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Komisyon (%1)" }), _jsxs("span", { className: "font-medium", children: ["\u20BA", calculation.breakdown.commission.toLocaleString()] })] }), _jsx("hr", { className: "my-2" }), _jsxs("div", { className: "flex justify-between text-lg font-bold", children: [_jsx("span", { children: "Toplam" }), _jsxs("span", { children: ["\u20BA", calculation.totalCost.toLocaleString()] })] })] })] }), _jsxs("div", { className: "bg-green-50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-green-700", children: [_jsx(DollarSign, { className: "w-5 h-5" }), _jsx("span", { className: "font-semibold", children: "Tasarruf F\u0131rsat\u0131" })] }), _jsx("p", { className: "text-sm text-green-600 mt-1", children: "Bu g\u00F6nderi i\u00E7in ortalama %15-20 tasarruf sa\u011Flayabilirsiniz." })] })] })) : (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Calculator, { className: "w-16 h-16 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "Maliyet hesaplamak i\u00E7in formu doldurun" })] }))] })] })] })] }));
}
