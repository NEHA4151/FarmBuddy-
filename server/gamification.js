// gamification.js
// Logic for calculating points, levels, badges, and rewards based on crop batch state

export const LEVELS = [
  { name: 'Seedling', min: 0, max: 50 },
  { name: 'Sprout', min: 51, max: 150 },
  { name: 'Growing Plant', min: 151, max: 300 },
  { name: 'Healthy Crop', min: 301, max: 500 },
  { name: 'Smart Farmer', min: 501, max: 800 },
  { name: 'Master Farmer', min: 801, max: Infinity }
];

export const BADGES = [
  { id: 'first_batch', name: 'First Batch', icon: '🌱', category: 'beginner', desc: 'Awarded for creating your first crop batch.' },
  { id: 'first_activity', name: 'Record Starter', icon: '📝', category: 'beginner', desc: 'Logged your very first farming activity record.' },
  { id: 'first_image', name: 'First Snapshot', icon: '📷', category: 'beginner', desc: 'Uploaded the first snapshot of your crop.' },
  { id: 'water_warrior', name: 'Water Warrior', icon: '💧', category: 'activity', desc: 'Maintained irrigation logs throughout the crop cycle.' },
  { id: 'nutrition_master', name: 'Nutrition Master', icon: '🍃', category: 'activity', desc: 'Maintained fertilizer application records consistently.' },
  { id: 'crop_protector', name: 'Crop Protector', icon: '🛡️', category: 'activity', desc: 'Logged pesticide records properly.' },
  { id: 'workforce_manager', name: 'Workforce Manager', icon: '👥', category: 'activity', desc: 'Labour accounts and records completed for all stages.' },
  { id: 'consistency_champion', name: 'Consistency Champion', icon: '📅', category: 'activity', desc: 'Updated records every week for four consecutive weeks.' },
  { id: 'record_keeper', name: 'Record Keeper', icon: '📚', category: 'activity', desc: 'Completed all mandatory pre-cultivation and crop records.' },
  { id: 'harvest_hero', name: 'Harvest Hero', icon: '🌾', category: 'activity', desc: 'Successfully logged harvest yield details.' },
  { id: 'traceability_expert', name: 'Traceability Expert', icon: '🔍', category: 'activity', desc: 'Successfully generated QR traceability code.' },
  { id: 'ai_farmer', name: 'AI Farmer', icon: '🤖', category: 'activity', desc: 'Consulted the AI assistant more than five times.' },
  { id: 'bronze_farmer', name: 'Bronze Farmer', icon: '🥉', category: 'advanced', desc: 'Earned 150+ points in a single crop batch.' },
  { id: 'silver_farmer', name: 'Silver Farmer', icon: '🥈', category: 'advanced', desc: 'Earned 300+ points in a single crop batch.' },
  { id: 'gold_farmer', name: 'Gold Farmer', icon: '🥇', category: 'advanced', desc: 'Earned 500+ points in a single crop batch.' },
  { id: 'smart_farmer', name: 'Smart Farmer', icon: '⭐', category: 'advanced', desc: 'Maintained crop trust score above 90 throughout the cycle.' },
  { id: 'sustainable_farmer', name: 'Sustainable Farmer', icon: '🌍', category: 'advanced', desc: 'Completed all sustainability practices and records.' },
  { id: 'master_farmer', name: 'Master Farmer', icon: '👑', category: 'advanced', desc: 'Completed crop cycle with high trust score and all major badges unlocked.' }
];

export const REWARDS = [
  { id: 'seed_discount', name: '10% Seed & Fertilizer Discount', reqLevel: 2, desc: 'Get a 10% discount coupon at affiliated stores.' },
  { id: 'gov_schemes', name: 'Government Scheme Priority Match', reqLevel: 3, desc: 'Priority indexing and recommendation for local farming subsidy schemes.' },
  { id: 'expert_access', name: 'Direct Agricultural Expert Access', reqLevel: 4, desc: 'Priority video-consultation with verified agricultural scientists.' },
  { id: 'premium_ai', name: 'Unlimited Premium AI Vision Analysis', reqLevel: 5, desc: 'Access advanced crop disease identification with no limits.' },
  { id: 'excellence_cert', name: 'Certificate of Agricultural Excellence', reqLevel: 6, desc: 'Download a blockchain-verified digital excellence certificate.' },
  { id: 'premium_membership', name: 'Farm Buddy Premium Membership', reqLevel: 6, desc: 'Complimentary premium access to all platform features.' }
];

