/**
 * Route Configuration
 * Centralized route definitions for the application
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ADMIN_SLUG } from './admin';

// Public pages
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import EmailVerification from '../pages/EmailVerification';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import CookiePolicy from '../pages/CookiePolicy';
import KVKKAydinlatma from '../pages/KVKKAydinlatma';
import ConsumerRights from '../pages/ConsumerRights';
import DistanceSellingContract from '../pages/DistanceSellingContract';
import NotFoundPage from '../pages/NotFound';

// Layouts
import IndividualLayout from '../components/IndividualLayout';
import CorporateLayout from '../components/CorporateLayout';
import NakliyeciLayout from '../components/NakliyeciLayout';
import TasiyiciLayout from '../components/TasiyiciLayout';
import MobileOptimizedLayout from '../components/mobile/MobileOptimizedLayout';

// Components
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminGuard from '../components/admin/AdminGuard';
import AdminLayout from '../components/admin/AdminLayout';
import CookieConsentBanner from '../components/common/CookieConsentBanner';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import CostCalculator from '../components/calculators/CostCalculator';
import CaseStudies from '../components/case-studies/CaseStudies';
import CommissionCalculator from '../components/calculators/CommissionCalculator';

// Individual pages
import IndividualDashboard from '../pages/individual/Dashboard';
import CreateShipment from '../pages/individual/CreateShipment';
import IndividualMessages from '../pages/individual/Messages';
import IndividualOffers from '../pages/individual/Offers';
import MyShipments from '../pages/individual/MyShipments';
import IndividualHistory from '../pages/individual/History';
import IndividualLiveTracking from '../pages/individual/LiveTracking';
import IndividualSettings from '../pages/individual/Settings';
import IndividualSupport from '../pages/individual/Support';
import IndividualHelp from '../pages/individual/Help';

// Corporate pages
import CorporateDashboard from '../pages/corporate/Dashboard';
import CorporateCreateShipment from '../pages/corporate/CreateShipment';
import CorporateAnalytics from '../pages/corporate/Analytics';
import CorporateMessages from '../pages/corporate/Messages';
import CorporateSettings from '../pages/corporate/Settings';
import CorporateCarriers from '../pages/corporate/Carriers';
import CorporateHelp from '../pages/corporate/Help';
import CorporateOffers from '../pages/corporate/Offers';

// Nakliyeci pages
import NakliyeciDashboard from '../pages/nakliyeci/Dashboard';
import NakliyeciOffers from '../pages/nakliyeci/Offers';
import NakliyeciAnalytics from '../pages/nakliyeci/Analytics';
import NakliyeciMessages from '../pages/nakliyeci/Messages';
import NakliyeciSettings from '../pages/nakliyeci/Settings';
import NakliyeciHelp from '../pages/nakliyeci/Help';
import NakliyeciJobs from '../pages/nakliyeci/Jobs';
import NakliyeciRoutePlanner from '../pages/nakliyeci/RoutePlanner';
import NakliyeciDrivers from '../pages/nakliyeci/Drivers';
import NakliyeciWallet from '../pages/nakliyeci/Wallet';
import NakliyeciActiveShipments from '../pages/nakliyeci/ActiveShipments';
import NakliyeciListings from '../pages/nakliyeci/Listings';

// Tasiyici pages
import TasiyiciDashboard from '../pages/tasiyici/Dashboard';
import TasiyiciJobs from '../pages/tasiyici/Jobs';
import TasiyiciMyOffers from '../pages/tasiyici/MyOffers';
import TasiyiciMessages from '../pages/tasiyici/Messages';
import TasiyiciSettings from '../pages/tasiyici/Settings';
import TasiyiciActiveJobs from '../pages/tasiyici/ActiveJobs';
import TasiyiciCompletedJobs from '../pages/tasiyici/CompletedJobs';
import TasiyiciMarket from '../pages/tasiyici/Market';
import TasiyiciIslerim from '../pages/tasiyici/Islerim';
import TasiyiciHelp from '../pages/tasiyici/Help';

// Admin pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminUsers from '../pages/admin/Users';
import AdminIndexRedirect from '../pages/admin/IndexRedirect';
import AdminOps from '../pages/admin/Ops';
import AdminOperations from '../pages/admin/Operations';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminCases from '../pages/admin/Cases';
import AdminFlags from '../pages/admin/Flags';
import AdminSupportManagement from '../pages/admin/SupportManagement';
import { useParams } from 'react-router-dom';

// Redirect component
const IndividualShipmentToMyShipmentsRedirect: React.FC = () => {
  const { id } = useParams();
  const sid = id ? encodeURIComponent(String(id)) : '';
  return <Navigate to={`/individual/my-shipments?shipmentId=${sid}`} replace />;
};

/**
 * Application Routes Component
 */
