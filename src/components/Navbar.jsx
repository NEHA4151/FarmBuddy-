import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Sprout, 
  LogOut, 
  User, 
  Cpu, 
  Layers, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

export default function Navbar() {
  const { 
    currentView, 
    setCurrentView, 
    user, 
    logout, 
    theme, 
    toggleTheme, 
    notifications, 
    markAsRead, 
    clearAllNotifications,
    login
  } = useFarm();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNav = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  // Quick switch role helper for demonstration
  const handleQuickSwitchRole = (role) => {
    if (role === 'farmer') {
      login('john@farmbuddy.com', '123456', 'farmer');
    } else if (role === 'admin') {
      login('alice@farmbuddy.com', '123456', 'admin');
    } else {
      logout();
      setCurrentView('consumer-traceability');
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-stone-200/50 dark:border-emerald-950/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav(user ? (user.role === 'farmer' ? 'farmer-dashboard' : 'admin-dashboard') : 'login')}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white shadow-lg shadow-emerald-500/25">
              <Sprout className="h-6 w-6 animate-float" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                FarmBuddy
              </span>
              <span className="text-[10px] text-stone-500 dark:text-emerald-600 font-semibold tracking-wider uppercase">
                Trust & Trace
              </span>
            </div>
          </div>

          {/* Navigation Links - Role Dependent */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {user.role === 'farmer' && (
                <>
                  <button 
                    onClick={() => handleNav('farmer-dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'farmer-dashboard' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => handleNav('create-batch')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'create-batch' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    Create Batch
                  </button>
                  <button 
                    onClick={() => handleNav('add-event')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'add-event' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    Log Event
                  </button>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <button 
                    onClick={() => handleNav('admin-dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'admin-dashboard' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    Admin Console
                  </button>
                </>
              )}
            </div>
          )}

          {/* Quick Sandbox Controls & Utility Icons */}
          <div className="flex items-center gap-3">


            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-stone-500 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60 rounded-xl transition-all"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications Panel */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-stone-500 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60 rounded-xl transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-stone-200/60 dark:border-emerald-950/40 rounded-2xl shadow-xl overflow-hidden animate-float-down z-50">
                  <div className="p-4 border-b border-stone-100 dark:border-emerald-950/30 flex justify-between items-center bg-stone-50/50 dark:bg-emerald-950/10">
                    <span className="font-bold text-sm text-stone-800 dark:text-emerald-400">Farm Alerts & Logs</span>
                    <button 
                      onClick={clearAllNotifications}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-400 text-sm">No new alerts</div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)}
                          className={`p-3.5 border-b border-stone-100 dark:border-emerald-950/20 last:border-none cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-900/40 transition-colors ${
                            !n.read ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <div className="flex gap-2.5">
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`} />
                            <div>
                              <p className={`text-xs font-semibold text-stone-800 dark:text-stone-200 ${!n.read ? 'font-bold' : ''}`}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                                {n.description}
                              </p>
                              <span className="text-[9px] text-stone-400 dark:text-emerald-400 block mt-1">{n.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-2.5 pr-1 hover:bg-stone-100 dark:hover:bg-zinc-900/60 rounded-full border border-stone-200/50 dark:border-emerald-950/20 transition-all"
                >
                  <span className="hidden sm:inline text-xs font-bold text-stone-700 dark:text-stone-300">
                    {user.name}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-56 glass-panel border border-stone-200/60 dark:border-emerald-950/40 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-stone-100 dark:border-emerald-950/30">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {user.role} console
                      </p>
                      <p className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate mt-1">
                        {user.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <button 
                        onClick={() => { setShowProfileMenu(false); handleNav(user.role === 'farmer' ? 'farmer-dashboard' : 'admin-dashboard'); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900/40 rounded-xl transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </button>
                      <button 
                        onClick={() => { setShowProfileMenu(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleNav('login')}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
              >
                <ShieldCheck className="h-4 w-4" />
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-500 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900/60 rounded-xl"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-stone-200/50 dark:border-emerald-950/30 bg-white/95 dark:bg-[#0c140f]/95 backdrop-blur-md">
          <div className="flex flex-col gap-1.5 mt-2">
            {user.role === 'farmer' && (
              <>
                <button 
                  onClick={() => handleNav('farmer-dashboard')}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900/40"
                >
                  Farmer Dashboard
                </button>
                <button 
                  onClick={() => handleNav('create-batch')}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900/40"
                >
                  Create Batch
                </button>
                <button 
                  onClick={() => handleNav('add-event')}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900/40"
                >
                  Log Event
                </button>
              </>
            )}
            {user.role === 'admin' && (
              <button 
                onClick={() => handleNav('admin-dashboard')}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900/40"
              >
                Admin Control Panel
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