export function calculateGamificationState(batchDetails, labourAccounts = [], aiHistory = { chats: [], voice: [] }) {
  let points = 0;
  const badgesEarned = [];
  const rewardsUnlocked = [];

  const logs = batchDetails.cultivation_logs || [];
  const status = batchDetails.status || 'Growing';
  const qrCode = batchDetails.qr_code || batchDetails.qrCode || '';
  const cropImage = batchDetails.crop_image || batchDetails.imageUrl || '';
  const trustScore = calculateTrustScore(batchDetails, labourAccounts);
  const preCult = batchDetails.pre_cultivation || {};
  const harvestQa = batchDetails.harvest_qa || {};

  // --- 1. Point Allocation ---
  // Create Crop Batch (+10)
  points += 10;
  badgesEarned.push('First Batch Created');

  // Add Farm Details (+5)
  if (batchDetails.farm_location || batchDetails.location) {
    points += 5;
  }

  // Add Labour Record (+5)
  const batchLabour = labourAccounts.filter(l => l.batch_id === batchDetails.batch_id || l.batch_id === batchDetails.id);
  if (batchLabour.length > 0) {
    points += 5;
    badgesEarned.push('First Activity Logged');
  }

  // Add Irrigation Record (+5)
  const irrigationLogs = logs.filter(l => l.activity_type === 'Irrigation Logged');
  if (irrigationLogs.length > 0) {
    points += 5;
    badgesEarned.push('First Activity Logged');
  }

  // Add Fertilizer Record (+5)
  const fertLogs = logs.filter(l => l.activity_type === 'Fertilizer Application' || l.activity_type === 'Fertilizer Logged');
  if (fertLogs.length > 0) {
    points += 5;
    badgesEarned.push('First Activity Logged');
  }

  // Add Pesticide Record (+5)
  const pestLogs = logs.filter(l => l.activity_type === 'Pesticide Application' || l.activity_type === 'Pesticide Logged');
  if (pestLogs.length > 0) {
    points += 5;
    badgesEarned.push('First Activity Logged');
  }

  // Upload Crop Image (+5)
  const hasCropImage = cropImage && !cropImage.includes('default') && !cropImage.includes('photo-1500937386664-56d1dfef3854');
  if (hasCropImage) {
    points += 5;
    badgesEarned.push('First Crop Image Uploaded');
  }

  // Upload Invoice/Bill (+3)
  const invoiceLogs = logs.filter(l => {
    const desc = (l.description || '').toLowerCase();
    return desc.includes('invoice') || desc.includes('bill') || desc.includes('receipt') || desc.includes('invoice.pdf');
  });
  points += invoiceLogs.length * 3;

  // Update Crop Growth Stage (+5)
  const stageLogs = logs.filter(l => l.activity_type === 'Stage Updated' || l.activity_type === 'Growth Stage Updated' || l.activity_type === 'Status Updated');
  points += stageLogs.length * 5;

  // Add Harvest Details (+10)
  const isHarvested = status === 'In Quality Check' || status === 'QA Approved' || status === 'Shipped' || status === 'Delivered' || harvestQa.harvest_date;
  if (isHarvested) {
    points += 10;
  }

  // IoT Sensor Data Available (+15)
  // Assume mock telemetry is always active and available
  points += 15;

  // AI Crop Health Analysis Performed (+10)
  // Find chat history related to this farmer / crop
  const aiChatsCount = (aiHistory.chats || []).length;
  if (aiChatsCount > 0) {
    points += 10;
  }

  // QR Traceability Successfully Generated (+10)
  if (qrCode) {
    points += 10;
  }

  // --- 2. Streak & Last Activity Calculations ---
  // Find last activity date
  let lastActivityDate = batchDetails.sowing_date || batchDetails.seedDate || null;
  if (logs.length > 0) {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    lastActivityDate = sortedLogs[0].timestamp.split('T')[0];
  }

  // Calculate unique weeks of activity
  const activityWeeks = new Set();
  logs.forEach(l => {
    const date = new Date(l.timestamp);
    // Get week number
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    activityWeeks.add(`${date.getFullYear()}-W${week}`);
  });
  const activityStreak = Math.max(1, activityWeeks.size);

  // Complete Weekly Records Streak Bonus (+20)
  if (activityStreak >= 4) {
    points += 20;
    badgesEarned.push('Consistency Champion');
  }

  // Maintain Records for Entire Crop Cycle (+50)
  const isCycleCompleted = status === 'QA Approved' || status === 'Shipped' || status === 'Delivered';
  if (isCycleCompleted) {
    points += 50;
  }

  // --- 3. Penalties ---
  const today = new Date('2026-07-11'); // Local context time current date
  let inactivityDays = 0;
  if (lastActivityDate) {
    const lastActive = new Date(lastActivityDate);
    const diffTime = Math.abs(today - lastActive);
    inactivityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  if (inactivityDays > 7 && inactivityDays <= 14) {
    points -= 10;
  } else if (inactivityDays > 14) {
    points -= 20;
  }

  // Points cannot go below 0
  points = Math.max(0, points);

  // --- 4. Badges Eligibility ---
  // First Batch: First crop batch is created
  badgesEarned.push('First Batch');

  // Record Starter: First farming activity is logged
  if (logs.length > 0) {
    badgesEarned.push('Record Starter');
  }

  // First Snapshot: First crop image is uploaded
  if (hasCropImage) {
    badgesEarned.push('First Snapshot');
  }

  // Water Warrior: Irrigation records are maintained throughout the crop cycle (min 3 logs)
  if (irrigationLogs.length >= 3) {
    badgesEarned.push('Water Warrior');
  }

  // Nutrition Master: Fertilizer records are maintained consistently (min 2 logs)
  if (fertLogs.length >= 2) {
    badgesEarned.push('Nutrition Master');
  }

  // Crop Protector: Pesticide records are maintained properly (min 2 logs)
  if (pestLogs.length >= 2) {
    badgesEarned.push('Crop Protector');
  }

  // Workforce Manager: Labour records are completed for all stages
  if (batchLabour.length > 0) {
    badgesEarned.push('Workforce Manager');
  }

  // Consistency Champion: Farmer updates records every week for four consecutive weeks
  if (activityStreak >= 4) {
    badgesEarned.push('Consistency Champion');
  }

  // Record Keeper: All mandatory records for the crop batch are completed
  const hasPreCult = preCult.soil_test_status === 'Passed' && preCult.heavy_metal_status === 'Passed';
  if (hasPreCult && irrigationLogs.length > 0 && fertLogs.length > 0 && pestLogs.length > 0 && batchLabour.length > 0) {
    badgesEarned.push('Record Keeper');
  }

  // Harvest Hero: Harvest details are successfully completed
  if (isHarvested) {
    badgesEarned.push('Harvest Hero');
  }

  // Traceability Expert: QR traceability is generated for the crop batch
  if (qrCode) {
    badgesEarned.push('Traceability Expert');
  }

  // AI Farmer: AI crop analysis is used at least five times
  if (aiChatsCount >= 5) {
    badgesEarned.push('AI Farmer');
  }

  // Bronze Farmer: Farmer reaches 150 points
  if (points >= 150) {
    badgesEarned.push('Bronze Farmer');
  }

  // Silver Farmer: Farmer reaches 300 points
  if (points >= 300) {
    badgesEarned.push('Silver Farmer');
  }

  // Gold Farmer: Farmer reaches 500 points
  if (points >= 500) {
    badgesEarned.push('Gold Farmer');
  }

  // Smart Farmer: Trust score remains above 90 during the crop cycle
  if (trustScore >= 90) {
    badgesEarned.push('Smart Farmer');
  }

  // Sustainable Farmer: Farmer follows all sustainability practices and maintains records (high sustainability score + pre-cultivation checks)
  const isSustainable = (batchDetails.sustainabilityScore || batchDetails.trust_score || 90) >= 94;
  if (isSustainable && hasPreCult) {
    badgesEarned.push('Sustainable Farmer');
  }

  // Master Farmer: Crop cycle is completed with high trust score and all major badges unlocked
  const hasBronze = points >= 150;
  const hasConsistency = activityStreak >= 4;
  const hasRecordKeeper = hasPreCult && irrigationLogs.length > 0 && fertLogs.length > 0 && pestLogs.length > 0 && batchLabour.length > 0;
  if (isCycleCompleted && trustScore >= 85 && hasBronze && hasConsistency && hasRecordKeeper) {
    badgesEarned.push('Master Farmer');
  }

  // Remove duplicates from badgesEarned
  const uniqueBadges = [...new Set(badgesEarned)];

  // --- 5. Level & Progress Calculator ---
  let currentLevel = 'Seedling';
  let progressPercentage = 0;
  
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (points >= lvl.min && points <= lvl.max) {
      currentLevel = lvl.name;
      const range = lvl.max - lvl.min;
      const progress = points - lvl.min;
      progressPercentage = lvl.max === Infinity ? 100 : Math.round((progress / range) * 100);
      break;
    }
  }

  // --- 6. Rewards Unlocked ---
  const levelIndex = LEVELS.findIndex(l => l.name === currentLevel) + 1;
  REWARDS.forEach(r => {
    if (levelIndex >= r.reqLevel) {
      rewardsUnlocked.push(r.name);
    }
  });

  let finalTrustScore = trustScore;
  if (points === 0 || uniqueBadges.length === 0) {
    if (logs.length === 0 && batchLabour.length === 0) {
      finalTrustScore = Math.min(10, finalTrustScore) || Math.floor(Math.random() * 11);
    } else {
      finalTrustScore = Math.min(50, finalTrustScore);
    }
  }

  return {
    totalPoints: points,
    currentLevel,
    earnedBadges: uniqueBadges,
    unlockedRewards: rewardsUnlocked,
    activityStreak,
    lastActivityDate,
    progressPercentage,
    trustScore: finalTrustScore
  };
}

