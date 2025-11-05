class StorageService {
  private prefix = 'YolNext_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Local Storage
  setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue || null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Session Storage
  setSessionItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }

  getSessionItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue || null;
    }
  }

  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }

  // Clear all app data
  clearAll(): void {
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
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Auth specific methods
  setAuthToken(token: string): void {
    this.setItem('authToken', token);
  }

  getAuthToken(): string | null {
    return this.getItem<string>('authToken');
  }

  removeAuthToken(): void {
    this.removeItem('authToken');
  }

  setUser(user: any): void {
    this.setItem('user', user);
  }

  getUser(): any | null {
    return this.getItem('user');
  }

  removeUser(): void {
    this.removeItem('user');
  }

  // Settings specific methods
  setTheme(theme: string): void {
    this.setItem('theme', theme);
  }

  getTheme(): string | null {
    return this.getItem<string>('theme');
  }

  setLanguage(language: string): void {
    this.setItem('language', language);
  }

  getLanguage(): string | null {
    return this.getItem<string>('language');
  }

  // Form data persistence
  setFormData(formName: string, data: any): void {
    this.setItem(`form_${formName}`, data);
  }

  getFormData(formName: string): any | null {
    return this.getItem(`form_${formName}`);
  }

  removeFormData(formName: string): void {
    this.removeItem(`form_${formName}`);
  }

  // Cache management
  setCache(key: string, data: any, ttl: number = 300000): void {
    // 5 minutes default
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.setItem(`cache_${key}`, cacheData);
  }

  getCache<T>(key: string): T | null {
    const cacheData = this.getItem(`cache_${key}`);
    if (!cacheData) return null;

    const { data, timestamp, ttl } = cacheData as {
      data: any;
      timestamp: number;
      ttl: number;
    };
    const now = Date.now();

    if (now - timestamp > ttl) {
      this.removeItem(`cache_${key}`);
      return null;
    }

    return data;
  }

  removeCache(key: string): void {
    this.removeItem(`cache_${key}`);
  }

  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}cache_`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Storage info
  getStorageInfo(): { used: number; available: number; total: number } {
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
        total,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}

export const storageService = new StorageService();
