import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle, Clock, AlertCircle, Truck, MapPin, Package } from 'lucide-react';
export default function TrackingTimeline({ updates, currentStatus }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500 text-white';
            case 'in-progress':
                return 'bg-blue-500 text-white';
            case 'pending':
                return 'bg-gray-400 text-white';
            case 'cancelled':
                return 'bg-red-500 text-white';
            default:
                return 'bg-gray-400 text-white';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return _jsx(CheckCircle, { className: "w-5 h-5" });
            case 'in-progress':
                return _jsx(Clock, { className: "w-5 h-5" });
            case 'pending':
                return _jsx(Clock, { className: "w-5 h-5" });
            case 'cancelled':
                return _jsx(AlertCircle, { className: "w-5 h-5" });
            default:
                return _jsx(Clock, { className: "w-5 h-5" });
        }
    };
    const getEventIcon = (event) => {
        if (event.icon) {
            return _jsx(event.icon, { className: "w-5 h-5" });
        }
        switch (event.title.toLowerCase()) {
            case 'gönderi alındı':
                return _jsx(Package, { className: "w-5 h-5" });
            case 'yola çıktı':
                return _jsx(Truck, { className: "w-5 h-5" });
            case 'teslim edildi':
                return _jsx(CheckCircle, { className: "w-5 h-5" });
            default:
                return _jsx(Clock, { className: "w-5 h-5" });
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(Truck, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Takip Durumu" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["G\u00F6nderi durumu: ", currentStatus] })] })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" }), _jsx("div", { className: "space-y-6", children: updates.map((event, index) => (_jsxs("div", { className: "relative flex items-start gap-4", children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(event.status)}`, children: getEventIcon(event) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: event.title }), _jsxs("span", { className: "text-sm text-gray-500", children: [event.timestamp.toLocaleDateString(), " ", event.timestamp.toLocaleTimeString()] })] }), _jsx("p", { className: "text-gray-600 mt-1", children: event.description }), event.location && (_jsxs("div", { className: "flex items-center gap-2 mt-2 text-sm text-gray-500", children: [_jsx(MapPin, { className: "w-4 h-4" }), _jsx("span", { children: event.location })] }))] })] }, event.id))) })] }), _jsx("div", { className: "mt-6 p-4 bg-blue-50 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center", children: _jsx(Truck, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-blue-900", children: "Mevcut Durum" }), _jsx("p", { className: "text-sm text-blue-700", children: currentStatus })] })] }) })] }));
}
