import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onTab?: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onSpace,
    onTab,
    enabled = true,
    preventDefault = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          if (preventDefault) event.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          if (preventDefault) event.preventDefault();
          onEscape();
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          if (preventDefault) event.preventDefault();
          onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          if (preventDefault) event.preventDefault();
          onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          if (preventDefault) event.preventDefault();
          onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          if (preventDefault) event.preventDefault();
          onArrowRight();
        }
        break;
      case ' ':
        if (onSpace) {
          if (preventDefault) event.preventDefault();
          onSpace();
        }
        break;
      case 'Tab':
        if (onTab) {
          if (preventDefault) event.preventDefault();
          onTab();
        }
        break;
    }
  }, [
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onSpace,
    onTab,
    enabled,
    preventDefault
  ]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
};

// Focus management hook
export const useFocusManagement = () => {
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const focusNext = useCallback((currentSelector: string) => {
    const currentElement = document.querySelector(currentSelector) as HTMLElement;
    if (currentElement) {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const currentIndex = Array.from(focusableElements).indexOf(currentElement);
      const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
      if (nextElement) {
        nextElement.focus();
      }
    }
  }, []);

  const focusPrevious = useCallback((currentSelector: string) => {
    const currentElement = document.querySelector(currentSelector) as HTMLElement;
    if (currentElement) {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const currentIndex = Array.from(focusableElements).indexOf(currentElement);
      const previousElement = focusableElements[currentIndex - 1] as HTMLElement;
      if (previousElement) {
        previousElement.focus();
      }
    }
  }, []);

  return { focusElement, focusNext, focusPrevious };
};

