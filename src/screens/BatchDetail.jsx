import { API_BASE } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import AnimatedCounter from '../components/AnimatedCounter';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import QRModal from '../components/QRModal';
import {
  Sprout,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  MapPin,
  Award,
  FileText,
  Activity,
  TrendingUp,
  Truck,
  Lock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  QrCode
} from 'lucide-react';

const ALL_BADGES = [
  { name: 'First Batch', icon: '🌱', desc: 'First crop batch is created' },
  { name: 'Record Starter', icon: '📝', desc: 'First farming activity is logged' },
  { name: 'First Snapshot', icon: '📷', desc: 'First crop image is uploaded' },
  { name: 'Water Warrior', icon: '💧', desc: 'Irrigation records are maintained throughout the crop cycle' },
  { name: 'Nutrition Master', icon: '🍃', desc: 'Fertilizer records are maintained consistently' },
  { name: 'Crop Protector', icon: '🛡️', desc: 'Pesticide records are maintained properly' },
  { name: 'Workforce Manager', icon: '👥', desc: 'Labour records are completed for all stages' },
  { name: 'Consistency Champion', icon: '📅', desc: 'Farmer updates records every week for four consecutive weeks' },
  { name: 'Record Keeper', icon: '📚', desc: 'All mandatory records for the crop batch are completed' },
  { name: 'Harvest Hero', icon: '🌾', desc: 'Harvest details are successfully completed' },
  { name: 'Traceability Expert', icon: '🔍', desc: 'QR traceability is generated for the crop batch' },
  { name: 'AI Farmer', icon: '🤖', desc: 'AI crop analysis is used at least five times' },
  { name: 'Bronze Farmer', icon: '🥉', desc: 'Farmer reaches 150 points' },
  { name: 'Silver Farmer', icon: '🥈', desc: 'Farmer reaches 300 points' },
  { name: 'Gold Farmer', icon: '🥇', desc: 'Farmer reaches 500 points' },
  { name: 'Smart Farmer', icon: '⭐', desc: 'Trust score remains above 90 during the crop cycle' },
  { name: 'Sustainable Farmer', icon: '🌍', desc: 'Farmer follows all sustainability practices and maintains records' },
  { name: 'Master Farmer', icon: '👑', desc: 'Crop cycle is completed with high trust score and all major badges unlocked' }
];

const REWARDS_LIST = [
  { name: '10% Seed & Fertilizer Discount', icon: '🎟️', desc: '10% discount on seeds & compost at partner stores.', level: 2 },
  { name: 'Government Scheme Priority Match', icon: '🏛️', desc: 'Priority recommendation for agricultural schemes.', level: 3 },
  { name: 'Direct Agricultural Expert Access', icon: '👨‍🌾', desc: 'One-on-one video call with farm advisors.', level: 4 },
  { name: 'Unlimited Premium AI Vision Analysis', icon: '⚡', desc: 'Advanced vision models for crop diagnostics.', level: 5 },
  { name: 'Certificate of Agricultural Excellence', icon: '📜', desc: 'Verified digital certificate of farm quality.', level: 6 },
  { name: 'Farm Buddy Premium Membership', icon: '👑', desc: 'Unlock all pro features and analytics reports.', level: 6 }
];

