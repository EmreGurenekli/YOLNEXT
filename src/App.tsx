import './App.css';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ErrorBoundary from './components/error/ErrorBoundary';
import ErrorToast from './components/error/ErrorToast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFoundPage from './pages/NotFound';
import IndividualLayout from './components/IndividualLayout';
import CorporateLayout from './components/CorporateLayout';
import IndividualDashboard from './pages/individual/Dashboard';
import CorporateDashboard from './pages/corporate/Dashboard';
import CorporateCreateShipment from './pages/corporate/CreateShipment';
import CorporateShipments from './pages/corporate/Shipments';
import NakliyeciDashboard from './pages/nakliyeci/Dashboard';
import NakliyeciVehicleOptimization from './pages/nakliyeci/VehicleOptimization';
import NakliyeciOffers from './pages/nakliyeci/Offers';
import TasiyiciDashboard from './pages/tasiyici/Dashboard';
import CreateShipment from './pages/individual/CreateShipment';
import IndividualMessages from './pages/individual/Messages';
import IndividualOffers from './pages/individual/Offers';
import IndividualAgreements from './pages/individual/Agreements';
import IndividualShipments from './pages/individual/Shipments';
import MyShipments from './pages/individual/MyShipments';
import MyShipmentsNew from './pages/individual/MyShipmentsNew';
import IndividualHistory from './pages/individual/History';
import IndividualLiveTracking from './pages/individual/LiveTracking';
import IndividualShipmentDetail from './pages/individual/ShipmentDetail';
import IndividualNotifications from './pages/individual/Notifications';
import IndividualDiscounts from './pages/individual/Discounts';
import IndividualSettings from './pages/individual/Settings';
import CorporateAnalytics from './pages/corporate/Analytics';
import CorporateTeam from './pages/corporate/Team';
import CorporateReports from './pages/corporate/Reports';
import CorporateMessages from './pages/corporate/Messages';
import CorporateNotifications from './pages/corporate/Notifications';
import CorporateSettings from './pages/corporate/Settings';
import CorporateHelp from './pages/corporate/Help';
import CorporateDiscounts from './pages/corporate/Discounts';
import CorporateCarriers from './pages/corporate/Carriers';
import CorporateGuide from './pages/corporate/CorporateGuide';
import CorporateOffers from './pages/corporate/Offers';
import NakliyeciShipments from './pages/nakliyeci/Shipments';
import OfferShipment from './pages/nakliyeci/OfferShipment';
import NakliyeciAnalytics from './pages/nakliyeci/Analytics';
import NakliyeciMessages from './pages/nakliyeci/Messages';
import NakliyeciSettings from './pages/nakliyeci/Settings';
import NakliyeciHelp from './pages/nakliyeci/Help';
import NakliyeciJobs from './pages/nakliyeci/Jobs';
import NakliyeciRoutePlanner from './pages/nakliyeci/RoutePlanner';
import NakliyeciDrivers from './pages/nakliyeci/Drivers';
import NakliyeciListings from './pages/nakliyeci/Listings';
import NakliyeciWallet from './pages/nakliyeci/Wallet';
import NakliyeciActiveShipments from './pages/nakliyeci/ActiveShipments';
import NakliyeciCompletedShipments from './pages/nakliyeci/CompletedShipments';
import NakliyeciCancelledShipments from './pages/nakliyeci/CancelledShipments';
import NakliyeciLayout from './components/NakliyeciLayout';
import TasiyiciJobs from './pages/tasiyici/Jobs';
import TasiyiciMyOffers from './pages/tasiyici/MyOffers';
import TasiyiciMessages from './pages/tasiyici/Messages';
import TasiyiciSettings from './pages/tasiyici/Settings';
import TasiyiciActiveJobs from './pages/tasiyici/ActiveJobs';
import TasiyiciCompletedJobs from './pages/tasiyici/CompletedJobs';
import TasiyiciMarket from './pages/tasiyici/Market';
import TasiyiciLayout from './components/TasiyiciLayout';
import MobileOptimizedLayout from './components/mobile/MobileOptimizedLayout';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import CostCalculator from './components/calculators/CostCalculator';
import CaseStudies from './components/case-studies/CaseStudies';
import CommissionCalculator from './components/calculators/CommissionCalculator';
import DepartmentReporting from './pages/corporate/DepartmentReporting';
import WorkflowManagement from './components/workflow/WorkflowManagement';
import DetailedReporting from './components/reports/DetailedReporting';
import CostAnalysis from './components/analytics/CostAnalysis';
import DebugRoutes from './pages/DebugRoutes';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <SocketProvider>
              <RealtimeProvider>
                <NotificationProvider>
                <div className='App'>
                  <Routes>
                    <Route path='/' element={<LandingPage />} />
                    <Route path='/debug/routes' element={<DebugRoutes />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/about' element={<About />} />
                    <Route path='/contact' element={<Contact />} />
                    <Route
                      path='/dashboard'
                      element={<IndividualDashboard />}
                    />
                    <Route path='/onboarding' element={<OnboardingWizard />} />
                    <Route
                      path='/cost-calculator'
                      element={<CostCalculator />}
                    />
                    <Route path='/case-studies' element={<CaseStudies />} />
                    <Route
                      path='/commission-calculator'
                      element={<CommissionCalculator />}
                    />
                    <Route
                      path='/mobile'
                      element={
                        <MobileOptimizedLayout
                          userType='individual'
                          title='Mobil Panel'
                        >
                          <div>Mobil Panel İçeriği</div>
                        </MobileOptimizedLayout>
                      }
                    />

                    {/* Individual Routes */}
                    <Route
                      path='/individual'
                      element={
                        <ProtectedRoute requiredRole='individual'>
                          <IndividualLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route
                        path='dashboard'
                        element={<IndividualDashboard />}
                      />
                      <Route
                        path='create-shipment'
                        element={<CreateShipment />}
                      />
                      <Route path='offers' element={<IndividualOffers />} />
                      <Route
                        path='agreements'
                        element={<IndividualAgreements />}
                      />
                      <Route
                        path='shipments'
                        element={<IndividualShipments />}
                      />
                      <Route path='my-shipments' element={<MyShipments />} />
                      <Route
                        path='shipments/:id'
                        element={<IndividualShipmentDetail />}
                      />
                      <Route path='history' element={<IndividualHistory />} />
                      <Route
                        path='live-tracking'
                        element={<IndividualLiveTracking />}
                      />
                      <Route path='messages' element={<IndividualMessages />} />
                      <Route
                        path='notifications'
                        element={<IndividualNotifications />}
                      />
                      <Route
                        path='discounts'
                        element={<IndividualDiscounts />}
                      />
                      <Route path='settings' element={<IndividualSettings />} />
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
                      <Route
                        path='dashboard'
                        element={<CorporateDashboard />}
                      />
                      <Route
                        path='create-shipment'
                        element={<CorporateCreateShipment />}
                      />
                      <Route
                        path='shipments'
                        element={<CorporateShipments />}
                      />
                      <Route path='offers' element={<CorporateOffers />} />
                      <Route
                        path='analytics'
                        element={<CorporateAnalytics />}
                      />
                      <Route path='team' element={<CorporateTeam />} />
                      <Route path='reports' element={<CorporateReports />} />
                      <Route path='messages' element={<CorporateMessages />} />
                      <Route
                        path='notifications'
                        element={<CorporateNotifications />}
                      />
                      <Route path='settings' element={<CorporateSettings />} />
                      <Route path='help' element={<CorporateHelp />} />
                      <Route
                        path='discounts'
                        element={<CorporateDiscounts />}
                      />
                      <Route path='carriers' element={<CorporateCarriers />} />
                      <Route path='guide' element={<CorporateGuide />} />
                      <Route
                        path='department-reporting'
                        element={<DepartmentReporting />}
                      />
                      <Route path='workflow' element={<WorkflowManagement />} />
                      <Route
                        path='detailed-reports'
                        element={<DetailedReporting />}
                      />
                      <Route path='cost-analysis' element={<CostAnalysis />} />
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
                      <Route
                        path='dashboard'
                        element={<NakliyeciDashboard />}
                      />
                      <Route path='jobs' element={<NakliyeciJobs />} />
                      <Route
                        path='route-planner'
                        element={<NakliyeciRoutePlanner />}
                      />
                      <Route path='offers' element={<NakliyeciOffers />} />
                      <Route
                        path='vehicle-optimization'
                        element={<NakliyeciVehicleOptimization />}
                      />
                      <Route
                        path='shipments'
                        element={<NakliyeciShipments />}
                      />
                      <Route path='offer/:id' element={<OfferShipment />} />
                      <Route path='drivers' element={<NakliyeciDrivers />} />
                      <Route path='active-shipments' element={<NakliyeciActiveShipments />} />
                      <Route path='listings' element={<NakliyeciListings />} />
                      <Route
                        path='analytics'
                        element={<NakliyeciAnalytics />}
                      />
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
                      <Route path='my-offers' element={<TasiyiciMyOffers />} />
                      <Route
                        path='active-jobs'
                        element={<TasiyiciActiveJobs />}
                      />
                      <Route
                        path='completed-jobs'
                        element={<TasiyiciCompletedJobs />}
                      />
                      <Route path='messages' element={<TasiyiciMessages />} />
                      <Route path='settings' element={<TasiyiciSettings />} />
                    </Route>

                    {/* 404 Route */}
                    <Route path='*' element={<NotFoundPage />} />
                  </Routes>

                  {/* Global Error Toast */}
                  <ErrorToast message='' onClose={() => {}} />
                </div>
                </NotificationProvider>
              </RealtimeProvider>
            </SocketProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

