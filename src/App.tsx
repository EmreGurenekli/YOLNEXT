import './App.css';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AppRoutes } from './config/routes';

function App() {

  useEffect(() => {
    if (!(import.meta as any)?.env?.DEV) return;
    let enabled = false;
    try {
      enabled = localStorage.getItem('debug:clicks') === '1';
    } catch {
      enabled = false;
    }
    if (!enabled) return;

    const summarizeEl = (el: HTMLElement | null) => {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id || undefined,
        className: (el.getAttribute('class') || '').slice(0, 200) || undefined,
        role: el.getAttribute('role') || undefined,
        testid: el.getAttribute('data-testid') || undefined,
        zIndex: cs.zIndex,
        position: cs.position,
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
      };
    };

    const summarizePath = (path: EventTarget[] | undefined) => {
      if (!Array.isArray(path)) return [];
      return path
        .filter((x): x is HTMLElement => x instanceof HTMLElement)
        .slice(0, 8)
        .map((el) => {
          const cs = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            id: el.id || undefined,
            className: (el.getAttribute('class') || '').slice(0, 120) || undefined,
            zIndex: cs.zIndex,
            position: cs.position,
            pointerEvents: cs.pointerEvents,
          };
        });
    };

    const clickHandler = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const elAtPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;

        const walkOverlay = (start: HTMLElement | null) => {
          let cur: HTMLElement | null = start;
          for (let i = 0; i < 8 && cur; i++) {
            const cs = window.getComputedStyle(cur);
            const isOverlayLike =
              (cs.position === 'fixed' || cs.position === 'sticky') &&
              cs.pointerEvents !== 'none' &&
              cs.opacity !== '0';
            if (isOverlayLike) return summarizeEl(cur);
            cur = cur.parentElement;
          }
          return null;
        };

        const data = {
          type: e.type,
          x: e.clientX,
          y: e.clientY,
          target: summarizeEl(target),
          elementFromPoint: summarizeEl(elAtPoint),
          overlayCandidate: walkOverlay(elAtPoint) || walkOverlay(target),
        };

        if (import.meta.env.DEV) {
          console.log('[debug:clicks]', data);
        }
      } catch {
        // ignore
      }
    };

    const pointerHandler = (e: Event) => {
      try {
        const ev = e as MouseEvent;
        const target = ev.target as HTMLElement | null;
        const isSelect = target?.tagName === 'SELECT' || target?.closest?.('select');
        if (!isSelect) return;

        const anyEv = ev as any;
        const path = typeof anyEv.composedPath === 'function' ? (anyEv.composedPath() as EventTarget[]) : undefined;
        if (import.meta.env.DEV) {
          console.log('[debug:clicks]', {
            type: ev.type,
            defaultPrevented: anyEv.defaultPrevented === true,
            target: summarizeEl(target),
            path: summarizePath(path),
          });
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener('pointerdown', pointerHandler, true);
    document.addEventListener('mousedown', pointerHandler, true);
    document.addEventListener('click', clickHandler, true);
    return () => {
      document.removeEventListener('pointerdown', pointerHandler, true);
      document.removeEventListener('mousedown', pointerHandler, true);
      document.removeEventListener('click', clickHandler, true);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <div className='App'>
              <AppRoutes />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