export default function BatchDetail() {
  const {
    currentBatchId,
    setCurrentView,
    fetchBatchDetails,
    verifyBatch,
    tamperBatch,
    approveQA,
    user
  } = useFarm();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [viewQrOpen, setViewQrOpen] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState(() => {
    try {
      const saved = localStorage.getItem(`claimed_rewards_${currentBatchId}`);
      return saved ? JSON.parse(saved) : {};
    } catch(e) {
      return {};
    }
  });

  const handleClaimReward = (rewardName) => {
    const updated = { ...claimedRewards, [rewardName]: true };
    setClaimedRewards(updated);
    try {
      localStorage.setItem(`claimed_rewards_${currentBatchId}`, JSON.stringify(updated));
    } catch(e) {}
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#ffffff']
    });
    alert(`Reward Claimed Successfully!\nYour claim code is: FB-REWARD-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const loadData = async () => {
    setLoading(true);
    const data = await fetchBatchDetails(currentBatchId);
    if (data) {
      setDetails(data);
      setQrCodeData(data.qr_code || null);
      // Auto-verify on load
      const verifyRes = await verifyBatch(currentBatchId);
      if (verifyRes) {
        setVerificationResult(verifyRes);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentBatchId]);

  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyBatch(currentBatchId);
    if (result) {
      setVerificationResult(result);
    }
    setVerifying(false);
  };

  const handleTamper = async () => {
    setTampering(true);
    const result = await tamperBatch(currentBatchId);
    if (result) {
      // Reload details to get new tampered values
      const updatedData = await fetchBatchDetails(currentBatchId);
      if (updatedData) {
        setDetails(updatedData);
      }
      // Re-run verification
      const verifyRes = await verifyBatch(currentBatchId);
      if (verifyRes) {
        setVerificationResult(verifyRes);
      }
    }
    setTampering(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/restore`, {
        method: 'POST'
      });
      if (res.ok) {
        // Reload details
        const updatedData = await fetchBatchDetails(currentBatchId);
        if (updatedData) {
          setDetails(updatedData);
        }
        // Re-run verification
        const verifyRes = await verifyBatch(currentBatchId);
        if (verifyRes) {
          setVerificationResult(verifyRes);
        }
      }
    } catch (err) {
      console.error('Failed to restore batch:', err);
    }
    setRestoring(false);
  };

  const handleApprove = async () => {
    approveQA(currentBatchId);
    setDetails(prev => ({
      ...prev,
      status: 'QA Approved'
    }));
    setTimeout(async () => {
      const updatedData = await fetchBatchDetails(currentBatchId);
      if (updatedData) {
        setDetails(updatedData);
      }
    }, 2000);
  };

  const handleGenerateQR = async () => {
    try {
      const qrPath = `/traceability/${currentBatchId}`;
      const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrPath })
      });
      if (res.ok) {
        setQrCodeData(qrPath);
        setDetails(prev => ({
          ...prev,
          qr_code: qrPath
        }));
        setViewQrOpen(true);
      } else {
        alert("Failed to save QR Code to database.");
      }
    } catch (err) {
      console.error("Failed to generate QR Code:", err);
      alert("Failed to save QR Code to the database.");
    }
  };

  const handleViewQR = () => {
    setViewQrOpen(true);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('batch-qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${currentBatchId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    if (user?.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('farmer-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-warmSand dark:bg-stone-900 gap-3">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Loading Product Passport...</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-warmSand dark:bg-stone-900 gap-3">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Batch details could not be retrieved.</span>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-emerald-800 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Verification status check
  const isVerified = verificationResult?.verified;

  const totalPoints = details.totalPoints || details.total_points || 0;
  const currentLevel = details.currentLevel || details.current_level || 'Seedling';
  const earnedBadges = details.earnedBadges || details.earned_badges || [];
  const unlockedRewards = details.unlockedRewards || details.unlocked_rewards || [];
  const activityStreak = details.activityStreak || details.activity_streak || 1;
  const progressPercentage = details.progressPercentage || details.progress_percentage || 0;

  const levelOrder = ['Seedling', 'Sprout', 'Growing Plant', 'Healthy Crop', 'Smart Farmer', 'Master Farmer'];
  const levelPoints = [50, 150, 300, 500, 800, Infinity];
  const currentLvlIdx = levelOrder.indexOf(currentLevel);
  const nextLvlPoints = currentLvlIdx !== -1 && currentLvlIdx < levelOrder.length - 1 ? levelPoints[currentLvlIdx] : null;
  const pointsToNext = nextLvlPoints ? nextLvlPoints - totalPoints : 0;
  const nextLevelName = currentLvlIdx !== -1 && currentLvlIdx < levelOrder.length - 1 ? levelOrder[currentLvlIdx + 1] : '';
  const nextBadge = ALL_BADGES.find(b => !earnedBadges.includes(b.name));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-warmSand dark:bg-stone-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top bar with Navigation and Verification Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Batch: {details.batch_id}
            </span>
            {isVerified ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                Ledger Verified
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-wider animate-pulse">
                <ShieldAlert className="h-4 w-4" />
                Tampering Detected
              </div>
            )}
          </div>
        </div>

        {/* Header Hero Section */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 h-52 md:h-auto relative bg-stone-100">
            <img
              src={details.crop_image}
              alt={details.crop_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent md:hidden" />
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                    {details.crop_name}
                  </h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-semibold mt-1">
                    Product Passport Overview
                  </p>
                </div>
                
                {/* Trust Score circular gauge or box */}
                <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400">
                  <span className="text-2xl font-black leading-none">{details.trust_score}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Trust Score</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-300">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Farm Location</span>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-200 truncate max-w-[150px] block">{details.farm_location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-300">
                    <Sprout className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Cultivation Type</span>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-200">{details.cultivation_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-300">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Status</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{details.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 dark:border-stone-700/50 pt-4 flex flex-wrap gap-4 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-stone-400" />
                Sowing Date: <span className="text-stone-800 dark:text-stone-200 font-bold">{details.sowing_date ? details.sowing_date.split('T')[0] : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-stone-400" />
                Expected Harvest: <span className="text-stone-800 dark:text-stone-200 font-bold">{details.expected_harvest ? details.expected_harvest.split('T')[0] : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Operations Section */}
        {user?.role === 'admin' && (
          <div className="bg-white dark:bg-stone-800 border border-emerald-500/20 p-6 rounded-[20px] shadow-sm space-y-4 bg-gradient-to-r from-emerald-500/5 to-transparent">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-100 dark:border-stone-700 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Admin QR Code Traceability Control
                </h3>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Authorize this batch as verified, then generate the QR traceability passport linked to `/traceability/${currentBatchId}`.
                </p>
              </div>
              <div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  details.status === 'QA Approved' || details.status === 'Shipped'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20'
                }`}>
                  Status: {details.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1.5">
              {/* Approve Batch Button */}
              <button
                onClick={handleApprove}
                disabled={details.status === 'QA Approved' || details.status === 'Shipped'}
                className="px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 disabled:bg-stone-100 disabled:text-stone-400 dark:disabled:bg-stone-900 dark:disabled:text-stone-600"
              >
                {details.status === 'QA Approved' || details.status === 'Shipped' ? '✓ Batch Approved' : 'Approve Batch'}
              </button>

              {/* Generate QR Button - only appears after approval */}
              {(details.status === 'QA Approved' || details.status === 'Shipped') && (
                <button
                  onClick={handleGenerateQR}
                  className="px-4.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <QrCode className="h-4.5 w-4.5" />
                  {qrCodeData || details.qr_code ? 'QR Generated' : 'Generate QR'}
                </button>
              )}

              {/* View QR Button - only appears when QR is generated */}
              {(details.qr_code || qrCodeData) && (
                <button
                  onClick={handleViewQR}
                  className="px-4.5 py-2.5 rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-borders dark:border-stone-700 font-bold text-xs shadow-sm transition"
                >
                  View QR
                </button>
              )}

              {/* Download QR Button - only appears when QR is generated */}
              {(details.qr_code || qrCodeData) && (
                <button
                  onClick={handleDownloadQR}
                  className="px-4.5 py-2.5 rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-borders dark:border-stone-700 font-bold text-xs shadow-sm transition"
                >
                  Download QR
                </button>
              )}
            </div>
            
            {/* Hidden canvas to support PNG download of QR code */}
            <div style={{ display: 'none' }}>
              <QRCodeCanvas
                id="batch-qr-canvas"
                value={window.location.origin + "/traceability/" + currentBatchId}
                size={256}
                level={"H"}
              />
            </div>
          </div>
        )}

        {/* Achievements & Rewards Section */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-700/50 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-500 animate-pulse" />
                Achievements & Rewards
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Earn points and unlock prestigious badges and discounts by keeping complete and timely cultivation records.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-200/40">
              <Zap className="h-4 w-4 text-amber-500 animate-bounce" />
              <span className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                {activityStreak} Week Streak
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Points, Level & Next Level Progress */}
            <div className="space-y-4">
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/15 dark:to-orange-950/5 border border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500 text-white shadow-sm">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block">Current Level</span>
                  <h4 className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{currentLevel}</h4>
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400"><AnimatedCounter value={totalPoints} /> Points</span>
                </div>
              </div>

              {/* Progress Bar */}
              {nextLvlPoints && (
                <div className="space-y-2 bg-stone-50 dark:bg-stone-900/30 p-4 border border-stone-150 dark:border-stone-800 rounded-2xl">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-500 dark:text-stone-400">Next Level: {nextLevelName}</span>
                    <span className="text-stone-800 dark:text-stone-250">{pointsToNext} pts to unlock</span>
                  </div>
                  <div className="w-full bg-stone-255 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-medium">
                    Progress: {progressPercentage}% to next level
                  </p>
                </div>
              )}

              {/* Next Badge to Unlock */}
              {nextBadge && (
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-stone-100 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-900/10">
                  <span className="text-2xl">{nextBadge.icon}</span>
                  <div>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Next Badge to Unlock</span>
                    <span className="text-xs font-extrabold text-stone-800 dark:text-stone-250 block mt-0.5">{nextBadge.name}</span>
                    <span className="text-[10px] text-stone-400">{nextBadge.desc}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Badge Collection Grid */}
            <div className="space-y-3">
              <span className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest block">
                Badge Collection Grid ({earnedBadges.length} / {ALL_BADGES.length})
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-4 gap-2">
                {ALL_BADGES.map((b) => {
                  const hasBadge = earnedBadges.includes(b.name);
                  return (
                    <div 
                      key={b.name}
                      title={`${b.name}: ${b.desc} (${hasBadge ? 'Unlocked' : 'Locked'})`}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-350 ${
                        hasBadge 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 scale-102 hover:shadow-sm' 
                          : 'bg-stone-50 dark:bg-stone-900/10 border-stone-150 dark:border-stone-850 filter grayscale opacity-45 hover:opacity-75'
                      }`}
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <span className="text-[8px] font-bold text-center text-stone-600 dark:text-stone-400 truncate w-full mt-1">{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Rewards Status Panel */}
            <div className="space-y-3">
              <span className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest block">
                Reward Eligibility Status
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {REWARDS_LIST.map((r) => {
                  const isEligible = unlockedRewards.includes(r.name);
                  const isClaimed = claimedRewards[r.name];
                  return (
                    <div 
                      key={r.name}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isEligible
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-stone-800 dark:text-stone-200'
                          : 'bg-stone-50/50 dark:bg-stone-900/10 border-stone-100 dark:border-stone-850 text-stone-400 dark:text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{r.icon}</span>
                        <div>
                          <span className="font-extrabold block leading-tight">{r.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 block mt-0.5 font-medium">{r.desc}</span>
                        </div>
                      </div>
                      
                      {isEligible ? (
                        <button
                          onClick={() => handleClaimReward(r.name)}
                          disabled={isClaimed}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-sm transition flex items-center gap-1 ${
                            isClaimed 
                              ? 'bg-stone-100 dark:bg-stone-850 text-stone-400 dark:text-stone-600 border border-stone-200' 
                              : 'bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer'
                          }`}
                        >
                          {isClaimed ? 'Claimed ✓' : 'Claim'}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase">
                          <Lock className="h-3 w-3" />
                          Lvl {r.level}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Details 6-Section Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Section 1: Pre-Cultivation Verification */}
          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-700/50 pb-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              1. Pre-Cultivation Verification
            </h3>
            {details.pre_cultivation ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Soil Test Status</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border ${
                    details.pre_cultivation.soil_test_status === 'Passed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  }`}>
                    {details.pre_cultivation.soil_test_status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Heavy Metal Screening</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {details.pre_cultivation.heavy_metal_status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Water Quality Standard</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{details.pre_cultivation.water_quality}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Seed Provenance</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{details.pre_cultivation.seed_provenance}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Buffer Zone Compliance</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {details.pre_cultivation.buffer_zone_check}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400">No pre-cultivation checks logged.</p>
            )}
          </div>

          {/* Section 2: Harvest & QA Results */}
          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-700/50 pb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              2. Harvest & QA Audits
            </h3>
            {details.harvest_qa ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Harvest Date</span>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {details.harvest_qa.harvest_date ? details.harvest_qa.harvest_date.split('T')[0] : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">QA Assessment</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {details.harvest_qa.qa_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-stone-50 dark:border-stone-700/30 pt-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Total Yield</span>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{details.harvest_qa.total_yield}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Marketable Yield</span>
                    <span className={`text-xs font-bold ${details.harvest_qa.marketable_yield.includes('Tampered') ? 'text-red-500 font-black' : 'text-stone-800 dark:text-stone-200'}`}>
                      {details.harvest_qa.marketable_yield}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-stone-50 dark:border-stone-700/30 pt-2.5">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Chemical Residue Test</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border ${
                    details.harvest_qa.residue_free
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  }`}>
                    {details.harvest_qa.residue_free ? '100% Free' : 'Violation Detected'}
                  </span>
                </div>
                
                <div className="text-xs">
                  <span className="font-bold text-stone-400 block mb-0.5">Lab Notes</span>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed italic bg-stone-50 dark:bg-stone-900/30 p-2 rounded-xl border border-stone-100 dark:border-stone-800">
                    "{details.harvest_qa.quality_notes}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400">Harvest and QA results pending.</p>
            )}
          </div>

          {/* Section 3: Transit & Supply Chain Tracking */}
          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-700/50 pb-2">
              <Truck className="h-5 w-5 text-emerald-600" />
              3. Transit & Supply Chain Handover
            </h3>
            {details.transit_retail ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Pre-Cooling Protocol</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {details.transit_retail.pre_cooling_status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Logistics Transport Status</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{details.transit_retail.transport_status}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Retail Handover Hub</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{details.transit_retail.retail_handover}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-stone-50 dark:border-stone-700/30 pt-2.5">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Delivery Status</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border ${
                    details.transit_retail.delivery_status === 'Delivered'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {details.transit_retail.delivery_status}
                  </span>
                </div>
                {details.transit_retail.dispatch_date && (
                  <div className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Dispatched on: {details.transit_retail.dispatch_date.split('T')[0]}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400">Transit details pending harvest completion.</p>
            )}
          </div>

          {/* Section 4: Cultivation Logs (timeline) */}
          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-700/50 pb-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              4. Cultivation timeline Logs
            </h3>
            {details.cultivation_logs && details.cultivation_logs.length > 0 ? (
              <div className="relative border-l border-stone-200 dark:border-stone-700 pl-4 space-y-4 max-h-56 overflow-y-auto pr-1">
                {details.cultivation_logs.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    {/* Bullet dot */}
                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-600 border-2 border-white dark:border-stone-800" />
                    
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-black text-stone-900 dark:text-white">{log.activity_type}</span>
                      <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5 text-[11px] leading-relaxed">
                      {log.description}
                    </p>
                    <div className="font-mono text-[9px] text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5 text-stone-400" />
                      Block: {log.hash.substring(0, 18)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400">No cultivation events recorded.</p>
            )}
          </div>

        </div>

        {/* Section 5 & 6: Cryptographic Verification Audit Card */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-700/50 pb-4">
            <h3 className="font-black text-xl text-stone-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5.5 w-5.5 text-emerald-600" />
              5. Ledger Integrity & Cryptographic Auditing
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Verifies live database states against frozen blockchain records. Any modifications made directly to the database without cryptographic consensus will flag immediate security mismatch warnings.
            </p>
          </div>

          {/* Cryptographic Hashes readout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800 font-mono text-xs space-y-1.5">
              <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest block">
                Blockchain Stored Ledger Hash (blockchain_hash)
              </span>
              <span className="text-stone-800 dark:text-stone-200 font-bold break-all block">
                {details.blockchain_hash}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800 font-mono text-xs space-y-1.5">
              <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest block font-sans">
                Live State Calculated SHA-256 Hash
              </span>
              <span className={`break-all font-bold block ${isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {verificationResult ? verificationResult.current_hash : 'Perform check to compute...'}
              </span>
            </div>
          </div>

          {/* Verification Banner Results */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                isVerified
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-800 dark:text-red-400 border-red-500/20'
              }`}
            >
              <div className="p-3 rounded-xl bg-white dark:bg-stone-800 shadow-sm">
                {isVerified ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-6 w-6 text-red-500 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-black text-sm uppercase tracking-wide">
                  {isVerified ? 'Ledger Consensus Verified' : 'Security Alert: Database Tampering Detected!'}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {isVerified
                    ? 'All database fields match the block ledger consensus signature perfectly. Integrity score 100%. Data remains secure and unmodified.'
                    : 'The computed hash of the current record does not match the immutable ledger signature! This indicates field data (e.g. yields, quality test metrics, soil checks) has been altered without consensus. Mismatch has been automatically recorded to the audit log.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Verification Audit Logs Timeline */}
          {verificationResult && verificationResult.verification_logs && verificationResult.verification_logs.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest block">
                6. Verification & Mismatch Audit Log Records
              </span>
              <div className="bg-stone-50 dark:bg-stone-900/30 border border-stone-150 dark:border-stone-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 max-h-48 overflow-y-auto">
                {verificationResult.verification_logs.map((log) => (
                  <div key={log.id} className="p-3 text-[11px] font-sans flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-wider">
                          {log.verification_status}
                        </span>
                        <span className="font-bold text-stone-700 dark:text-stone-200">Hash Signature Deviation Detected</span>
                      </div>
                      <div className="font-mono text-[9px] text-stone-400 dark:text-stone-500 mt-1 space-y-0.5">
                        <div>Original Signature: {log.original_hash}</div>
                        <div>Mismatched Signature: {log.current_hash}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold whitespace-nowrap">
                      {new Date(log.detected_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 border-t border-stone-100 dark:border-stone-700/50 pt-5">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-5 py-3 rounded-xl bg-[#14532D] hover:bg-[#1b6b3b] text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Verify Ledger Integrity
            </button>

            <button
              onClick={handleTamper}
              disabled={tampering}
              className="px-5 py-3 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/45 dark:border-red-900/30 dark:text-red-400 font-bold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {tampering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Simulate Data Tampering
            </button>

            {!isVerified && (
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/45 dark:border-emerald-900/30 dark:text-emerald-400 font-bold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {restoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Restore Database Integrity
              </button>
            )}
          </div>
        </div>

        {/* QR Code Modal for viewing */}
        <QRModal 
          isOpen={viewQrOpen} 
          onClose={() => setViewQrOpen(false)} 
          batchId={currentBatchId} 
        />

      </div>
    </div>
  );
}
