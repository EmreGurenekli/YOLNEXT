import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage (only in browser)
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage (only in browser)
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const updateActualTheme = () => {
      if (theme === 'system') {
        try {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light';
          setActualTheme(systemTheme);
        } catch (error) {
          console.warn('Failed to detect system theme:', error);
          setActualTheme('light');
        }
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    // Listen for system theme changes
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (theme === 'system') {
          updateActualTheme();
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
          console.warn('Failed to remove media query listener:', error);
        }
      };
    } catch (error) {
      console.warn('Failed to set up theme listener:', error);
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme to document (only in browser)
    if (typeof document === 'undefined') return;
    try {
      const root = document.documentElement;
      if (!root) return;
      
      // Check if classList exists and is a DOMTokenList
      if (!root.classList || typeof root.classList.add !== 'function') {
        // Fallback: use className directly
        root.className = root.className.replace(/\b(light|dark)\b/g, '').trim() + ' ' + actualTheme;
        return;
      }
      
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
    } catch (error) {
      console.warn('Failed to apply theme to document:', error);
      // Fallback: try className directly
      try {
        const root = document.documentElement;
        if (root) {
          root.className = root.className.replace(/\b(light|dark)\b/g, '').trim() + ' ' + actualTheme;
        }
      } catch (fallbackError) {
        console.warn('Fallback theme application also failed:', fallbackError);
      }
    }
  }, [actualTheme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme bir ThemeProvider içinde kullanılmalıdır');
  }
  return context;
};
