import React from 'react';
import { useFarm } from '../context/FarmContext';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  Activity, 
  Cpu, 
  BarChart3, 
  Heart, 
  Award, 
  ShieldCheck, 
  Compass, 
  FileText, 
  Download, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
  Sprout,
  X,
  Calendar,
  QrCode,
  Users,
  IndianRupee
} from 'lucide-react';

export default function Sidebar() {
  const { currentView, setCurrentView, user, logout, addNotification, sidebarOpen, setSidebarOpen, currentBatchId, setCurrentBatchId } = useFarm();

  const handleNav = (view, sectionId = null) => {
    if (view === 'admin-dashboard') {
      setCurrentBatchId(null);
    }
    setCurrentView(view);
    setSidebarOpen(false);
    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-emerald-500', 'shadow-2xl', 'scale-[1.01]', 'duration-300');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-emerald-500', 'shadow-2xl', 'scale-[1.01]');
          }, 2500);
        }
      }, 150);
    }
  };

  if (!user) return null;

  const getLinkClass = (view) => {
    const isActive = currentView === view;
    return `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
      isActive 
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 dark:border-emerald-500 rounded-l-none pl-3' 
        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/40 dark:hover:bg-white/5 hover:text-emerald-700 dark:hover:text-emerald-300'
    }`;
  };

  return (
    <aside className={`w-66 h-screen fixed inset-y-0 left-0 bg-warmSand dark:bg-gradient-to-b dark:from-[#081e13] dark:via-[#05110b] dark:to-[#020504] border-r border-stone-300 dark:border-emerald-950/30 flex flex-col justify-between pt-4 pb-8 px-4 z-50 shrink-0 select-none transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 px-2 relative text-center">
        {/* Close Button for mobile drawer */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute right-0 top-0 p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-white/5 rounded-xl transition-all"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>

        <div 
          className="flex flex-col items-center cursor-pointer space-y-2.5 mt-0" 
          onClick={() => handleNav(user.role === 'farmer' ? 'farmer-dashboard' : 'admin-dashboard')}
        >
          <div className="relative group">
            {/* Glowing Accent */}
            <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-md group-hover:bg-emerald-500/25 transition-all duration-300" />
            <img 
              src="/logo_emblem.png" 
              alt="Farm Buddy Logo" 
              className="h-16 w-16 object-contain relative z-10 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]" 
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-xl tracking-tight leading-none">
              <span className="text-stone-900 dark:text-white">Farm</span><span className="text-[#2e7d32] dark:text-[#39a85a]">Buddy</span>
            </span>
            <span className="text-[8px] text-[#2e7d32] dark:text-[#39a85a] font-extrabold tracking-widest uppercase mt-2">
              — TRUST & TRACE 🍃 —
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {user.role === 'farmer' ? (
          <>
            {/* BATCH WORKFLOW MENU */}
            {currentBatchId && (
              <div className="space-y-1.5 pt-4 border-t border-stone-300 dark:border-emerald-950/40">
                <div className="px-3.5 py-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 tracking-wider">
                    BATCH WORKFLOW ({currentBatchId})
                  </span>
                  <button 
                    onClick={() => {
                      setCurrentBatchId(null);
                      setCurrentView('farmer-dashboard');
                    }}
                    className="text-[9px] font-bold text-stone-500 dark:text-stone-400 hover:text-stone-850 dark:hover:text-white transition-colors"
                  >
                    Deselect
                  </button>
                </div>
                <button onClick={() => handleNav('workflow-calendar')} className={getLinkClass('workflow-calendar')}>
                  <Calendar className="h-4 w-4" />
                  1. Calendar
                </button>
                <button onClick={() => handleNav('workflow-log')} className={getLinkClass('workflow-log')}>
                  <Activity className="h-4 w-4" />
                  2. Log Event
                </button>
                <button onClick={() => handleNav('workflow-journey')} className={getLinkClass('workflow-journey')}>
                  <Compass className="h-4 w-4" />
                  3. Crop Journey
                </button>
                <button onClick={() => handleNav('workflow-health')} className={getLinkClass('workflow-health')}>
                  <Heart className="h-4 w-4" />
                  4. Crop Health
                </button>
                <button onClick={() => handleNav('workflow-sensors')} className={getLinkClass('workflow-sensors')}>
                  <Cpu className="h-4 w-4" />
                  5. IoT Sensors
                </button>
                <button onClick={() => handleNav('workflow-analytics')} className={getLinkClass('workflow-analytics')}>
                  <BarChart3 className="h-4 w-4" />
                  6. Analytics
                </button>
                <button onClick={() => handleNav('workflow-labour')} className={getLinkClass('workflow-labour')}>
                  <Users className="h-4 w-4" />
                  7. Finance & Accounting
                </button>
                <button onClick={() => handleNav('workflow-export')} className={getLinkClass('workflow-export')}>
                  <Download className="h-4 w-4" />
                  8. Export
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* ADMIN BATCH WORKFLOW MENU */}
            {currentBatchId && (
              <div className="space-y-1.5 pt-4 border-t border-stone-300 dark:border-emerald-950/40">
                <div className="px-3.5 py-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 tracking-wider">
                    BATCH WORKFLOW ({currentBatchId})
                  </span>
                  <button 
                    onClick={() => {
                      setCurrentBatchId(null);
                      setCurrentView('admin-dashboard');
                    }}
                    className="text-[9px] font-bold text-stone-500 dark:text-stone-400 hover:text-stone-850 dark:hover:text-white transition-colors"
                  >
                    Deselect
                  </button>
                </div>
                <button onClick={() => handleNav('admin-approval')} className={getLinkClass('admin-approval')}>
                  <ShieldCheck className="h-4 w-4" />
                  1. Approval Section
                </button>
                <button onClick={() => handleNav('admin-analytics')} className={getLinkClass('admin-analytics')}>
                  <BarChart3 className="h-4 w-4" />
                  2. Analytics
                </button>
                <button onClick={() => handleNav('admin-traceability-audit')} className={getLinkClass('admin-traceability-audit')}>
                  <Compass className="h-4 w-4" />
                  3. Traceability Audit
                </button>
                <button onClick={() => handleNav('admin-qr-code')} className={getLinkClass('admin-qr-code')}>
                  <QrCode className="h-4 w-4" />
                  4. QR Code
                </button>
              </div>
            )}
          </>
        )}

        {/* ACCOUNT CATEGORY */}
        <div className="space-y-1.5 pt-4 border-t border-stone-300 dark:border-emerald-950/40">
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 px-3.5 tracking-wider uppercase block">
            Account & Social
          </span>
          <button onClick={() => handleNav('profile')} className={getLinkClass('profile')}>
            <User className="h-4 w-4" />
            Profile
          </button>
          <button onClick={() => handleNav('community')} className={getLinkClass('community')}>
            <Users className="h-4 w-4" />
            Community
          </button>
          <button onClick={() => handleNav('faqs')} className={getLinkClass('faqs')}>
            <HelpCircle className="h-4 w-4" />
            FAQ
          </button>
          <button onClick={() => handleNav('leaderboard')} className={getLinkClass('leaderboard')}>
            <Award className="h-4 w-4" />
            Leaderboard
          </button>
        </div>
      </div>

      {/* Logout button at bottom */}
      <div className="pt-4 border-t border-stone-300 dark:border-emerald-950/40 mt-auto">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-950/10 transition-all text-left"
        >
          <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
