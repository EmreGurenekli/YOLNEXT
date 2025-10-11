import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Truck, DollarSign, Clock, MessageSquare } from 'lucide-react';
export default function CreateOfferModal({ isOpen, onClose, onSubmit, shipmentId, shipmentDetails }) {
    const [formData, setFormData] = useState({
        price: 0,
        estimatedDelivery: '',
        vehicleType: 'kamyon',
        capacity: 0,
        message: ''
    });
    const [errors, setErrors] = useState({});
    const vehicleTypes = [
        { value: 'kamyon', label: 'Kamyon' },
        { value: 'kamyonet', label: 'Kamyonet' },
        { value: 'tir', label: 'Tır' },
        { value: 'minibus', label: 'Minibüs' }
    ];
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (formData.price <= 0) {
            newErrors.price = 'Fiyat 0\'dan büyük olmalıdır';
        }
        if (!formData.estimatedDelivery) {
            newErrors.estimatedDelivery = 'Tahmini teslimat tarihi gereklidir';
        }
        if (formData.capacity <= 0) {
            newErrors.capacity = 'Kapasite 0\'dan büyük olmalıdır';
        }
        if (shipmentDetails && formData.capacity < shipmentDetails.weight) {
            newErrors.capacity = 'Kapasite gönderi ağırlığından küçük olamaz';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
            setFormData({
                price: 0,
                estimatedDelivery: '',
                vehicleType: 'kamyon',
                capacity: 0,
                message: ''
            });
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity", onClick: onClose }), _jsxs("div", { className: "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Teklif Olu\u015Ftur" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 mb-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-3", children: "G\u00F6nderi Detaylar\u0131" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Kalk\u0131\u015F:" }), _jsx("p", { className: "font-medium", children: shipmentDetails.from })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Var\u0131\u015F:" }), _jsx("p", { className: "font-medium", children: shipmentDetails.to })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "A\u011F\u0131rl\u0131k:" }), _jsxs("p", { className: "font-medium", children: [shipmentDetails.weight, " kg"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Hacim:" }), _jsxs("p", { className: "font-medium", children: [shipmentDetails.volume, " m\u00B3"] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(DollarSign, { className: "w-4 h-4 inline mr-2" }), "Teklif Fiyat\u0131 (\u20BA)"] }), _jsx("input", { type: "number", value: formData.price, onChange: (e) => handleInputChange('price', Number(e.target.value)), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'}`, placeholder: "0" }), errors.price && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.price }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Clock, { className: "w-4 h-4 inline mr-2" }), "Tahmini Teslimat Tarihi"] }), _jsx("input", { type: "date", value: formData.estimatedDelivery, onChange: (e) => handleInputChange('estimatedDelivery', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.estimatedDelivery ? 'border-red-300' : 'border-gray-300'}` }), errors.estimatedDelivery && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.estimatedDelivery }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Truck, { className: "w-4 h-4 inline mr-2" }), "Ara\u00E7 T\u00FCr\u00FC"] }), _jsx("select", { value: formData.vehicleType, onChange: (e) => handleInputChange('vehicleType', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: vehicleTypes.map((type) => (_jsx("option", { value: type.value, children: type.label }, type.value))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Truck, { className: "w-4 h-4 inline mr-2" }), "Ara\u00E7 Kapasitesi (kg)"] }), _jsx("input", { type: "number", value: formData.capacity, onChange: (e) => handleInputChange('capacity', Number(e.target.value)), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`, placeholder: "0" }), errors.capacity && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.capacity }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(MessageSquare, { className: "w-4 h-4 inline mr-2" }), "Mesaj (Opsiyonel)"] }), _jsx("textarea", { value: formData.message, onChange: (e) => handleInputChange('message', e.target.value), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "G\u00F6ndericiye iletmek istedi\u011Finiz mesaj..." })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors", children: "\u0130ptal" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold", children: "Teklif G\u00F6nder" })] })] })] })] }) }));
}