export const AppRoutes: React.FC = () => {
  const adminBase = `/${ADMIN_SLUG}`;

  return (
    <>
      <CookieConsentBanner />
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/email-verification' element={<EmailVerification />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/cookie-policy' element={<CookiePolicy />} />
        <Route path='/kvkk-aydinlatma' element={<KVKKAydinlatma />} />
        <Route path='/consumer-rights' element={<ConsumerRights />} />
        <Route path='/distance-selling-contract' element={<DistanceSellingContract />} />

        {/* Utility Routes */}
        <Route path='/dashboard' element={<IndividualDashboard />} />
        <Route path='/individual/tracking' element={<Navigate to='/individual/live-tracking' replace />} />
        <Route path='/tasiyici/jobs' element={<Navigate to='/tasiyici/active-jobs' replace />} />
        <Route path='/onboarding' element={<OnboardingWizard />} />
        <Route path='/cost-calculator' element={<CostCalculator />} />
        <Route path='/case-studies' element={<CaseStudies />} />
        <Route path='/commission-calculator' element={<CommissionCalculator />} />
        <Route
          path='/mobile'
          element={
            <MobileOptimizedLayout userType='individual' title='Mobil Panel'>
              <div>Mobil Panel İçeriği</div>
            </MobileOptimizedLayout>
          }
        />

        {/* Admin Routes */}
        <Route path={`${adminBase}/login`} element={<AdminLogin />} />
        <Route
          path={adminBase}
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminIndexRedirect />} />
          <Route path='command-center' element={<Navigate to={`${adminBase}/ops`} replace />} />
          <Route path='assistant' element={<Navigate to={`${adminBase}/ops`} replace />} />
          <Route path='inbox' element={<Navigate to={`${adminBase}/ops`} replace />} />
          <Route path='dashboard' element={<AdminDashboard />} />
          <Route path='search' element={<Navigate to={`${adminBase}/ops`} replace />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='ops' element={<AdminOperations />} />
          <Route path='system' element={<AdminOps />} />
          <Route path='cases' element={<AdminCases />} />
          <Route path='complaints' element={<Navigate to={`${adminBase}/system`} replace />} />
          <Route path='flags' element={<AdminFlags />} />
          <Route path='support' element={<AdminSupportManagement />} />
          <Route path='planner' element={<Navigate to={`${adminBase}/ops`} replace />} />
          <Route path='audit' element={<Navigate to={`${adminBase}/system`} replace />} />
        </Route>

        {/* Individual Routes */}
        <Route
          path='/individual'
          element={
            <ProtectedRoute requiredRole='individual'>
              <IndividualLayout />
            </ProtectedRoute>
          }
        >
          <Route path='dashboard' element={<IndividualDashboard />} />
          <Route path='create-shipment' element={<CreateShipment />} />
          <Route path='offers' element={<IndividualOffers />} />
          <Route path='my-shipments' element={<MyShipments />} />
          <Route path='shipment-detail/:id' element={<IndividualShipmentToMyShipmentsRedirect />} />
          <Route path='shipments/:id' element={<IndividualShipmentToMyShipmentsRedirect />} />
          <Route path='history' element={<IndividualHistory />} />
          <Route path='live-tracking' element={<IndividualLiveTracking />} />
          <Route path='messages' element={<IndividualMessages />} />
          <Route path='settings' element={<IndividualSettings />} />
          <Route path='help' element={<IndividualHelp />} />
        </Route>

        {/* Corporate Routes */}
        <Route
          path='/corporate'
          element={
            <ProtectedRoute requiredRole='corporate'>
              <CorporateLayout />
            </ProtectedRoute>
          }
        >
          <Route path='dashboard' element={<CorporateDashboard />} />
          <Route path='shipments/new' element={<Navigate to='/corporate/create-shipment' replace />} />
          <Route path='shipments/:id' element={<Navigate to='/corporate/shipments' replace />} />
          <Route path='create-shipment' element={<CorporateCreateShipment />} />
          <Route path='shipments' element={<MyShipments basePath='/corporate' />} />
          <Route path='offers' element={<CorporateOffers />} />
          <Route path='analytics' element={<CorporateAnalytics />} />
          <Route path='live-tracking' element={<IndividualLiveTracking />} />
          <Route path='tracking' element={<Navigate to='/corporate/live-tracking' replace />} />
          <Route path='messages' element={<CorporateMessages />} />
          <Route path='settings' element={<CorporateSettings />} />
          <Route path='carriers' element={<CorporateCarriers />} />
          <Route path='help' element={<CorporateHelp />} />
        </Route>

        {/* Nakliyeci Routes */}
        <Route
          path='/nakliyeci'
          element={
            <ProtectedRoute requiredRole='nakliyeci'>
              <NakliyeciLayout />
            </ProtectedRoute>
          }
        >
          <Route path='dashboard' element={<NakliyeciDashboard />} />
          <Route path='jobs' element={<NakliyeciJobs />} />
          <Route path='route-planner' element={<NakliyeciRoutePlanner />} />
          <Route path='offers' element={<NakliyeciOffers />} />
          <Route path='listings' element={<NakliyeciListings />} />
          <Route path='drivers' element={<NakliyeciDrivers />} />
          <Route path='active-shipments' element={<NakliyeciActiveShipments />} />
          <Route path='analytics' element={<NakliyeciAnalytics />} />
          <Route path='messages' element={<NakliyeciMessages />} />
          <Route path='wallet' element={<NakliyeciWallet />} />
          <Route path='settings' element={<NakliyeciSettings />} />
          <Route path='help' element={<NakliyeciHelp />} />
        </Route>

        {/* Tasiyici Routes */}
        <Route
          path='/tasiyici'
          element={
            <ProtectedRoute requiredRole='tasiyici'>
              <TasiyiciLayout />
            </ProtectedRoute>
          }
        >
          <Route path='dashboard' element={<TasiyiciDashboard />} />
          <Route path='jobs/:id' element={<TasiyiciJobs />} />
          <Route path='market' element={<TasiyiciMarket />} />
          <Route path='islerim' element={<TasiyiciIslerim />} />
          <Route path='my-offers' element={<TasiyiciMyOffers />} />
          <Route path='active-jobs' element={<TasiyiciActiveJobs />} />
          <Route path='completed-jobs' element={<TasiyiciCompletedJobs />} />
          <Route path='messages' element={<TasiyiciMessages />} />
          <Route path='settings' element={<TasiyiciSettings />} />
          <Route path='help' element={<TasiyiciHelp />} />
        </Route>

        {/* 404 Route */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  );
};
