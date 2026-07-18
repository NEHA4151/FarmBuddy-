import { API_BASE } from '../apiConfig';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const FarmContext = createContext();

const mockHash = (prevHash, data) => {
  const combined = prevHash + JSON.stringify(data) + Math.random().toString();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const part1 = Math.abs(hash).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash * 31).toString(16).substring(0, 8).padStart(8, '0');
  return `0x${part1}e8d4a9cfb058c49e29a${part2}771bc`;
};

const mockIpfsCid = () => {
  const characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = 'Qm';
  for (let i = 0; i < 44; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const initialBatches = [
  {
    id: 'FB-2026-001',
    cropType: 'Organic Honeycrisp Apples',
    farmerId: 'FMR-0921',
    farmerName: 'John Doe',
    seedDate: '2026-04-10',
    expectedHarvestDate: '2026-09-15',
    location: 'Section 4B, Green Valley Organic Farm, CA',
    soilType: 'Sandy Loam',
    notes: 'Premium high-density orchard crop. Drip irrigation, organic mulch applied.',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    status: 'Growing',
    qualityScore: 92,
    carbonFootprint: '0.18 kg CO2e / kg',
    waterUsage: '420 L / kg',
    sustainabilityScore: 96,
  },
  {
    id: 'FB-2026-002',
    cropType: 'Japanese Sweet Potatoes',
    farmerId: 'FMR-0921',
    farmerName: 'John Doe',
    seedDate: '2026-03-05',
    expectedHarvestDate: '2026-07-20',
    location: 'Hillside Terrace A, Green Valley Organic Farm, CA',
    soilType: 'Volcanic Soil',
    notes: 'High mineral soil content. Raised bed cultivation, micro-sprinklers installed.',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=80',
    status: 'In Quality Check',
    qualityScore: 88,
    carbonFootprint: '0.12 kg CO2e / kg',
    waterUsage: '280 L / kg',
    sustainabilityScore: 94,
  },
  {
    id: 'FB-2026-003',
    cropType: 'Premium Arabica Coffee',
    farmerId: 'FMR-1102',
    farmerName: 'Marcus Vane',
    seedDate: '2025-11-20',
    expectedHarvestDate: '2026-06-05',
    location: 'Highland Ridge Zone 2, Coffee Haven, HI',
    soilType: 'Clayey Soil',
    notes: 'Shade-grown under native canopy. Organic compost only. Hand-picked harvest.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    status: 'QA Approved',
    qualityScore: 97,
    carbonFootprint: '0.34 kg CO2e / kg',
    waterUsage: '650 L / kg',
    sustainabilityScore: 98,
  }
];

const initialTimeline = {
  'FB-2026-001': [
    {
      id: 'EVT-101',
      timestamp: '2026-04-10T08:30:00Z',
      type: 'Batch Created',
      operatorId: 'FMR-0921',
      payload: { crop: 'Organic Honeycrisp Apples', location: 'Section 4B', seedDate: '2026-04-10' },
      prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      currentHash: '0x3a92fd1b22e741c889a7c062db0e5c94285b73e5bf4cd18d9a6c91ecb2a4771b',
      ipfsCid: 'QmYwAPJzv5CZ1zo62FMMn7g8b6A28nU9c5eR7K3m5oA5q8',
      verified: true,
    },
    {
      id: 'EVT-102',
      timestamp: '2026-05-01T10:15:00Z',
      type: 'Irrigation Logged',
      operatorId: 'FMR-0921',
      payload: { source: 'Natural Groundwater Well #2', volumeLitres: '1200', soilMoisturePost: '52%' },
      prevHash: '0x3a92fd1b22e741c889a7c062db0e5c94285b73e5bf4cd18d9a6c91ecb2a4771b',
      currentHash: '0x8b54e7d4a9cfb058c49e29a95bc6e91ec088a8d1bb4c9e7a771bcfa9e7542d62',
      ipfsCid: 'QmPhn5b8M1Yk49y2Z4u2d8a57e3c4V1Xn2g7K9L2t5v6Wq',
      verified: true,
    },
    {
      id: 'EVT-103',
      timestamp: '2026-06-02T14:40:00Z',
      type: 'Fertilizer Application',
      operatorId: 'FMR-0921',
      payload: { brand: 'BioGrow Organic Nutrients', quantityKg: '25', method: 'Soil Drenching' },
      prevHash: '0x8b54e7d4a9cfb058c49e29a95bc6e91ec088a8d1bb4c9e7a771bcfa9e7542d62',
      currentHash: '0x2c98d7fa28b5849e7b29a8f6e7c91eb44d85a3c9bb4c9e2b17fbc8d6542a17cb',
      ipfsCid: 'QmT5NyFwYg6H2b7oQ9G7V5R4x6q5W8C4n9B3P2t1r8V4Kz',
      verified: true,
    }
  ],
  'FB-2026-002': [
    {
      id: 'EVT-201',
      timestamp: '2026-03-05T09:00:00Z',
      type: 'Batch Created',
      operatorId: 'FMR-0921',
      payload: { crop: 'Japanese Sweet Potatoes', location: 'Hillside Terrace A', seedDate: '2026-03-05' },
      prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      currentHash: '0x41f89bc728a5bc9006fe9b50ce711bc7a2a4b89e27c1bfd65c4efcda87a4de8b',
      ipfsCid: 'QmVg7Wn9d4K2a3P5t7c6W8b1L4N2X6n9t1V8K2R5Y4M1q2',
      verified: true,
    },
    {
      id: 'EVT-202',
      timestamp: '2026-06-11T16:00:00Z',
      type: 'Crop Harvested',
      operatorId: 'FMR-0921',
      payload: { yieldWeightKg: '850', weatherCondition: 'Clear / Sunny', storageLocation: 'Silo C' },
      prevHash: '0x41f89bc728a5bc9006fe9b50ce711bc7a2a4b89e27c1bfd65c4efcda87a4de8b',
      currentHash: '0x9d5b73e5bf4cd18d9a6c91ecb2a4771bc84efc78b4f7e2a9b3d4f5c6b7a8d9e2',
      ipfsCid: 'QmNtP5g8m1r8V4KzT5NyFwYg6H2b7oQ9G7V5R4x6q5W8C4n',
      verified: true,
    }
  ],
  'FB-2026-003': [
    {
      id: 'EVT-301',
      timestamp: '2025-11-20T07:15:00Z',
      type: 'Batch Created',
      operatorId: 'FMR-1102',
      payload: { crop: 'Premium Arabica Coffee', location: 'Highland Ridge Zone 2', seedDate: '2025-11-20' },
      prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      currentHash: '0x5c4efcda87a4de8bf89bc728a5bc9006fe9b50ce711bc7a2a4b89e27c1bfd65c',
      ipfsCid: 'QmPhn5b8M1Yk49y2Z4u2d8a57e3c4V1Xn2g7K9L2t5v6Wq',
      verified: true,
    },
    {
      id: 'EVT-302',
      timestamp: '2026-06-03T11:00:00Z',
      type: 'Crop Harvested',
      operatorId: 'FMR-1102',
      payload: { yieldWeightKg: '420', cherryQualityScore: 'AA Premium', storageLocation: 'Climate-controlled Vault B' },
      prevHash: '0x5c4efcda87a4de8bf89bc728a5bc9006fe9b50ce711bc7a2a4b89e27c1bfd65c',
      currentHash: '0x7e2a9b3d4f5c6b7a8d9e29d5b73e5bf4cd18d9a6c91ecb2a4771bc84efc78b4f',
      ipfsCid: 'QmR7K3m5oA5q8YwAPJzv5CZ1zo62FMMn7g8b6A28nU9c5e',
      verified: true,
    },
    {
      id: 'EVT-303',
      timestamp: '2026-06-04T10:00:00Z',
      type: 'QA Inspected',
      operatorId: 'QA-ALICE',
      payload: { inspector: 'Alice Smith', laboratoryReportId: 'LAB-9921', moistureLevel: '10.5%', compliancePassed: true },
      prevHash: '0x7e2a9b3d4f5c6b7a8d9e29d5b73e5bf4cd18d9a6c91ecb2a4771bc84efc78b4f',
      currentHash: '0x3c9bb4c9e2b17fbc8d6542a17cb2c98d7fa28b5849e7b29a8f6e7c91eb44d85a',
      ipfsCid: 'QmZ4u2d8a57e3c4V1Xn2g7K9L2t5v6WqPhn5b8M1Yk49y2',
      verified: true,
    },
    {
      id: 'EVT-304',
      timestamp: '2026-06-05T09:30:00Z',
      type: 'QA Approved',
      operatorId: 'QA-ALICE',
      payload: { approvedBy: 'Alice Smith', certifiedGrade: 'Grade 1 Specialty', certId: 'CERT-HAWAII-448' },
      prevHash: '0x3c9bb4c9e2b17fbc8d6542a17cb2c98d7fa28b5849e7b29a8f6e7c91eb44d85a',
      currentHash: '0xba8efc78b4f7e2a9b3d4f5c6b7a8d9e29d5b73e5bf4cd18d9a6c91ecb2a4771b',
      ipfsCid: 'QmVg7Wn9d4K2a3P5t7c6W8b1L4N2X6n9t1V8K2R5Y4M1q2',
      verified: true,
    }
  ]
};

const initialNotifications = [
  {
    id: 1,
    title: 'Soil Moisture Alert',
    description: 'Section 4B moisture fell to 34%. Recommend irrigation cycle.',
    time: '2 hours ago',
    read: false,
    type: 'warning',
  },
  {
    id: 2,
    title: 'Batch Block Verified',
    description: 'Harvest block for Batch FB-2026-002 confirmed on public ledger.',
    time: '4 hours ago',
    read: false,
    type: 'success',
  },
  {
    id: 3,
    title: 'Quality Audit Pending',
    description: 'Batch FB-2026-002 Sweet Potatoes has been submitted for lab audit.',
    time: '1 day ago',
    read: true,
    type: 'info',
  }
];

const initialScheduledActivities = [
  {
    id: 'sch-1',
    batchId: 'FB-2026-001',
    date: '2026-06-20',
    type: 'Watering',
    notes: 'Standard morning drip irrigation.',
    completed: true,
    completedAt: '2026-06-20T08:00:00Z'
  },
  {
    id: 'sch-2',
    batchId: 'FB-2026-001',
    date: '2026-06-22',
    type: 'Pesticide',
    notes: 'Apply organic neem oil spray.',
    completed: true,
    completedAt: '2026-06-22T09:30:00Z'
  },
  {
    id: 'sch-3',
    batchId: 'FB-2026-001',
    date: '2026-06-24',
    type: 'Fertilizer',
    notes: 'Apply BioGrow compost.',
    completed: false
  },
  {
    id: 'sch-4',
    batchId: 'FB-2026-001',
    date: '2026-06-26',
    type: 'Watering',
    notes: 'Check soil moisture first.',
    completed: false
  },
  {
    id: 'sch-5',
    batchId: 'FB-2026-002',
    date: '2026-06-23',
    type: 'Watering',
    notes: 'Sprinklers for sweet potatoes.',
    completed: true,
    completedAt: '2026-06-23T07:15:00Z'
  },
  {
    id: 'sch-6',
    batchId: 'FB-2026-002',
    date: '2026-06-24',
    type: 'Pesticide',
    notes: 'Insect check and spot treatment.',
    completed: false
  }
];

export const FarmProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/batch/')) return 'batch-detail';
    if (path.startsWith('/traceability/')) return 'consumer-traceability';
    return 'login';
  });
  const [currentBatchId, setCurrentBatchId] = useState(() => {
    const path = window.location.pathname;
    const matchBatch = path.match(/^\/batch\/([^\/]+)$/);
    const matchTrace = path.match(/^\/traceability\/([^\/]+)$/);
    if (matchBatch) return matchBatch[1];
    if (matchTrace) return matchTrace[1];
    return null;
  });
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [batches, setBatches] = useState(initialBatches);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduledActivities, setScheduledActivities] = useState(initialScheduledActivities);
  const [reports, setReports] = useState([]);
  const [labourAccounts, setLabourAccounts] = useState([]);
  const [cropCycles, setCropCycles] = useState([]);
  const [creditContacts, setCreditContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [kccAccounts, setKccAccounts] = useState([]);
  const [subsidies, setSubsidies] = useState([]);
  const lastMoistureAlert = useRef(false);
  const lastTempAlert = useRef(false);
  const prevBatchesRef = useRef([]);
  const hasLoadedFromDb = useRef(false);

  const [floatingCoins, setFloatingCoins] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [rewardPopups, setRewardPopups] = useState([]);
  const [currentRank, setCurrentRank] = useState(null);

  const triggerFloatingCoins = (count = 5) => {
    const newCoins = [];
    for (let i = 0; i < count; i++) {
      newCoins.push({
        id: Math.random().toString(),
        x: Math.random() * 80 - 40,
        y: Math.random() * 80 - 40
      });
    }
    setFloatingCoins(prev => [...prev, ...newCoins]);
  };

  const triggerFloatingText = (text, color = 'text-amber-500') => {
    setFloatingTexts(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        text,
        color
      }
    ]);
  };

  const triggerRewardPopup = (type, title, subtitle, bonus = '') => {
    setRewardPopups(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type,
        title,
        subtitle,
        bonus
      }
    ]);
  };

  const refreshLeaderboardRank = async () => {
    try {
      const loggedName = user?.name || 'John Doe';
      const res = await fetch(`${API_BASE}/api/leaderboard?farmerName=${encodeURIComponent(loggedName)}`);
      if (res.ok) {
        const standings = await res.json();
        const me = standings.find(f => f.name.toLowerCase() === loggedName.toLowerCase());
        if (me && me.rank) {
          if (currentRank && me.rank < currentRank) {
            confetti({
              particleCount: 120,
              spread: 70,
              colors: ['#34d399', '#059669', '#ffffff']
            });
            triggerRewardPopup(
              'rank_up',
              '🎉 RANK UP!',
              `Outstanding! You moved up to Rank #${me.rank} in the standings!`,
              `Rank #${currentRank} ➔ Rank #${me.rank}`
            );
          }
          setCurrentRank(me.rank);
        }
      }
    } catch (err) {
      console.warn("Could not check leaderboard rank", err);
    }
  };

  useEffect(() => {
    if (!hasLoadedFromDb.current) {
      prevBatchesRef.current = JSON.parse(JSON.stringify(batches));
      return;
    }
    if (batches && batches.length > 0 && prevBatchesRef.current && prevBatchesRef.current.length > 0) {
      batches.forEach(newB => {
        const oldB = prevBatchesRef.current.find(o => o.id === newB.id);
        if (oldB) {
          // 1. Points increase detection
          // (Animates the total points counter smoothly in the UI)

          // 2. Trust score change detection
          const trustDiff = (newB.qualityScore || 0) - (oldB.qualityScore || 0);
          if (trustDiff !== 0) {
            
            // Milestone checks: 80%, 90%, 95%
            const milestones = [80, 90, 95];
            milestones.forEach(m => {
              if (oldB.qualityScore < m && newB.qualityScore >= m) {
                triggerRewardPopup(
                  'trust_milestone',
                  `Trust Milestone Crossed!`,
                  `Batch ${newB.id} has achieved a Trust Score of ${newB.qualityScore}%!`,
                  `⭐ Trust Milestone: Premium Quality Verified`
                );
              }
            });
          }

          // 3. Level up detection
          if (newB.currentLevel && oldB.currentLevel && newB.currentLevel !== oldB.currentLevel) {
            const oldIdx = ['Seedling', 'Sprout', 'Growing Plant', 'Healthy Crop', 'Smart Farmer', 'Master Farmer'].indexOf(oldB.currentLevel);
            const newIdx = ['Seedling', 'Sprout', 'Growing Plant', 'Healthy Crop', 'Smart Farmer', 'Master Farmer'].indexOf(newB.currentLevel);
            
            if (newIdx > oldIdx) {
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
              triggerRewardPopup(
                'level_up',
                '🎉 LEVEL UP!',
                `Congratulations! You reached the "${newB.currentLevel}" level in batch ${newB.id}!`,
                `👑 Level Reward Unlocked`
              );
            }
          }

          // 4. Badge unlock detection
          if (newB.earnedBadges && oldB.earnedBadges) {
            const newBadges = newB.earnedBadges.filter(x => !oldB.earnedBadges.includes(x));
            if (newBadges.length > 0) {
              newBadges.forEach(badge => {
                confetti({
                  particleCount: 85,
                  spread: 65,
                  colors: ['#f59e0b', '#d97706', '#fbbf24']
                });
                triggerRewardPopup(
                  'badge_unlock',
                  '🏅 BADGE UNLOCKED!',
                  `You earned the "${badge}" badge in batch ${newB.id}.`,
                  `🪙 +50 Bonus Points`
                );
              });
            }
          }
        }
      });
    }
    prevBatchesRef.current = JSON.parse(JSON.stringify(batches));
  }, [batches]);

  const refreshReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.warn("Could not fetch reports from backend", err);
    }
  };

  useEffect(() => {
    refreshReports();
  }, []);

  const calculateTrustScore = (batchId) => {
    let score = 100;
    const batchSchedules = scheduledActivities.filter(a => a.batchId === batchId);
    const todayStr = '2026-06-25';
    
    // 1. Missed activities (-1 point each)
    const missedCount = batchSchedules.filter(a => a.date < todayStr && !a.completed).length;
    score -= missedCount * 1.0;
    
    // 2. Delayed activities (-0.5 point each)
    let delayedCount = 0;
    batchSchedules.forEach(a => {
      if (a.completed && a.completedAt) {
        const compDate = a.completedAt.split('T')[0];
        if (compDate > a.date) {
          delayedCount++;
        }
      }
    });
    score -= delayedCount * 0.5;

    // 3. Fake/incomplete logs (-2 points each)
    const batch = batches.find(b => b.id === batchId);
    if (batch && batch.verification_logs) {
      score -= batch.verification_logs.length * 2.0;
    }
    
    // 4. Sensor anomalies ignored (-1 point)
    if (telemetry && telemetry.soilMoisture < 35) {
      score -= 1.0;
    }

    // 5. Proper reports uploaded (+0.5 point each)
    const batchReports = reports.filter(r => r.name.startsWith(`[${batchId}]`));
    score += batchReports.length * 0.5;

    score = Math.max(0, Math.min(100, score));
    return parseFloat(score.toFixed(1));
  };
  
  // IoT live sensor values (fluctuating slightly)
  const [telemetry, setTelemetry] = useState({
    soilMoisture: 42.5,
    temperature: 22.4,
    phLevel: 6.42,
    humidity: 68.0,
  });

  // Fetch batches from express server on mount
  const refreshBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batches`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(b => ({
          id: b.batch_id,
          cropType: b.crop_name,
          farmerId: b.farmer_id || 'FMR-0921',
          farmerName: b.farmer_name || 'John Doe',
          seedDate: b.sowing_date ? b.sowing_date.split('T')[0] : '',
          expectedHarvestDate: b.expected_harvest ? b.expected_harvest.split('T')[0] : '',
          location: b.farm_location,
          notes: '',
          imageUrl: b.crop_image,
          status: b.status,
          qrCode: b.qr_code,
          qr_code: b.qr_code,
          qualityScore: b.trust_score,
          carbonFootprint: b.batch_id === 'FB-2026-001' ? '0.18 kg CO2e / kg' : b.batch_id === 'FB-2026-002' ? '0.12 kg CO2e / kg' : '0.34 kg CO2e / kg',
          waterUsage: b.batch_id === 'FB-2026-001' ? '420 L / kg' : b.batch_id === 'FB-2026-002' ? '280 L / kg' : '650 L / kg',
          sustainabilityScore: Math.min(b.trust_score + 2, 100),
          totalPoints: b.total_points || 0,
          currentLevel: b.current_level || 'Seedling',
          earnedBadges: Array.isArray(b.earned_badges) ? b.earned_badges : (typeof b.earned_badges === 'string' ? JSON.parse(b.earned_badges) : []),
          unlockedRewards: Array.isArray(b.unlocked_rewards) ? b.unlocked_rewards : (typeof b.unlocked_rewards === 'string' ? JSON.parse(b.unlocked_rewards) : []),
          activityStreak: b.activity_streak || 1,
          lastActivityDate: b.last_activity_date || null,
          progressPercentage: b.progress_percentage || 0
        }));
        setBatches(mapped);
        refreshLeaderboardRank();
        setTimeout(() => {
          hasLoadedFromDb.current = true;
        }, 100);
      }

      // Sync and load timeline logs from database
      const resLogs = await fetch(`${API_BASE}/api/logs`);
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setTimeline(logsData);
      }
    } catch (err) {
      console.warn('Could not connect to backend server, using offline mock batches.', err.message);
    }
  };

  const fetchLabourAccounts = async (batchId) => {
    const activeBatchId = batchId || currentBatchId;
    if (!activeBatchId) return;

    try {
      const res = await fetch(`${API_BASE}/api/batches/${activeBatchId}/labour`);
      if (res.ok) {
        const data = await res.json();
        setLabourAccounts(data);
        localStorage.setItem(`farmbuddy_labour_accounts_${activeBatchId}`, JSON.stringify(data));
      } else {
        throw new Error('Failed to fetch from API');
      }
    } catch (err) {
      console.warn(`Could not connect to backend server, using localStorage fallback for labour accounts of batch ${activeBatchId}.`, err.message);
      const cached = localStorage.getItem(`farmbuddy_labour_accounts_${activeBatchId}`);
      if (cached) {
        setLabourAccounts(JSON.parse(cached));
      } else {
        const initialMock = [];
        if (activeBatchId === 'FB-2026-002') {
          initialMock.push({
            id: 1,
            batch_id: 'FB-2026-002',
            date: '2026-06-15',
            total_labour: 12,
            male: 7,
            female: 5,
            duration: 8.0,
            wage: 15.0,
            total_expense: 1440.0,
            remarks: 'Sowing sweet potatoes in terrace A.'
          });
        } else if (activeBatchId === 'FB-2026-001') {
          initialMock.push({
            id: 2,
            batch_id: 'FB-2026-001',
            date: '2026-06-20',
            total_labour: 8,
            male: 4,
            female: 4,
            duration: 6.0,
            wage: 16.5,
            total_expense: 792.0,
            remarks: 'Watering & weeding orchard Section 4B.'
          });
        }
        setLabourAccounts(initialMock);
        localStorage.setItem(`farmbuddy_labour_accounts_${activeBatchId}`, JSON.stringify(initialMock));
      }
    }
  };

  useEffect(() => {
    refreshBatches();
  }, []);

  const refreshFinanceData = async () => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const resCc = await fetch(`${API_BASE}/api/crop-cycles?farmerId=${fId}`);
      if (resCc.ok) {
        const data = await resCc.json();
        setCropCycles(data);
      }
      const resCcContacts = await fetch(`${API_BASE}/api/credit-contacts?farmerId=${fId}`);
      if (resCcContacts.ok) {
        const data = await resCcContacts.json();
        setCreditContacts(data);
      }
      const resTx = await fetch(`${API_BASE}/api/transactions?farmerId=${fId}`);
      if (resTx.ok) {
        const data = await resTx.json();
        setTransactions(data);
      }
      const resKcc = await fetch(`${API_BASE}/api/kcc-accounts?farmerId=${fId}`);
      if (resKcc.ok) {
        const data = await resKcc.json();
        setKccAccounts(data);
      }
      const resLabour = await fetch(`${API_BASE}/api/labour?farmerId=${fId}`);
      if (resLabour.ok) {
        const data = await resLabour.json();
        setLabourAccounts(data);
      }
      const resSub = await fetch(`${API_BASE}/api/subsidies?farmerId=${fId}`);
      if (resSub.ok) {
        const data = await resSub.json();
        setSubsidies(data);
      }
    } catch (err) {
      console.warn("Could not fetch finance data:", err);
    }
  };

  const addCropCycle = async (cycleData) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/crop-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: fId, ...cycleData })
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error adding crop cycle:", err);
    }
    return false;
  };

  const updateCropCycle = async (id, cycleData) => {
    try {
      const res = await fetch(`${API_BASE}/api/crop-cycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycleData)
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error updating crop cycle:", err);
    }
    return false;
  };

  const deleteCropCycle = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/crop-cycles/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error deleting crop cycle:", err);
    }
    return false;
  };

  const addCreditContact = async (contactData) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/credit-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: fId, ...contactData })
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error adding credit contact:", err);
    }
    return false;
  };

  const updateCreditContact = async (id, contactData) => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error updating credit contact:", err);
    }
    return false;
  };

  const deleteCreditContact = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-contacts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error deleting credit contact:", err);
    }
    return false;
  };

  const addTransaction = async (txData) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: fId, ...txData })
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
    return false;
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
    return false;
  };

  const updateTransaction = async (id, txData) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: fId, ...txData })
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
    }
    return false;
  };

  const addSubsidy = async (subsidyData) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/subsidies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: fId, ...subsidyData })
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error adding subsidy:", err);
    }
    return false;
  };

  const updateSubsidy = async (id, subsidyData) => {
    try {
      const res = await fetch(`${API_BASE}/api/subsidies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subsidyData)
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error updating subsidy:", err);
    }
    return false;
  };

  const deleteSubsidy = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/subsidies/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error deleting subsidy:", err);
    }
    return false;
  };

  const updateKcc = async (kccData) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/kcc-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: fId, ...kccData })
      });
      if (res.ok) {
        await refreshFinanceData();
        return true;
      }
    } catch (err) {
      console.error("Error updating KCC account:", err);
    }
    return false;
  };

  useEffect(() => {
    if (user) {
      refreshFinanceData();
    }
  }, [user]);

  const addLabourAccount = async (entry) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/labour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, farmer_id: fId })
      });
      if (res.ok) {
        await refreshFinanceData();
        addNotification("Labour Account Added", "A new labour account record has been saved successfully.", "success");
        return true;
      }
    } catch (err) {
      console.error("Error adding labour account:", err);
    }
    return false;
  };

  const updateLabourAccount = async (id, entry) => {
    const fId = user?.farmerId || 'FMR-0921';
    try {
      const res = await fetch(`${API_BASE}/api/labour/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, farmer_id: fId })
      });
      if (res.ok) {
        await refreshFinanceData();
        addNotification("Labour Account Updated", "The labour account record has been updated.", "success");
        return true;
      }
    } catch (err) {
      console.error("Error updating labour account:", err);
    }
    return false;
  };

  const deleteLabourAccount = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/labour/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshFinanceData();
        addNotification("Labour Account Deleted", "The record has been permanently deleted.", "success");
        return true;
      }
    } catch (err) {
      console.error("Error deleting labour account:", err);
    }
    return false;
  };

  // Fetch complete details from backend
  const fetchBatchDetails = async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(`Error fetching details for batch ${batchId}:`, err);
    }
    return null;
  };

  // Perform ledger verification check
  const verifyBatch = async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/verify`);
      if (res.ok) {
        const data = await res.json();
        // Log event here:
        await logBatchEvent(
          'Verification Check',
          'Ledger Integrity Verified',
          `Ledger cryptographic hash verification completed. Result: ${data.status || 'Verified'}`,
          data.status === 'TAMPERED' ? 'Failed' : 'Success',
          data.status === 'TAMPERED' ? -20.0 : 0.0,
          batchId
        );
        return data;
      }
    } catch (err) {
      console.error(`Error verifying batch ${batchId}:`, err);
    }
    return null;
  };

  // Simulate database tampering
  const tamperBatch = async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/tamper`, {
        method: 'POST'
      });
      if (res.ok) {
        await refreshBatches();
        
        // Log event here:
        await logBatchEvent(
          'Ledger Tampered',
          'Cryptographic Tampering Warning',
          'Warning: A block/record mismatch was simulated. Data integrity compromised.',
          'Failed',
          -20.0,
          batchId
        );

        return await res.json();
      }
    } catch (err) {
      console.error(`Error simulating tampering for batch ${batchId}:`, err);
    }
    return null;
  };

  // Dark mode trigger
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Real telemetry fetching from VPS immudb
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/telemetry`);
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch (err) {
        console.error('Failed to fetch live telemetry:', err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const login = (emailOrUserObj, password, role) => {
    hasLoadedFromDb.current = false;
    if (emailOrUserObj && typeof emailOrUserObj === 'object') {
      setUser(emailOrUserObj);
      setCurrentView(emailOrUserObj.role === 'admin' ? 'admin-dashboard' : 'farmer-dashboard');
    } else {
      if (role === 'farmer') {
        setUser({
          name: 'John Doe',
          email: emailOrUserObj || 'john@farmbuddy.com',
          role: 'farmer',
          farmerId: 'FMR-0921',
          farmName: 'Green Valley Organic Farm',
        });
        setCurrentView('farmer-dashboard');
      } else {
        setUser({
          name: 'Alice Smith',
          email: emailOrUserObj || 'alice@farmbuddy.com',
          role: 'admin',
          adminId: 'QA-ALICE',
          department: 'Quality Assurance & Trust',
        });
        setCurrentView('admin-dashboard');
      }
    }
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
  };

  const logout = () => {
    hasLoadedFromDb.current = false;
    setUser(null);
    setCurrentView('login');
  };

  const createBatch = async (newBatchData) => {
    const payload = {
      ...newBatchData,
      farmerId: user?.farmerId || 'FMR-0921',
      farmerName: user?.name || 'John Doe'
    };
    try {
      const res = await fetch(`${API_BASE}/api/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        await refreshBatches();
        
        // Log event here:
        await logBatchEvent(
          'Batch Created',
          'Crop Batch Initialized',
          `Batch ${result.batch_id} (${newBatchData.cropType}) successfully initialized on the ledger.`,
          'Success',
          0.0,
          result.batch_id
        );

        // Add Notification
        setNotifications([
          {
            id: Date.now(),
            title: 'New Batch Logged',
            description: `Batch ${result.batch_id} (${newBatchData.cropType}) successfully initialized on the ledger.`,
            time: 'Just now',
            read: false,
            type: 'success',
          },
          ...notifications,
        ]);

        setCurrentBatchId(result.batch_id);
        setCurrentView('workflow-calendar');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } else {
        // Offline Fallback
        const newId = `FB-2026-${String(batches.length + 1).padStart(3, '0')}`;
        const newBatch = {
          id: newId,
          cropType: newBatchData.cropType,
          farmerId: user?.farmerId || 'FMR-0921',
          farmerName: user?.name || 'John Doe',
          seedDate: newBatchData.seedDate || new Date().toISOString().split('T')[0],
          expectedHarvestDate: newBatchData.expectedHarvestDate || '',
          location: newBatchData.location || 'Green Valley Farm',
          soilType: newBatchData.soilType || 'Loam',
          notes: newBatchData.notes || '',
          imageUrl: newBatchData.imageUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
          status: 'Planted',
          qualityScore: 90,
          carbonFootprint: '0.15 kg CO2e / kg',
          waterUsage: '350 L / kg',
          sustainabilityScore: 95,
        };

        const initialBlock = {
          id: `EVT-${Math.floor(Math.random() * 900) + 100}`,
          timestamp: new Date().toISOString(),
          type: 'Batch Created',
          operatorId: user?.farmerId || 'FMR-0921',
          payload: { crop: newBatch.cropType, location: newBatch.location, seedDate: newBatch.seedDate },
          prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          currentHash: mockHash('0x0000000000000000000000000000000000000000000000000000000000000000', newBatch),
          ipfsCid: mockIpfsCid(),
          verified: true,
        };

        // Log event here:
        await logBatchEvent(
          'Batch Created',
          'Crop Batch Initialized (Offline)',
          `Batch ${newId} (${newBatchData.cropType}) successfully created locally.`,
          'Success',
          0.0,
          newId
        );

        setBatches([newBatch, ...batches]);
        setTimeline({
          ...timeline,
          [newId]: [initialBlock],
        });
        
        setNotifications([
          {
            id: Date.now(),
            title: 'New Batch Logged (Offline)',
            description: `Batch ${newId} (${newBatch.cropType}) initialized locally.`,
            time: 'Just now',
            read: false,
            type: 'success',
          },
          ...notifications,
        ]);

        setCurrentBatchId(newId);
        setCurrentView('workflow-calendar');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.warn('Network error creating batch, using offline creation.', err);
    }
  };

  const addEvent = async (batchId, eventType, payloadData) => {
    try {
      const description = typeof payloadData === 'string' ? payloadData : JSON.stringify(payloadData);
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, description })
      });
      if (res.ok) {
        await refreshBatches();
        
        // Log event here:
        await logBatchEvent(
          eventType,
          eventType,
          description,
          'Success',
          2.0, // +2 points
          batchId
        );

        setNotifications([
          {
            id: Date.now(),
            title: 'Blockchain Block Appended',
            description: `Event "${eventType}" recorded for batch ${batchId}.`,
            time: 'Just now',
            read: false,
            type: 'success',
          },
          ...notifications,
        ]);

        confetti({ particleCount: 80, spread: 50, colors: ['#10b981', '#059669', '#34d399'] });
      } else {
        // Offline Fallback
        const currentBatchEvents = timeline[batchId] || [];
        const prevBlock = currentBatchEvents[currentBatchEvents.length - 1];
        const prevHash = prevBlock ? prevBlock.currentHash : '0x0000000000000000000000000000000000000000000000000000000000000000';

        const newBlock = {
          id: `EVT-${Math.floor(Math.random() * 900) + 100}`,
          timestamp: new Date().toISOString(),
          type: eventType,
          operatorId: user?.farmerId || user?.adminId || 'FMR-0921',
          payload: payloadData,
          prevHash: prevHash,
          currentHash: mockHash(prevHash, payloadData),
          ipfsCid: mockIpfsCid(),
          verified: true,
        };

        // Log event here:
        await logBatchEvent(
          eventType,
          eventType + ' (Offline)',
          description,
          'Success',
          2.0, // +2 points
          batchId
        );

        const updatedBatches = batches.map(b => {
          if (b.id === batchId) {
            let newStatus = b.status;
            if (eventType === 'Crop Harvested') newStatus = 'In Quality Check';
            if (eventType === 'QA Approved') newStatus = 'QA Approved';
            if (eventType === 'QA Rejected') newStatus = 'QA Rejected';
            if (eventType === 'Shipped') newStatus = 'Shipped';
            return { ...b, status: newStatus };
          }
          return b;
        });

        setBatches(updatedBatches);
        setTimeline({
          ...timeline,
          [batchId]: [...currentBatchEvents, newBlock],
        });

        setNotifications([
          {
            id: Date.now(),
            title: 'Blockchain Block Appended (Offline)',
            description: `Event "${eventType}" recorded for batch ${batchId}.`,
            time: 'Just now',
            read: false,
            type: 'success',
          },
          ...notifications,
        ]);

        confetti({ particleCount: 80, spread: 50, colors: ['#10b981', '#059669', '#34d399'] });
      }
    } catch (err) {
      console.warn('Network error logging event, using offline logging.', err);
    }
  };

  const approveQA = (batchId, inspectorName = 'Alice Smith', score = 96) => {
    // 1. Add QA Inspected event
    addEvent(batchId, 'QA Inspected', {
      inspector: inspectorName,
      laboratoryReportId: `LAB-${Math.floor(Math.random() * 9000) + 1000}`,
      moistureLevel: '11.2%',
      compliancePassed: true
    });

    // 2. Add QA Approved event
    setTimeout(() => {
      addEvent(batchId, 'QA Approved', {
        approvedBy: inspectorName,
        certifiedGrade: 'Grade AA Certified Organic',
        certId: `CERT-FB-${Math.floor(Math.random() * 900) + 100}`,
        chemicalResiduals: '0.00% (Not Detected)',
      });

      // Update the batch QA details
      setBatches(prev => prev.map(b => {
        if (b.id === batchId) {
          return {
            ...b,
            status: 'QA Approved',
            qualityScore: score,
            sustainabilityScore: Math.min(score + 2, 100),
          };
        }
        return b;
      }));
    }, 1500);
  };

  const rejectQA = (batchId, inspectorName = 'Alice Smith', reason = 'Chemical residues exceeded maximum threshold (0.05 ppm).') => {
    addEvent(batchId, 'QA Inspected', {
      inspector: inspectorName,
      laboratoryReportId: `LAB-${Math.floor(Math.random() * 9000) + 1000}`,
      moistureLevel: '14.8% (Too wet)',
      compliancePassed: false
    });

    setTimeout(() => {
      addEvent(batchId, 'QA Rejected', {
        rejectedBy: inspectorName,
        reason: reason,
        certId: 'N/A',
      });

      setBatches(prev => prev.map(b => {
        if (b.id === batchId) {
          return { ...b, status: 'QA Rejected', qualityScore: 45 };
        }
        return b;
      }));
    }, 1500);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (title, description, type = 'info') => {
    setNotifications(prev => [
      {
        id: Date.now(),
        title,
        description,
        time: 'Just now',
        read: false,
        type
      },
      ...prev
    ]);
  };

  const generateReport = (filename = 'FarmBuddy_Batches_Report.csv') => {
    if (!batches || batches.length === 0) return;
    
    const headers = ['Batch ID', 'Crop Type', 'Farmer Name', 'Seed Date', 'Expected Harvest Date', 'Location', 'Soil Type', 'Status', 'Quality Score (%)', 'Sustainability Score (%)', 'Carbon Footprint', 'Water Usage'];
    
    const rows = batches.map(b => [
      b.id,
      `"${b.cropType.replace(/"/g, '""')}"`,
      `"${b.farmerName.replace(/"/g, '""')}"`,
      b.seedDate,
      b.expectedHarvestDate || 'N/A',
      `"${b.location.replace(/"/g, '""')}"`,
      b.soilType,
      b.status,
      b.qualityScore,
      b.sustainabilityScore,
      b.carbonFootprint,
      b.waterUsage
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification("Report Generated", `${filename} has been successfully generated and downloaded.`, "success");

    // Log event here:
    logBatchEvent(
      'Export Generated',
      'CSV Ledger Exported',
      `Generated CSV report: ${filename}`,
      'Success',
      0.0
    );
  };

  const logBatchEvent = async (eventType, eventTitle, eventDescription = '', eventStatus = 'Success', trustScoreImpact = 0, customBatchId = null) => {
    const batchId = customBatchId || currentBatchId;
    if (!batchId) {
      console.warn("No active batch to log event:", eventTitle);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/batch-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: user?.farmerId || 'NEHA_UVFARMS',
          event_type: eventType,
          event_title: eventTitle,
          event_description: eventDescription,
          event_status: eventStatus,
          trust_score_impact: parseFloat(trustScoreImpact)
        })
      });
      if (!res.ok) {
        console.warn(`Failed to log event on server: ${res.statusText}`);
      }
    } catch (err) {
      console.error('Error logging batch event:', err);
    }
  };

  // Scan for missed activities
  useEffect(() => {
    if (currentBatchId) {
      const today = '2026-06-25'; // Context date
      const batchSchedules = scheduledActivities.filter(a => a.batchId === currentBatchId);
      const missed = batchSchedules.filter(a => a.date < today && !a.completed);
      
      fetch(`${API_BASE}/api/batches/${currentBatchId}/batch-events`)
        .then(res => {
          if (res.ok) return res.json();
          return [];
        })
        .then(events => {
          missed.forEach(async (act) => {
            const alreadyLogged = events.some(e => e.event_type === 'Activity Missed' && e.event_description.includes(act.id));
            if (!alreadyLogged) {
              await logBatchEvent(
                'Activity Missed',
                `${act.type} Task Missed`,
                `Missed scheduled activity [ID: ${act.id}]: ${act.notes}. Date: ${act.date}`,
                'Failed',
                -5.0, // Missed: -5 points
                currentBatchId
              );
            }
          });
        })
        .catch(err => console.error("Error checking missed activities:", err));
    }
  }, [currentBatchId]);

  // Telemetry alerts tracking
  useEffect(() => {
    if (!currentBatchId) return;
    
    // 1. Soil Moisture Alert
    if (telemetry.soilMoisture < 35) {
      if (!lastMoistureAlert.current) {
        lastMoistureAlert.current = true;
        logBatchEvent(
          'Sensor Alert Triggered',
          'Soil Moisture Critical Anomaly',
          `Soil Moisture fell to ${telemetry.soilMoisture}%. Recommended target: 40% - 60%.`,
          'Warning',
          -1.0
        );
      }
    } else {
      if (lastMoistureAlert.current) {
        lastMoistureAlert.current = false;
        logBatchEvent(
          'Sensor Alert Resolved',
          'Soil Moisture Returned to Target',
          `Soil Moisture stabilized to ${telemetry.soilMoisture}%.`,
          'Success',
          0.0
        );
      }
    }
    
    // 2. Temperature Alert
    if (telemetry.temperature > 30) {
      if (!lastTempAlert.current) {
        lastTempAlert.current = true;
        logBatchEvent(
          'Sensor Alert Triggered',
          'Temperature High Anomaly',
          `Greenhouse temperature rose to ${telemetry.temperature}°C. Recommended target: 18°C - 28°C.`,
          'Warning',
          -1.0
        );
      }
    } else {
      if (lastTempAlert.current) {
        lastTempAlert.current = false;
        logBatchEvent(
          'Sensor Alert Resolved',
          'Temperature Returned to Target',
          `Temperature stabilized to ${telemetry.temperature}°C.`,
          'Success',
          0.0
        );
      }
    }
  }, [telemetry.soilMoisture, telemetry.temperature, currentBatchId]);

  return (
    <FarmContext.Provider value={{
      currentView,
      setCurrentView,
      currentBatchId,
      setCurrentBatchId,
      user,
      setUser,
      theme,
      toggleTheme,
      batches,
      setBatches,
      timeline,
      setTimeline,
      telemetry,
      notifications,
      addNotification,
      generateReport,
      markAsRead,
      clearAllNotifications,
      login,
      logout,
      createBatch,
      addEvent,
      approveQA,
      rejectQA,
      fetchBatchDetails,
      verifyBatch,
      tamperBatch,
      refreshBatches,
      sidebarOpen,
      setSidebarOpen,
      scheduledActivities,
      setScheduledActivities,
      reports,
      refreshReports,
      calculateTrustScore,
      logBatchEvent,
      labourAccounts,
      addLabourAccount,
      updateLabourAccount,
      deleteLabourAccount,
      cropCycles,
      creditContacts,
      transactions,
      kccAccounts,
      subsidies,
      refreshFinanceData,
      addCropCycle,
      updateCropCycle,
      deleteCropCycle,
      addCreditContact,
      updateCreditContact,
      deleteCreditContact,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateKcc,
      addSubsidy,
      updateSubsidy,
      deleteSubsidy,
      floatingCoins,
      setFloatingCoins,
      floatingTexts,
      setFloatingTexts,
      rewardPopups,
      setRewardPopups,
      triggerFloatingCoins,
      triggerFloatingText,
      triggerRewardPopup,
      refreshLeaderboardRank
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => useContext(FarmContext);
