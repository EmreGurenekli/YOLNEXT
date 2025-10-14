import { useState, useEffect } from 'react';
export const usePushNotifications = () => {
    const [state, setState] = useState({
        isSupported: false,
        permission: 'default',
        isSubscribed: false,
        subscription: null
    });
    useEffect(() => {
        // Check if push notifications are supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setState(prev => ({ ...prev, isSupported: true }));
            // Check current permission
            setState(prev => ({
                ...prev,
                permission: Notification.permission
            }));
            // Check if already subscribed
            checkSubscription();
        }
    }, []);
    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setState(prev => ({
                ...prev,
                isSubscribed: !!subscription,
                subscription
            }));
        }
        catch (error) {
            console.error('Error checking subscription:', error);
        }
    };
    const requestPermission = async () => {
        if (!state.isSupported) {
            console.warn('Push notifications are not supported');
            return false;
        }
        try {
            const permission = await Notification.requestPermission();
            setState(prev => ({ ...prev, permission }));
            return permission === 'granted';
        }
        catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    };
    const subscribe = async () => {
        if (!state.isSupported || state.permission !== 'granted') {
            console.warn('Push notifications not supported or permission not granted');
            return false;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            // VAPID public key (you should get this from your server)
            const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0FyHpQw8XWMh4O7Q1X5P9VKv1z2J8gQ4vL8kS6nH9jF2dA7cE1mB5iG3oK8pL6nM9qR4sT7uV2wX5yZ8aB1cD4eF7gH0jK3mN6pQ9sT2uV5wX8yZ';
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
            setState(prev => ({
                ...prev,
                isSubscribed: true,
                subscription
            }));
            // Send subscription to server
            await sendSubscriptionToServer(subscription);
            return true;
        }
        catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        }
    };
    const unsubscribe = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setState(prev => ({
                    ...prev,
                    isSubscribed: false,
                    subscription: null
                }));
                // Notify server about unsubscription
                await sendUnsubscriptionToServer(subscription);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            return false;
        }
    };
    const sendSubscriptionToServer = async (subscription) => {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(subscription)
            });
            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }
        }
        catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    };
    const sendUnsubscriptionToServer = async (subscription) => {
        try {
            const response = await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(subscription)
            });
            if (!response.ok) {
                throw new Error('Failed to send unsubscription to server');
            }
        }
        catch (error) {
            console.error('Error sending unsubscription to server:', error);
        }
    };
    return {
        ...state,
        requestPermission,
        subscribe,
        unsubscribe
    };
};
// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
