import React, { useEffect } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';
import LoginPage from './screens/LoginPage';
import FarmerDashboard from './screens/FarmerDashboard';
import CreateBatch from './screens/CreateBatch';
import BatchTimeline from './screens/BatchTimeline';
import AddEvent from './screens/AddEvent';
import AdminDashboard from './screens/AdminDashboard';
import ConsumerTraceability from './screens/ConsumerTraceability';
import BatchDetail from './screens/BatchDetail';
import GeneralReports from './screens/GeneralReports';
import ExportData from './screens/ExportData';
import Profile from './screens/Profile';
import FAQs from './screens/FAQs';
import CalendarView from './screens/CalendarView';
import LogEventView from './screens/LogEventView';
import CropJourneyView from './screens/CropJourneyView';
import CropHealthView from './screens/CropHealthView';
import IoTSensorsView from './screens/IoTSensorsView';
import AnalyticsView from './screens/AnalyticsView';
import ExportView from './screens/ExportView';
import LabourAccountsView from './screens/LabourAccountsView';
import Leaderboard from './screens/Leaderboard';
import RewardOverlay from './components/RewardOverlay';
import FinanceDashboard from './screens/FinanceDashboard';
import CommunityHub from './screens/CommunityHub';

function AppContent() {
  const { currentView, setCurrentView, currentBatchId, setCurrentBatchId, user, sidebarOpen, setSidebarOpen } = useFarm();

  // Listen to popstate and initial load routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const matchBatch = path.match(/^\/batch\/([^\/]+)$/);
      const matchTrace = path.match(/^\/traceability\/([^\/]+)$/);
      if (matchBatch) {
        setCurrentBatchId(matchBatch[1]);
        setCurrentView('batch-detail');
      } else if (matchTrace) {
        setCurrentBatchId(matchTrace[1]);
        setCurrentView('consumer-traceability');
      } else {
        if (user) {
          setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'farmer-dashboard');
        } else {
          setCurrentView('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Initial routing logic
    const path = window.location.pathname;
    const matchBatch = path.match(/^\/batch\/([^\/]+)$/);
    const matchTrace = path.match(/^\/traceability\/([^\/]+)$/);
    if (matchBatch) {
      setCurrentBatchId(matchBatch[1]);
      setCurrentView('batch-detail');
    } else if (matchTrace) {
      setCurrentBatchId(matchTrace[1]);
      setCurrentView('consumer-traceability');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentView, setCurrentBatchId, user]);

  // Sync state view changes to browser URL
  useEffect(() => {
    const path = window.location.pathname;
    if (currentView === 'batch-detail' && currentBatchId) {
      const targetPath = `/batch/${currentBatchId}`;
      if (path !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } else if (currentView === 'consumer-traceability' && currentBatchId) {
      const targetPath = `/traceability/${currentBatchId}`;
      if (path !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } else if (currentView === 'login' && path !== '/') {
      window.history.pushState(null, '', '/');
    } else if (currentView !== 'batch-detail' && currentView !== 'consumer-traceability' && (path.startsWith('/batch/') || path.startsWith('/traceability/'))) {
      window.history.pushState(null, '', '/');
    }
  }, [currentView, currentBatchId]);

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage />;
      case 'farmer-dashboard':
        return <FarmerDashboard />;
      case 'create-batch':
        return <FarmerDashboard />;
      case 'batch-timeline':
        return <BatchTimeline />;
      case 'add-event':
        return <AddEvent />;
      case 'admin-dashboard':
      case 'admin-approval':
      case 'admin-analytics':
      case 'admin-traceability-audit':
      case 'admin-qr-code':
        return <AdminDashboard />;
      case 'consumer-traceability':
        return <ConsumerTraceability />;
      case 'batch-detail':
        return <BatchDetail />;
      case 'general-reports':
        return <GeneralReports />;
      case 'export-data':
        return <ExportData />;
      case 'profile':
        return <Profile />;
      case 'faqs':
        return <FAQs />;
      case 'community':
      case 'workflow-community':
        return <CommunityHub />;
      // Workflow Screens
      case 'workflow-calendar':
        return <CalendarView />;
      case 'workflow-log':
        return <LogEventView />;
      case 'workflow-journey':
        return <CropJourneyView />;
      case 'workflow-health':
        return <CropHealthView />;
      case 'workflow-sensors':
        return <IoTSensorsView />;
      case 'workflow-analytics':
        return <AnalyticsView />;
      case 'workflow-export':
        return <ExportView />;
      case 'workflow-labour':
        return <FinanceDashboard />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <div className="min-h-screen bg-warmSand dark:bg-[#0c140f] text-stone-900 dark:text-emerald-50 transition-colors duration-300 flex">
      {/* Dynamic Background SVG Glows */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-25 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar Backdrop overlay for mobile */}
      {user && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - only when user is logged in */}
      {user && <Sidebar />}

      {/* Main Right Side Content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-x-hidden">
        {/* Header - only when user is logged in */}
        {user && <Header />}

        <main className="flex-1">
          {renderView()}
        </main>

        {/* Persistent AI Farm Assistant Widget */}
        {user && <AIAssistant />}
      </div>
      {user && <RewardOverlay />}
    </div>
  );
}

export default function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}
