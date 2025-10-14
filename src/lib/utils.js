import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatCurrency(amount, currency = 'TRY') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}
export function formatDate(date) {
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}
export function formatDateTime(date) {
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
export function generateTrackingNumber() {
    const prefix = 'YN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `${prefix}${timestamp}${random}`;
}
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
export function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
export function validatePhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone);
}
export function validateTaxId(taxId) {
    const taxIdRegex = /^[0-9]{10}$/;
    return taxIdRegex.test(taxId.replace(/\s/g, ''));
}
export function getInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
export function getStatusColor(status) {
    switch (status) {
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'in_transit': return 'bg-blue-100 text-blue-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'in_progress': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
export function getStatusText(status) {
    switch (status) {
        case 'delivered': return 'Teslim Edildi';
        case 'in_transit': return 'Yolda';
        case 'pending': return 'Beklemede';
        case 'cancelled': return 'İptal Edildi';
        case 'completed': return 'Tamamlandı';
        case 'in_progress': return 'Devam Ediyor';
        default: return 'Bilinmiyor';
    }
}
