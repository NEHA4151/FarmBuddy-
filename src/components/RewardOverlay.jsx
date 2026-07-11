import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarm } from '../context/FarmContext';
import { Trophy, Award, Zap, ShieldCheck, Crown, X } from 'lucide-react';

export default function RewardOverlay() {
  const { 
    floatingCoins, 
    setFloatingCoins, 
    floatingTexts, 
    setFloatingTexts, 
    rewardPopups, 
    setRewardPopups 
  } = useFarm();

  const dismissPopup = (id) => {
    setRewardPopups(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">



      {/* 3. Celebration Popups Layer (clickable elements require pointer-events-auto) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
        <AnimatePresence>
          {rewardPopups.map((popup) => (
            <PopupCard key={popup.id} popup={popup} onDismiss={() => dismissPopup(popup.id)} />
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

function PopupCard({ popup, onDismiss }) {
  // Auto dismiss after 5.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (popup.type) {
      case 'badge_unlock':
        return <Award className="h-14 w-14 text-amber-500 animate-pulse" />;
      case 'rank_up':
        return <Trophy className="h-14 w-14 text-yellow-500 animate-bounce" />;
      case 'trust_milestone':
        return <ShieldCheck className="h-14 w-14 text-emerald-500 animate-pulse" />;
      case 'level_up':
        return <Crown className="h-14 w-14 text-amber-600 animate-bounce" />;
      default:
        return <Zap className="h-14 w-14 text-amber-500" />;
    }
  };

  const getBorderColor = () => {
    switch (popup.type) {
      case 'trust_milestone':
        return 'border-emerald-500/40 dark:border-emerald-500/20';
      case 'rank_up':
      case 'level_up':
      case 'badge_unlock':
        return 'border-amber-400/55 dark:border-amber-950/40';
      default:
        return 'border-stone-200 dark:border-stone-750';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.5, y: 100, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.2 } }}
      className={`pointer-events-auto w-full max-w-sm bg-white/95 dark:bg-stone-850/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border ${getBorderColor()} text-center relative overflow-hidden flex flex-col items-center gap-4 my-2`}
    >
      {/* Dismiss Button */}
      <button 
        onClick={onDismiss}
        className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850 transition"
      >
        <X className="h-4.5 w-4.5" />
      </button>

      {/* Decorative Top Glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500" />

      {/* Main Icon container */}
      <div className="p-4 rounded-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-inner mt-2">
        {getIcon()}
      </div>

      <div className="space-y-1.5 w-full">
        <h3 className="text-lg font-black text-stone-950 dark:text-white uppercase tracking-wide">
          {popup.title}
        </h3>
        <p className="text-xs font-bold text-stone-500 dark:text-stone-400 leading-relaxed px-2">
          {popup.subtitle}
        </p>
      </div>

      {popup.bonus && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-950/40 rounded-xl px-4.5 py-2 font-black text-xs text-amber-800 dark:text-amber-400 inline-flex items-center gap-1.5 uppercase shadow-sm">
          <span>{popup.bonus}</span>
        </div>
      )}

      <button
        onClick={onDismiss}
        className="w-full mt-2 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition cursor-pointer"
      >
        Awesome!
      </button>
    </motion.div>
  );
}
