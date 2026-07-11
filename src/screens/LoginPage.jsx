import { API_BASE } from '../apiConfig';
import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, 
  Lock, 
  Mail, 
  ChevronRight, 
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useFarm();
  const [role, setRole] = useState('farmer');

  // View state: 'login', 'register' (Farmer), or 'admin-register' (Admin)
  const [view, setView] = useState('login');

  // Input states
  const [farmerId, setFarmerId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  // Complete Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Quality Assurance & Trust');

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    setSuccessMsg('');
    setFarmerId('');
    setAdminEmail('');
    setPassword('');
  };

  const handleFarmerIdChange = (val) => {
    setFarmerId(val);
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (role === 'farmer') {
      // Rule: Must end with "UVFARMS"
      if (!farmerId.toUpperCase().endsWith('UVFARMS')) {
        setErrorMsg("Farmer ID must end with UVFARMS");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farmer_id: farmerId, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          if (data.status === 'first_login_success') {
            setSuccessMsg("Welcome! Accessing your dashboard for the first time.");
            setTimeout(() => {
              login(data.user);
            }, 1000);
          } else if (data.status === 'force_signup') {
            setSuccessMsg("Second login detected. Please complete registration.");
            setTimeout(() => {
              setView('register');
            }, 1000);
          } else if (data.status === 'login_success') {
            setSuccessMsg("Authentication successful!");
            setTimeout(() => {
              login(data.user);
            }, 1000);
          } else {
            setErrorMsg("Unknown login status from server.");
          }
        } else {
          setErrorMsg(data.error || "Authentication failed.");
        }
      } catch (err) {
        console.error("Login request failed:", err);
        setErrorMsg("Connection error. Could not connect to authentication server.");
      }
      setIsSubmitting(false);
    } else {
      // Admin: needs password
      if (!password) {
        setErrorMsg("Password is required for admin login.");
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: adminEmail, password })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg("Admin authentication successful!");
          setTimeout(() => {
            login(data.user);
          }, 1000);
        } else {
          setErrorMsg(data.error || "Invalid Admin email or password.");
        }
      } catch (err) {
        console.error("Admin login request failed:", err);
        setErrorMsg("Connection error. Could not connect to authentication server.");
      }
      setIsSubmitting(false);
    }
  };

  const handleAdminRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          department: regDepartment
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Admin registered! Your Admin ID is ${data.admin_id}. You can now log in.`);
        setView('login');
        setPassword('');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setErrorMsg(data.error || "Failed to register Admin.");
      }
    } catch (err) {
      console.error("Admin registration failed:", err);
      setErrorMsg("Connection error. Failed to save Admin profile.");
    }
    setIsSubmitting(false);
  };

  const handleCompleteRegistrationSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: farmerId,
          name: regName,
          email: regEmail,
          password: regPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Account registration completed! You can now log in using your new password.");
        setView('login');
        setPassword(''); 
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setErrorMsg(data.error || "Failed to complete registration.");
      }
    } catch (err) {
      console.error("Registration submit failed:", err);
      setErrorMsg("Connection error. Failed to save profile details.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-warmSand overflow-hidden select-none">
      
      {/* Left side: Premium Farm Image Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 overflow-hidden bg-[#14532D]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform hover:scale-105"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14532D]/95 via-[#14532D]/75 to-[#14532D]/40 backdrop-blur-[2px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md space-y-6 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/5">
            <Sprout className="h-4 w-4" />
            Smart Farm Network
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Cultivating Trust.<br />
            <span className="text-emerald-400">Verifying Every Harvest.</span>
          </h1>
        </motion.div>
      </div>

      {/* Right side: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-warmSand">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-stone-200 p-8 pt-12 rounded-[20px] shadow-sm relative space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <img src="/logo_emblem.png" alt="FarmBuddy Logo" className="h-16 w-16 object-contain mb-1" />
            <div className="flex flex-col items-center">
              <span className="font-black text-xl tracking-tight leading-none">
                <span className="text-[#0b4d2c]">Farm</span><span className="text-[#39a85a]">Buddy</span>
              </span>
              <span className="text-[8px] text-[#39a85a] font-extrabold tracking-widest uppercase mt-2">
                — TRUST & TRACE 🍃 —
              </span>
            </div>
            <h2 className="font-extrabold text-lg text-stone-700 tracking-tight pt-2">
              {view === 'register' ? 'Complete Registration' : 'Sign In to Dashboard'}
            </h2>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              {view === 'register' 
                ? 'Fill in your name, email, and set your new login password.' 
                : 'Enter your Farmer ID and password to access the agriculture ledger.'
              }
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-750 text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {view === 'login' ? (
            /* LOGIN SCREEN */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Segmented Role Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Log in as</label>
                <div className="p-1 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-200/60 flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('farmer')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      role === 'farmer'
                        ? 'bg-[#14532D] text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      role === 'admin'
                        ? 'bg-[#14532D] text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Login Fields */}
              {role === 'farmer' ? (
                /* Farmer ID */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Farmer ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={farmerId}
                      onChange={(e) => handleFarmerIdChange(e.target.value)}
                      placeholder="e.g. NEHA_UVFARMS"
                      className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                /* Admin: Email address */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="name@farmbuddy.com"
                      className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-700">Password</label>
                  {role === 'farmer' ? (
                    <a 
                      href="#forgot" 
                      onClick={(e) => { e.preventDefault(); alert("First-time login default password is 'UVFARMS1111'."); }}
                      className="text-[10px] font-bold text-[#14532D] hover:underline"
                    >
                      Help?
                    </a>
                  ) : (
                    <a 
                      href="#forgot" 
                      onClick={(e) => { e.preventDefault(); alert("Admin password is 'password'."); }}
                      className="text-[10px] font-bold text-[#14532D] hover:underline"
                    >
                      Help?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember_me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#14532D] border-stone-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="remember_me" className="ml-2 block text-[11px] font-semibold text-stone-500 select-none">
                  Remember my credentials
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#14532D] hover:bg-[#1b6b3b] text-white font-bold text-xs shadow-md transition-all mt-2 disabled:opacity-50"
              >
                {role === 'farmer' ? 'Access Dashboard' : 'Login'}
                <ChevronRight className="h-4 w-4" />
              </button>

              {role === 'admin' && (
                <div className="text-center pt-2 border-t border-stone-250/20 mt-4">
                  <span className="text-xs text-stone-500">Don't have an Admin account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setView('admin-register');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-[#14532D] hover:underline"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </form>
          ) : view === 'register' ? (
            /* COMPLETE REGISTRATION SCREEN (FARMER) */
            <form onSubmit={handleCompleteRegistrationSubmit} className="space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Neha Sharma"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="neha@farmbuddy.com"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Profile registration */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all mt-2 disabled:opacity-50"
              >
                Complete Registration
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#14532D] hover:underline mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            /* ADMIN SIGN UP SCREEN */
            <form onSubmit={handleAdminRegisterSubmit} className="space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Alice Smith"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alice@farmbuddy.com"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Department selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Department</label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl px-3.5 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Quality Assurance & Trust">Quality Assurance & Trust</option>
                  <option value="Operations & Logistics">Operations & Logistics</option>
                  <option value="Executive Management">Executive Management</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit admin registration */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all mt-2 disabled:opacity-50"
              >
                Sign Up Admin
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#14532D] hover:underline mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
