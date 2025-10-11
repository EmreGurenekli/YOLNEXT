import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react';
export default function ChatWindow({ isOpen, onClose, recipientId, recipientName, messages, onSendMessage }) {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed bottom-4 right-4 w-96 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 font-semibold", children: recipientName.charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: recipientName }), _jsx("p", { className: "text-sm text-gray-500", children: "\u00C7evrimi\u00E7i" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(Phone, { size: 16 }) }), _jsx("button", { className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(Video, { size: 16 }) }), _jsx("button", { className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(MoreVertical, { size: 16 }) }), _jsx("button", { onClick: onClose, className: "p-2 text-gray-600 hover:text-gray-900", children: "\u00D7" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs px-4 py-2 rounded-lg ${message.senderId === 'current-user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'}`, children: [_jsx("p", { className: "text-sm", children: message.content }), _jsx("p", { className: `text-xs mt-1 ${message.senderId === 'current-user' ? 'text-blue-100' : 'text-gray-500'}`, children: message.timestamp.toLocaleTimeString() })] }) }, message.id))), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsxs("form", { onSubmit: handleSendMessage, className: "flex items-center gap-2", children: [_jsx("button", { type: "button", className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(Paperclip, { size: 16 }) }), _jsx("input", { type: "text", value: newMessage, onChange: (e) => setNewMessage(e.target.value), placeholder: "Mesaj yaz\u0131n...", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { type: "button", className: "p-2 text-gray-600 hover:text-gray-900", children: _jsx(Smile, { size: 16 }) }), _jsx("button", { type: "submit", className: "p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: _jsx(Send, { size: 16 }) })] }) })] }));
}
