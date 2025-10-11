import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { SocketProvider } from './contexts/SocketContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import { SecurityProvider } from './contexts/SecurityContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import IndividualLayout from './components/IndividualLayout'
import CorporateLayout from './components/CorporateLayout'
import IndividualDashboard from './pages/individual/Dashboard'
import CorporateDashboard from './pages/corporate/Dashboard'
import CorporateCreateShipment from './pages/corporate/CreateShipment'
import CorporateNewCreateShipment from './pages/corporate/NewCreateShipment'
import CorporateShipments from './pages/corporate/Shipments'
import NakliyeciDashboard from './pages/nakliyeci/Dashboard'
import NakliyeciLoads from './pages/nakliyeci/Loads'
import NakliyeciVehicleOptimization from './pages/nakliyeci/VehicleOptimization'
import NakliyeciOffers from './pages/nakliyeci/Offers'
import NakliyeciNotifications from './pages/nakliyeci/Notifications'
import TasiyiciDashboard from './pages/tasiyici/Dashboard'
import NewCreateShipment from './pages/individual/NewCreateShipment'
import IndividualMessages from './pages/individual/Messages'
import IndividualProfile from './pages/individual/Profile'
import IndividualOffers from './pages/individual/Offers'
import IndividualAgreements from './pages/individual/Agreements'
import IndividualShipments from './pages/individual/Shipments'
import MyShipments from './pages/individual/MyShipments'
import MyShipmentsNew from './pages/individual/MyShipmentsNew'
import IndividualHistory from './pages/individual/History'
import IndividualLiveTracking from './pages/individual/LiveTracking'
import IndividualShipmentDetail from './pages/individual/ShipmentDetail'
import IndividualNotifications from './pages/individual/Notifications'
import IndividualDiscounts from './pages/individual/Discounts'
import IndividualHelp from './pages/individual/Help'
import IndividualHowItWorks from './pages/individual/HowItWorks'
import CorporateAnalytics from './pages/corporate/Analytics'
import CorporateTeam from './pages/corporate/Team'
import CorporateReports from './pages/corporate/Reports'
import CorporateMessages from './pages/corporate/Messages'
import CorporateNotifications from './pages/corporate/Notifications'
import CorporateSettings from './pages/corporate/Settings'
import CorporateHelp from './pages/corporate/Help'
import CorporateDiscounts from './pages/corporate/Discounts'
import CorporateCarriers from './pages/corporate/Carriers'
import CorporateGuide from './pages/corporate/CorporateGuide'
import NakliyeciShipments from './pages/nakliyeci/Shipments'
import NakliyeciCarriers from './pages/nakliyeci/Carriers'
import NakliyeciAnalytics from './pages/nakliyeci/Analytics'
import NakliyeciMessages from './pages/nakliyeci/Messages'
import NakliyeciSettings from './pages/nakliyeci/Settings'
import NakliyeciHelp from './pages/nakliyeci/Help'
import NakliyeciLayout from './components/NakliyeciLayout'
import TasiyiciJobs from './pages/tasiyici/Jobs'
import TasiyiciEarnings from './pages/tasiyici/Earnings'
import TasiyiciProfile from './pages/tasiyici/Profile'
import TasiyiciMessages from './pages/tasiyici/Messages'
import TasiyiciSettings from './pages/tasiyici/Settings'
import TasiyiciHelp from './pages/tasiyici/Help'
import TasiyiciActiveJobs from './pages/tasiyici/ActiveJobs'
import TasiyiciCompletedJobs from './pages/tasiyici/CompletedJobs'
import TasiyiciLayout from './components/TasiyiciLayout'
import MobileOptimizedLayout from './components/mobile/MobileOptimizedLayout'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import CostCalculator from './components/calculators/CostCalculator'
import CaseStudies from './components/case-studies/CaseStudies'
import CommissionCalculator from './components/commission/CommissionCalculator'
import DepartmentReporting from './pages/corporate/DepartmentReporting'
import WorkflowManagement from './components/workflow/WorkflowManagement'
import DetailedReporting from './components/reports/DetailedReporting'
import CostAnalysis from './components/analytics/CostAnalysis'
// import FleetManagement from './pages/nakliyeci/FleetManagement'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <SecurityProvider>
        <AuthProvider>
          <RealtimeProvider>
            <NotificationProvider>
              <SocketProvider>
                <div className="App">
              <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<IndividualDashboard />} />
                  <Route path="/onboarding" element={<OnboardingWizard />} />
                  <Route path="/cost-calculator" element={<CostCalculator />} />
                  <Route path="/case-studies" element={<CaseStudies />} />
                  <Route path="/commission-calculator" element={<CommissionCalculator />} />
                  <Route path="/mobile" element={<MobileOptimizedLayout userType="individual" title="Mobil Panel"><div>Mobil Panel İçeriği</div></MobileOptimizedLayout>} />
                  
                    {/* Individual Routes */}
                    <Route path="/individual" element={<IndividualLayout />}>
                      <Route path="dashboard" element={<IndividualDashboard />} />
                      <Route path="create-shipment" element={<NewCreateShipment />} />
                            <Route path="offers" element={<IndividualOffers />} />
                            <Route path="agreements" element={<IndividualAgreements />} />
                            <Route path="shipments" element={<IndividualShipments />} />
                            <Route path="my-shipments" element={<MyShipments />} />
                            <Route path="shipments/:id" element={<IndividualShipmentDetail />} />
                            <Route path="history" element={<IndividualHistory />} />
                            <Route path="live-tracking" element={<IndividualLiveTracking />} />
                      <Route path="messages" element={<IndividualMessages />} />
                      <Route path="notifications" element={<IndividualNotifications />} />
                      <Route path="discounts" element={<IndividualDiscounts />} />
                    <Route path="help" element={<IndividualHelp />} />
                    <Route path="how-it-works" element={<IndividualHowItWorks />} />
                    <Route path="profile" element={<IndividualProfile />} />
                    </Route>
                  
                        {/* Corporate Routes */}
                        <Route path="/corporate" element={<CorporateLayout />}>
                          <Route path="dashboard" element={<CorporateDashboard />} />
                          <Route path="create-shipment" element={<CorporateNewCreateShipment />} />
                          <Route path="shipments" element={<CorporateShipments />} />
                    <Route path="analytics" element={<CorporateAnalytics />} />
                    <Route path="team" element={<CorporateTeam />} />
                    <Route path="reports" element={<CorporateReports />} />
                    <Route path="messages" element={<CorporateMessages />} />
                    <Route path="notifications" element={<CorporateNotifications />} />
                    <Route path="settings" element={<CorporateSettings />} />
                    <Route path="help" element={<CorporateHelp />} />
                    <Route path="discounts" element={<CorporateDiscounts />} />
                    <Route path="carriers" element={<CorporateCarriers />} />
                    <Route path="guide" element={<CorporateGuide />} />
                    <Route path="department-reporting" element={<DepartmentReporting />} />
                    <Route path="workflow" element={<WorkflowManagement />} />
                    <Route path="detailed-reports" element={<DetailedReporting />} />
                    <Route path="cost-analysis" element={<CostAnalysis />} />
                  </Route>
                  
                  {/* Nakliyeci Routes */}
                  <Route path="/nakliyeci" element={<NakliyeciLayout />}>
                    <Route path="dashboard" element={<NakliyeciDashboard />} />
                    <Route path="loads" element={<NakliyeciLoads />} />
                    <Route path="offers" element={<NakliyeciOffers />} />
                    <Route path="vehicle-optimization" element={<NakliyeciVehicleOptimization />} />
                    <Route path="notifications" element={<NakliyeciNotifications />} />
                    <Route path="shipments" element={<NakliyeciShipments />} />
                    <Route path="carriers" element={<NakliyeciCarriers />} />
                    <Route path="analytics" element={<NakliyeciAnalytics />} />
                    <Route path="messages" element={<NakliyeciMessages />} />
                    <Route path="settings" element={<NakliyeciSettings />} />
                    <Route path="help" element={<NakliyeciHelp />} />
                    {/* <Route path="fleet-management" element={<FleetManagement />} /> */}
                  </Route>
                  
                  {/* Tasiyici Routes */}
                  <Route path="/tasiyici" element={<TasiyiciLayout />}>
                    <Route path="dashboard" element={<TasiyiciDashboard />} />
                    <Route path="jobs" element={<TasiyiciJobs />} />
                    <Route path="active-jobs" element={<TasiyiciActiveJobs />} />
                    <Route path="completed-jobs" element={<TasiyiciCompletedJobs />} />
                    <Route path="earnings" element={<TasiyiciEarnings />} />
                    <Route path="profile" element={<TasiyiciProfile />} />
                    <Route path="messages" element={<TasiyiciMessages />} />
                    <Route path="settings" element={<TasiyiciSettings />} />
                    <Route path="help" element={<TasiyiciHelp />} />
                  </Route>

            </Routes>
                </div>
              </SocketProvider>
            </NotificationProvider>
          </RealtimeProvider>
        </AuthProvider>
      </SecurityProvider>
    </ThemeProvider>
  )
}

export default App