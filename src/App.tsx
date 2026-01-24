/**
 * 🏠 YOLNEXT FRONTEND APPLICATION ROOT
 * 
 * BUSINESS PURPOSE: Single Page Application (SPA) for logistics marketplace
 * Serves different interfaces based on user type after authentication
 * 
 * USER JOURNEYS SUPPORTED:
 * 👤 Individual Users: Personal shipment management, tracking
 * 🏢 Corporate Users: Business shipment management, bulk operations
 * 🚛 Nakliyeci: Logistics companies - view market, manage offers/jobs
 * 🚚 Tasiyici: Individual carriers - find jobs, manage deliveries  
 * 👨‍💼 Admin: System management, user oversight, analytics
 * 
 * TECHNICAL ARCHITECTURE:
 * - React 18 with TypeScript for type safety
 * - Context providers for global state management
 * - Error boundaries for graceful error handling
 * - Responsive design (mobile-first approach)
 * - SEO optimized with React Helmet
 * 
 * GLOBAL PROVIDERS (Wrapping all components):
 * 🔐 AuthProvider - User authentication state, JWT management
 * 🎨 ThemeProvider - Dark/light mode, UI customization  
 * 🔔 NotificationProvider - Real-time notifications, WebSocket
 * 🍞 ToastProvider - Success/error message popups
 * 🛡️ ErrorBoundary - Catches JavaScript errors, prevents crashes
 * 
 * ROUTING STRUCTURE:
 * /individual/* - Personal user dashboard, shipments, tracking
 * /corporate/* - Business user interface, bulk operations
 * /nakliyeci/* - Logistics company interface, market, jobs
 * /tasiyici/* - Individual carrier interface, available jobs
 * /admin/* - Administrative panel, system management
 * /tracking/* - Public tracking (no login required)
 */

import './App.css';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/shared-ui-elements/ErrorBoundary';
import { AppRoutes } from './config/routes';

function App() {


  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <div className='App'>
                  <AppRoutes />
                </div>
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;











