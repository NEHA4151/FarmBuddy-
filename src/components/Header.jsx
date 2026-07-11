import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  Plus,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Menu
} from 'lucide-react';

export default function Header() {
  const { 
    user, 
    logout, 
    theme, 
    toggleTheme, 
    notifications, 
    markAsRead, 
    clearAllNotifications,
    setCurrentView,
    setSidebarOpen
  } = useFarm();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const [greeting, setGreeting] = useState(() => {
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return 'Good Morning';
    if (hrs >= 12 && hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  useEffect(() => {
    const updateGreeting = () => {
      const hrs = new Date().getHours();
      if (hrs >= 5 && hrs < 12) {
        setGreeting('Good Morning');
      } else if (hrs >= 12 && hrs < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    // Check and update every 10 seconds
    const interval = setInterval(updateGreeting, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-warmSand dark:bg-[#0c140f] border-b border-borders py-4 px-6 sm:px-10 flex items-center justify-between backdrop-blur-md bg-opacity-80 gap-3">
      {/* Left side: Hamburger Toggle & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 text-stone-600 dark:text-stone-300 hover:bg-biscuitHover dark:hover:bg-primary/30 rounded-xl transition-all"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1">
            {greeting}, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-[11px] text-[#6B7280] dark:text-stone-400 font-medium hidden md:block">
            Here's what's happening on your farm today.
          </p>
        </div>
      </div>

      {/* Right side: Actions & User Info */}
      <div className="flex items-center gap-4">


        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-stone-500 dark:text-stone-300 hover:bg-biscuitHover dark:hover:bg-primary/30 rounded-xl transition-all"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-stone-500 dark:text-stone-300 hover:bg-biscuitHover dark:hover:bg-primary/30 rounded-xl transition-all relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-emerald-500 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-warmSand animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-stone-200/60 dark:border-emerald-950/40 rounded-2xl shadow-xl overflow-hidden z-50 animate-float-down">
              <div className="p-3.5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <span className="font-extrabold text-xs text-stone-850">Alerts & Notifications</span>
                <button 
                  onClick={clearAllNotifications}
                  className="text-[10px] text-emerald-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-stone-400 text-xs">No new alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 border-b border-stone-100 last:border-none cursor-pointer hover:bg-stone-50 transition-colors ${
                        !n.read ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <div className="flex gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className={`text-[11px] font-bold text-stone-800 ${!n.read ? 'font-extrabold' : ''}`}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5 leading-normal">
                            {n.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-borders" />

        {/* User Info Avatar Bubble */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 pl-2 hover:bg-biscuitHover dark:hover:bg-primary/30 rounded-full transition-all"
          >
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-bold text-stone-850 dark:text-stone-100 leading-none">
                {user.name}
              </span>
              <span className="text-[9px] font-semibold text-[#6B7280] dark:text-stone-400 capitalize mt-0.5 leading-none">
                {user.role}
              </span>
            </div>
            <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-stone-200/60 rounded-2xl shadow-xl overflow-hidden z-50 p-1">
              <button 
                onClick={() => { setShowProfileMenu(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/5 rounded-xl transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
