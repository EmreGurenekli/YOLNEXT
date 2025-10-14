import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Truck, MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react';
export default function StatusUpdateModal({ isOpen, onClose, onSubmit, shipmentId, currentStatus }) {
    const [formData, setFormData] = useState({
        status: currentStatus,
        location: '',
        description: '',
        estimatedDelivery: ''
    });
    const [errors, setErrors] = useState({});
    const statusOptions = [
        { value: 'gönderi-alındı', label: 'Gönderi Alındı', icon: Package },
        { value: 'yola-çıktı', label: 'Yola Çıktı', icon: Truck },
        { value: 'teslim-edildi', label: 'Teslim Edildi', icon: CheckCircle },
        { value: 'gecikme', label: 'Gecikme', icon: AlertCircle }
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
        if (!formData.status) {
            newErrors.status = 'Durum seçimi gereklidir';
        }
        if (!formData.location) {
            newErrors.location = 'Konum bilgisi gereklidir';
        }
        if (!formData.description) {
            newErrors.description = 'Açıklama gereklidir';
        }
        if (formData.status === 'yola-çıktı' && !formData.estimatedDelivery) {
            newErrors.estimatedDelivery = 'Tahmini teslimat tarihi gereklidir';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
            setFormData({
                status: currentStatus,
                location: '',
                description: '',
                estimatedDelivery: ''
            });
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity", onClick: onClose }), _jsxs("div", { className: "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Durum G\u00FCncelle" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Durum" }), _jsxs("select", { value: formData.status, onChange: (e) => handleInputChange('status', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.status ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Durum se\u00E7in" }), statusOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] }), errors.status && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.status }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(MapPin, { className: "w-4 h-4 inline mr-2" }), "Konum"] }), _jsx("input", { type: "text", value: formData.location, onChange: (e) => handleInputChange('location', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Mevcut konum" }), errors.location && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.location }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "A\u00E7\u0131klama" }), _jsx("textarea", { value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), rows: 3, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Durum hakk\u0131nda detayl\u0131 a\u00E7\u0131klama..." }), errors.description && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.description }))] }), formData.status === 'yola-çıktı' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tahmini Teslimat Tarihi" }), _jsx("input", { type: "datetime-local", value: formData.estimatedDelivery, onChange: (e) => handleInputChange('estimatedDelivery', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.estimatedDelivery ? 'border-red-300' : 'border-gray-300'}` }), errors.estimatedDelivery && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.estimatedDelivery }))] }))] }), _jsxs("div", { className: "flex items-center justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors", children: "\u0130ptal" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold", children: "G\u00FCncelle" })] })] })] })] }) }));
}
