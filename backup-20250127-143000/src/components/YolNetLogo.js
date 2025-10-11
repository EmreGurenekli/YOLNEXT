import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const YolNetLogo = ({ size = 'md', className = '', showText = true, variant = 'default' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16'
    };
    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };
    const textColorClasses = {
        default: 'text-blue-600',
        white: 'text-white',
        dark: 'text-gray-900'
    };
    return (_jsxs("div", { className: `flex items-center gap-2 ${className}`, children: [_jsx("img", { src: "/logo.svg", alt: "YolNet Logo", className: `${sizeClasses[size]} object-contain` }), showText && (_jsx("span", { className: `font-bold ${textSizeClasses[size]} ${textColorClasses[variant]}`, children: "YolNet" }))] }));
};
export default YolNetLogo;
