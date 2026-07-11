import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { User, Shield, Edit2, Check, X, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, setUser, logout } = useFarm();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const handleSave = () => {
    if (!nameInput.trim()) return;
    setUser(prev => ({
      ...prev,
      name: nameInput.trim()
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNameInput(user?.name || '');
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-8 bg-warmSand dark:bg-[#0c140f] transition-colors duration-300">
      <div className="border-b border-stone-200/40 dark:border-emerald-950/20 pb-6">
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
          Account Profile
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Manage your personal identity credentials.
        </p>
      </div>

      <div className="bg-white dark:bg-[#121f17] border border-borders dark:border-stone-800 rounded-3xl p-8 shadow-sm space-y-6">
        {/* Profile Details Block */}
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block">
                Name
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="mt-1 w-full max-w-md bg-stone-50 dark:bg-stone-900 border border-borders dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                />
              ) : (
                <span className="text-base font-extrabold text-stone-800 dark:text-stone-100 block mt-0.5">
                  {user.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-stone-100 dark:border-stone-800/60 pt-4">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block">
                Role
              </span>
              <span className="text-base font-extrabold text-stone-800 dark:text-stone-100 block mt-0.5 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons Controls */}
        <div className="flex flex-wrap gap-3 border-t border-stone-150 dark:border-stone-800 pt-6">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={!nameInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-borders dark:border-stone-700 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </button>
          )}

          {/* Logout button directly inside profile page */}
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/45 dark:border-red-900/30 dark:text-red-400 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 ml-auto"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