export function calculateTrustScore(batchDetails, labourAccounts = []) {
  let score = 0;
  
  const preCult = batchDetails.pre_cultivation || {};
  const logs = batchDetails.cultivation_logs || [];
  const status = batchDetails.status || 'Growing';

  // 1. Pre-cultivation checks (Max 60%):
  // Soil test status passed: +15%
  if (preCult.soil_test_status === 'Passed') score += 15;
  // Heavy metal test passed: +15%
  if (preCult.heavy_metal_status === 'Passed') score += 15;
  // Water quality test completed: +10%
  if (preCult.water_quality && !preCult.water_quality.includes('Pending')) score += 10;
  // Seed provenance details present: +10%
  if (preCult.seed_provenance && preCult.seed_provenance !== '') score += 10;
  // Buffer zone check passed: +10%
  if (preCult.buffer_zone_check === 'Passed' || preCult.buffer_zone_check === 'Yes') score += 10;

  // 2. Cultivation activities (Max 40%):
  // Irrigation logged: +15%
  const irrigationLogs = logs.filter(l => l.activity_type === 'Irrigation Logged');
  if (irrigationLogs.length > 0) score += 15;
  // Fertilizer applied: +15%
  const fertLogs = logs.filter(l => l.activity_type === 'Fertilizer Application' || l.activity_type === 'Fertilizer Logged');
  if (fertLogs.length > 0) score += 15;
  // Pesticide applied: +10%
  const pestLogs = logs.filter(l => l.activity_type === 'Pesticide Application' || l.activity_type === 'Pesticide Logged');
  if (pestLogs.length > 0) score += 10;

  return Math.max(0, Math.min(100, score));
}
