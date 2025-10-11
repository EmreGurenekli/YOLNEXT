import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Send, Phone, Video, MoreVertical, Smile } from 'lucide-react';
const RealtimeChat = ({ shipmentId, receiverId, receiverName, isOnline }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { socket, isConnected, sendMessage, joinShipment, leaveShipment, startTyping, stopTyping } = useSocket();
    useEffect(() => {
        if (socket && isConnected) {
            // Join shipment room
            joinShipment(shipmentId);
            // Listen for new messages
            socket.on('new_message', (data) => {
                if (data.shipmentId === shipmentId) {
                    setMessages(prev => [...prev, {
                            id: Date.now(),
                            senderId: data.senderId,
                            message: data.message,
                            timestamp: data.timestamp,
                            senderName: data.senderId === receiverId ? receiverName : 'Sen'
                        }]);
                }
            });
            // Listen for typing indicators
            socket.on('user_typing', (data) => {
                if (data.shipmentId === shipmentId && data.userId !== socket.id) {
                    setOtherUserTyping(data.isTyping);
                }
            });
            return () => {
                leaveShipment(shipmentId);
            };
        }
    }, [socket, isConnected, shipmentId, receiverId, receiverName]);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && isConnected) {
            sendMessage({
                shipmentId,
                message: newMessage.trim(),
                receiverId
            });
            setNewMessage('');
            stopTyping(shipmentId);
        }
    };
    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (e.target.value.trim() && !isTyping) {
            setIsTyping(true);
            startTyping(shipmentId);
        }
        else if (!e.target.value.trim() && isTyping) {
            setIsTyping(false);
            stopTyping(shipmentId);
        }
    };
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (_jsxs("div", { className: "flex flex-col h-96 bg-white rounded-lg shadow-lg", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold", children: receiverName.charAt(0).toUpperCase() }), _jsx("div", { className: `absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}` })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: receiverName }), _jsx("p", { className: "text-sm text-gray-500", children: isOnline ? 'Çevrimiçi' : 'Çevrimdışı' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors", children: _jsx(Phone, { className: "w-5 h-5" }) }), _jsx("button", { className: "p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors", children: _jsx(Video, { className: "w-5 h-5" }) }), _jsx("button", { className: "p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(MoreVertical, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 ? (_jsx("div", { className: "text-center text-gray-500 py-8", children: _jsx("p", { children: "Hen\u00FCz mesaj yok. \u0130lk mesaj\u0131 siz g\u00F6nderin!" }) })) : (messages.map((message) => (_jsx("div", { className: `flex ${message.senderId === receiverId ? 'justify-start' : 'justify-end'}`, children: _jsxs("div", { className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderId === receiverId
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-blue-600 text-white'}`, children: [_jsx("p", { className: "text-sm", children: message.message }), _jsx("p", { className: `text-xs mt-1 ${message.senderId === receiverId ? 'text-gray-500' : 'text-blue-100'}`, children: formatTime(message.timestamp) })] }) }, message.id)))), otherUserTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 px-4 py-2 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }), _jsx("span", { className: "text-xs text-gray-500 ml-2", children: "Yaz\u0131yor..." })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-4 border-t border-gray-200", children: [_jsxs("form", { onSubmit: handleSendMessage, className: "flex items-center gap-2", children: [_jsx("button", { type: "button", className: "p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors", children: _jsx(Smile, { className: "w-5 h-5" }) }), _jsx("input", { type: "text", value: newMessage, onChange: handleTyping, placeholder: "Mesaj\u0131n\u0131z\u0131 yaz\u0131n...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", disabled: !isConnected }), _jsx("button", { type: "submit", disabled: !newMessage.trim() || !isConnected, className: "p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", children: _jsx(Send, { className: "w-5 h-5" }) })] }), !isConnected && (_jsx("p", { className: "text-xs text-red-500 mt-2", children: "Ba\u011Flant\u0131 kesildi. Yeniden ba\u011Flan\u0131l\u0131yor..." }))] })] }));
};
export default RealtimeChat;
