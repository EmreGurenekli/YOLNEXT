class StorageService {
    constructor() {
        Object.defineProperty(this, "prefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'yolnet_'
        });
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    // Local Storage
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serializedValue);
        }
        catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    getItem(key, defaultValue) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue || null;
        }
        catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue || null;
        }
    }
    removeItem(key) {
        try {
            localStorage.removeItem(this.getKey(key));
        }
        catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
    // Session Storage
    setSessionItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            sessionStorage.setItem(this.getKey(key), serializedValue);
        }
        catch (error) {
            console.error('Error saving to sessionStorage:', error);
        }
    }
    getSessionItem(key, defaultValue) {
        try {
            const item = sessionStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue || null;
        }
        catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return defaultValue || null;
        }
    }
    removeSessionItem(key) {
        try {
            sessionStorage.removeItem(this.getKey(key));
        }
        catch (error) {
            console.error('Error removing from sessionStorage:', error);
        }
    }
    // Clear all app data
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            const sessionKeys = Object.keys(sessionStorage);
            sessionKeys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        }
        catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
    // Auth specific methods
    setAuthToken(token) {
        this.setItem('authToken', token);
    }
    getAuthToken() {
        return this.getItem('authToken');
    }
    removeAuthToken() {
        this.removeItem('authToken');
    }
    setUser(user) {
        this.setItem('user', user);
    }
    getUser() {
        return this.getItem('user');
    }
    removeUser() {
        this.removeItem('user');
    }
    // Settings specific methods
    setTheme(theme) {
        this.setItem('theme', theme);
    }
    getTheme() {
        return this.getItem('theme');
    }
    setLanguage(language) {
        this.setItem('language', language);
    }
    getLanguage() {
        return this.getItem('language');
    }
    // Form data persistence
    setFormData(formName, data) {
        this.setItem(`form_${formName}`, data);
    }
    getFormData(formName) {
        return this.getItem(`form_${formName}`);
    }
    removeFormData(formName) {
        this.removeItem(`form_${formName}`);
    }
    // Cache management
    setCache(key, data, ttl = 300000) {
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl
        };
        this.setItem(`cache_${key}`, cacheData);
    }
    getCache(key) {
        const cacheData = this.getItem(`cache_${key}`);
        if (!cacheData)
            return null;
        const { data, timestamp, ttl } = cacheData;
        const now = Date.now();
        if (now - timestamp > ttl) {
            this.removeItem(`cache_${key}`);
            return null;
        }
        return data;
    }
    removeCache(key) {
        this.removeItem(`cache_${key}`);
    }
    clearCache() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(`${this.prefix}cache_`)) {
                    localStorage.removeItem(key);
                }
            });
        }
        catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
    // Storage info
    getStorageInfo() {
        try {
            let used = 0;
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    used += localStorage.getItem(key)?.length || 0;
                }
            });
            // Estimate available space (5MB limit for most browsers)
            const total = 5 * 1024 * 1024; // 5MB in bytes
            const available = total - used;
            return {
                used,
                available: Math.max(0, available),
                total
            };
        }
        catch (error) {
            console.error('Error getting storage info:', error);
            return { used: 0, available: 0, total: 0 };
        }
    }
}
export const storageService = new StorageService();
