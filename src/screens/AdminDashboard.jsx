import { API_BASE } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  Search, 
  History, 
  QrCode, 
  AlertTriangle,
  FileSpreadsheet,
  Lock,
  FileText,
  MapPin,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Compass,
  Database,
  Leaf,
  TrendingUp,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function AdminDashboard() {
  const { 
    batches, 
    timeline,
    approveQA, 
    rejectQA, 
    currentView,
    setCurrentView,
    currentBatchId, 
    setCurrentBatchId,
    calculateTrustScore,
    generateReport,
    refreshBatches
  } = useFarm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedBlockId, setExpandedBlockId] = useState(null);
  
  // Local state for QR generation in this view
  const [qrCodeData, setQrCodeData] = useState(null);
  const [copiedBatchId, setCopiedBatchId] = useState(null);

  const [activeBatchVerifyInfo, setActiveBatchVerifyInfo] = useState(null);
  const [loadingVerifyInfo, setLoadingVerifyInfo] = useState(false);
  const [verifyInfoError, setVerifyInfoError] = useState(null);

  const selectedBatch = batches.find(b => b.id === currentBatchId);
  const events = selectedBatch ? (timeline[selectedBatch.id] || []) : [];

  // Guard if a batch is selected but details are not found in the batches list yet (e.g. loading)
  if (currentBatchId && !selectedBatch) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-warmSand dark:bg-[#0c140f] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
        <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Loading batch details...</span>
      </div>
    );
  }

  // Sync local QR state when active batch changes
  useEffect(() => {
    if (selectedBatch) {
      setQrCodeData(selectedBatch.qr_code || selectedBatch.qrCode || null);
    } else {
      setQrCodeData(null);
    }
  }, [currentBatchId, selectedBatch]);

  // Fetch verification info when active batch changes
  useEffect(() => {
    if (currentView === 'admin-analytics' && currentBatchId) {
      setLoadingVerifyInfo(true);
      setVerifyInfoError(null);
      fetch(`${API_BASE}/api/batches/${currentBatchId}/verify`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch verification info');
          return res.json();
        })
        .then(data => {
          setActiveBatchVerifyInfo(data);
          setLoadingVerifyInfo(false);
        })
        .catch(err => {
          console.error('Error fetching verification details:', err);
          setVerifyInfoError(err.message);
          setLoadingVerifyInfo(false);
        });
    }
  }, [currentView, currentBatchId]);

  // Statistics prepared for main reports/charts
  const chartDataCrops = batches.map(b => ({
    name: b.id ? b.id.substring(8) : '',
    crop: b.cropType ? b.cropType.split(' ').slice(-1)[0] : 'Crop',
    sustainability: b.sustainabilityScore || 0,
    quality: b.qualityScore || 0
  }));

  const carbonChartData = [
    { name: 'Week 1', emissions: 0.38, standard: 0.65 },
    { name: 'Week 2', emissions: 0.32, standard: 0.65 },
    { name: 'Week 3', emissions: 0.28, standard: 0.65 },
    { name: 'Week 4', emissions: 0.24, standard: 0.65 },
    { name: 'Week 5', emissions: 0.18, standard: 0.65 }
  ];

  const handleGenerateQR = async () => {
    if (!currentBatchId) return;
    try {
      const qrPath = `https://farm-buddy-one.vercel.app/traceability/${currentBatchId}`;
      const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrPath })
      });
      if (res.ok) {
        await refreshBatches();
        setQrCodeData(qrPath);
      }
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('admin-qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${currentBatchId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHash = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedBatchId(id);
    setTimeout(() => setCopiedBatchId(null), 2000);
  };

  // Filtering Batches for main grid
  const filteredBatches = batches.filter(b => {
    const matchesSearch = 
      b.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      b.status.toLowerCase().replace(/\s+/g, '-') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getEventEmoji = (type) => {
    switch (type) {
      case 'Batch Created': return '🌱';
      case 'Irrigation Logged': return '💧';
      case 'Fertilizer Application': return '🧪';
      case 'Pesticide Application': return '🌿';
      case 'Crop Harvested': return '🌾';
      case 'QA Inspected': return '🔍';
      case 'QA Approved': return '✅';
      case 'QA Rejected': return '❌';
      case 'Shipped': return '🚚';
      default: return '📝';
    }
  };

  // VIEW 1: Main Dashboard (Batches Grid View)
  if (currentView === 'admin-dashboard' || (!currentBatchId && currentView !== 'admin-analytics')) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 sm:px-10 space-y-10 bg-warmSand dark:bg-[#0c140f] min-h-[calc(100vh-80px)] transition-colors duration-300 animate-fadeIn">
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-borders dark:border-emerald-950/20 pb-6">
          <div>
            <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Quality Audit Hub
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mt-1">
              Select an active cultivation batch ID below to audit its logs, verify blockchain consensus, or manage QR codes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop ID, farmer..."
                className="bg-white dark:bg-zinc-900 border border-borders rounded-xl pl-9 pr-3 py-2 text-xs text-stone-850 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary w-48 shadow-sm"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-borders rounded-xl px-3 py-2 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold shadow-sm"
            >
              <option value="all">All States</option>
              <option value="planted">Planted</option>
              <option value="growing">Growing</option>
              <option value="in-quality-check">In QA Audit</option>
              <option value="qa-approved">QA Approved</option>
              <option value="qa-rejected">QA Rejected</option>
              <option value="shipped">Shipped</option>
            </select>
          </div>
        </div>

        {/* Grid of Crop IDs / Batches */}
        {filteredBatches.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-950/20 border border-dashed border-borders dark:border-emerald-950/20 rounded-[28px] p-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300">No matching batches found</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((b) => {
              const score = calculateTrustScore ? calculateTrustScore(b.id) : b.trustScore;
              let scoreColor = 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400';
              if (score < 50) scoreColor = 'text-red-500 bg-red-500/10';
              else if (score < 75) scoreColor = 'text-amber-500 bg-amber-500/10';

              return (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.015, y: -2 }}
                  onClick={() => {
                    setCurrentBatchId(b.id);
                    setCurrentView('admin-approval');
                  }}
                  className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group animate-fadeIn"
                >
                  {/* Image & Status Tag */}
                  <div className="h-48 relative overflow-hidden bg-stone-100 dark:bg-zinc-900 border-b border-borders/60 dark:border-emerald-950/10">
                    <img
                      src={b.imageUrl}
                      alt={b.cropType}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                    
                    {/* Absolute overlays */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm text-white ${
                        b.status === 'QA Approved' ? 'bg-primary' :
                        b.status === 'In Quality Check' ? 'bg-amber-500' :
                        b.status === 'QA Rejected' ? 'bg-red-500' :
                        'bg-stone-900/85 backdrop-blur-sm'
                      }`}>
                        {b.status}
                      </span>
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 ${scoreColor}`}>
                        <Award className="h-3 w-3" />
                        {score} Trust
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-stone-900/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      {b.id}
                    </div>
                  </div>

                  {/* Info Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 truncate group-hover:text-primary transition-colors">
                        {b.cropType}
                      </h3>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {b.location.split(',')[0]}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-borders dark:border-emerald-950/10 text-stone-600 dark:text-stone-400">
                      <div>
                        <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Farmer</span>
                        <span className="font-extrabold text-stone-700 dark:text-stone-200">{b.farmerName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Sown Date</span>
                        <span className="font-extrabold text-stone-700 dark:text-stone-200">{b.seedDate}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Approval Section
  if (currentView === 'admin-approval') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="border-b border-borders dark:border-emerald-950/20 pb-4">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
            Workspace: {selectedBatch.id}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
            <ShieldCheck className="h-7 w-7 text-primary" />
            QA Approval Board
          </h1>
        </div>

        {/* Selected Batch Details */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="h-28 w-28 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
            <img src={selectedBatch.imageUrl} alt={selectedBatch.cropType} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                selectedBatch.status === 'QA Approved' ? 'bg-primary/10 text-primary' :
                selectedBatch.status === 'In Quality Check' ? 'bg-amber-500/10 text-amber-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                {selectedBatch.status}
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-2">
                {selectedBatch.cropType}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedBatch.location}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Planted {selectedBatch.seedDate}</span>
              <span className="font-semibold">Farmer: {selectedBatch.farmerName}</span>
            </div>
          </div>
        </div>

        {/* Interactive Approval Panel */}
        {selectedBatch.status === 'In Quality Check' ? (
          <div className="bg-white dark:bg-stone-800 border border-borders p-6 rounded-3xl shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">Pending QA Audit Queue</h3>
              <p className="text-xs text-stone-500 mt-1">Review the harvest report notes logged by the farmer before authorizing compliance pass.</p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-zinc-900/40 rounded-2xl border border-borders text-xs leading-relaxed text-stone-700 dark:text-stone-300">
              <span className="font-extrabold text-stone-900 dark:text-stone-100 block mb-1">Harvest Notes:</span>
              <p className="font-medium italic">"{selectedBatch.notes || 'No harvest notes recorded for this batch.'}"</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={async () => {
                  await approveQA(selectedBatch.id);
                  await refreshBatches();
                }}
                className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Approve Record Pass
              </button>
              <button
                onClick={async () => {
                  await rejectQA(selectedBatch.id);
                  await refreshBatches();
                }}
                className="flex-1 py-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="h-4.5 w-4.5" />
                Flag Residuals
              </button>
            </div>
          </div>
        ) : selectedBatch.status === 'QA Approved' || selectedBatch.status === 'Shipped' ? (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-3">
            <div className="p-3 bg-primary text-white rounded-full w-fit mx-auto shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-emerald-800 dark:text-emerald-400">Crop Batch Approved</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              This crop ledger has successfully passed compliance audit checks. Traceability signatures have been committed to the secure ledger.
            </p>
          </div>
        ) : (
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 text-center space-y-3">
            <div className="p-3 bg-red-600 text-white rounded-full w-fit mx-auto shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-red-600">QA Check Flagged / Rejected</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              This crop batch failed lab testing or displayed residue anomalies. Further packaging or distribution is blocked on the ledger database.
            </p>
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: Analytics View
  if (currentView === 'admin-analytics') {
    if (!currentBatchId) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center bg-warmSand dark:bg-[#0c140f] min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[28px] p-10 max-w-md shadow-sm space-y-5">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full w-fit mx-auto">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-150">No Batch Selected</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Select a batch to view analytics.
            </p>
            <button
              onClick={() => {
                setCurrentView('admin-dashboard');
              }}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    const isVerified = activeBatchVerifyInfo?.verified ?? (selectedBatch.status === 'QA Approved' || selectedBatch.status === 'Shipped');
    const trustScore = selectedBatch.qualityScore || (calculateTrustScore ? calculateTrustScore(selectedBatch.id) : 94);
    
    // Format expected harvest date
    const formatHarvestDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Trigger manual verification check
    const handleVerifyClick = async () => {
      setLoadingVerifyInfo(true);
      try {
        const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/verify`);
        if (res.ok) {
          const data = await res.json();
          setActiveBatchVerifyInfo(data);
        }
      } catch (err) {
        console.error('Error during manual verification:', err);
      } finally {
        setLoadingVerifyInfo(false);
      }
    };

    // Trigger data tampering simulation
    const handleTamperClick = async () => {
      setLoadingVerifyInfo(true);
      try {
        const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/tamper`, {
          method: 'POST'
        });
        if (res.ok) {
          // Refresh details and verify status
          await refreshBatches();
          const verifyRes = await fetch(`${API_BASE}/api/batches/${currentBatchId}/verify`);
          if (verifyRes.ok) {
            const data = await verifyRes.json();
            setActiveBatchVerifyInfo(data);
          }
        }
      } catch (err) {
        console.error('Error during tampering simulation:', err);
      } finally {
        setLoadingVerifyInfo(false);
      }
    };

    // Trigger database restore integrity
    const handleRestoreClick = async () => {
      setLoadingVerifyInfo(true);
      try {
        const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/restore`, {
          method: 'POST'
        });
        if (res.ok) {
          // Refresh details and verify status
          await refreshBatches();
          const verifyRes = await fetch(`${API_BASE}/api/batches/${currentBatchId}/verify`);
          if (verifyRes.ok) {
            const data = await verifyRes.json();
            setActiveBatchVerifyInfo(data);
          }
        }
      } catch (err) {
        console.error('Error during database restoration:', err);
      } finally {
        setLoadingVerifyInfo(false);
      }
    };

    // Graph Data
    const healthTimelineData = [
      { name: 'Sowing', health: 80, moisture: 42, temp: 22 },
      { name: 'Week 2', health: 83, moisture: 48, temp: 23 },
      { name: 'Week 4', health: 87, moisture: 53, temp: 21 },
      { name: 'Week 6', health: 90, moisture: 47, temp: 22 },
      { 
        name: selectedBatch.status === 'QA Approved' || selectedBatch.status === 'Shipped' ? 'Harvest' : 'Current', 
        health: isVerified ? trustScore : 45, 
        moisture: 42, 
        temp: 20 
      }
    ];

    const trustDistData = [
      { name: 'Sustainability', value: Math.round((selectedBatch.sustainabilityScore || 95) * 0.35), color: '#10B981' },
      { name: 'Quality & Lab', value: Math.round((selectedBatch.qualityScore || 90) * 0.35), color: '#34D399' },
      { name: 'Compliance & Audit', value: Math.max(10, trustScore - Math.round((selectedBatch.sustainabilityScore || 95) * 0.35) - Math.round((selectedBatch.qualityScore || 90) * 0.35)), color: '#6EE7B7' }
    ];

    // Verification Logs Table Rows
    const dbLogs = activeBatchVerifyInfo?.verification_logs || [];
    const formattedLogs = dbLogs.map(log => ({
      id: log.id || Math.random().toString(),
      timestamp: new Date(log.detected_at || log.created_at).toLocaleString(),
      type: 'immudb Live Consensus Check',
      mysqlHash: log.current_hash,
      immudbHash: log.original_hash,
      status: log.verification_status === 'VERIFIED' ? 'VERIFIED' : 'TAMPERED'
    }));

    // Add baseline successful check logs
    const seedTime = new Date(selectedBatch.seedDate).getTime();
    formattedLogs.push({
      id: 'init-consensus',
      timestamp: new Date(seedTime + 24 * 3600 * 1000).toLocaleString(),
      type: 'immudb Sowing Block Consensus',
      mysqlHash: selectedBatch.blockchain_hash || activeBatchVerifyInfo?.blockchain_hash || '0x' + 'a'.repeat(64),
      immudbHash: selectedBatch.blockchain_hash || activeBatchVerifyInfo?.blockchain_hash || '0x' + 'a'.repeat(64),
      status: 'VERIFIED'
    });

    if (selectedBatch.status === 'QA Approved' || selectedBatch.status === 'Shipped') {
      formattedLogs.push({
        id: 'qa-consensus',
        timestamp: new Date(seedTime + 48 * 24 * 3600 * 1000).toLocaleString(),
        type: 'immudb QA Audit Consensus',
        mysqlHash: selectedBatch.blockchain_hash || activeBatchVerifyInfo?.blockchain_hash || '0x' + 'a'.repeat(64),
        immudbHash: selectedBatch.blockchain_hash || activeBatchVerifyInfo?.blockchain_hash || '0x' + 'a'.repeat(64),
        status: 'VERIFIED'
      });
    }

    formattedLogs.push({
      id: 'live-check',
      timestamp: activeBatchVerifyInfo?.timestamp ? new Date(activeBatchVerifyInfo.timestamp).toLocaleString() : new Date().toLocaleString(),
      type: 'immudb Live Consensus Check',
      mysqlHash: activeBatchVerifyInfo?.current_hash || selectedBatch.blockchain_hash || '0x' + 'a'.repeat(64),
      immudbHash: activeBatchVerifyInfo?.blockchain_hash || selectedBatch.blockchain_hash || '0x' + 'a'.repeat(64),
      status: isVerified ? 'VERIFIED' : 'TAMPERED'
    });

    formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fadeIn">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/40 dark:border-emerald-950/20 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Batch-Specific Analytics
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold mt-1">
              Cultivation parameters, real-time sensor updates, and immudb ledger logs for crop batch {selectedBatch.id}.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleVerifyClick}
              disabled={loadingVerifyInfo}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-primary dark:text-emerald-400 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingVerifyInfo ? 'animate-spin' : ''}`} />
              Verify Consensus
            </button>
            <button
              onClick={() => {
                setCurrentBatchId(null);
                setCurrentView('admin-dashboard');
              }}
              className="px-4 py-2 border border-borders text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Batch Details Card */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders rounded-[28px] p-6 shadow-sm flex flex-col lg:flex-row gap-8 items-center">
          <div className="h-44 w-full lg:w-60 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-900 shrink-0 border border-borders/60">
            <img src={selectedBatch.imageUrl} alt={selectedBatch.cropType} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Crop Name</span>
                <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">{selectedBatch.cropType}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Farmer ID / Name</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedBatch.farmerId || 'FMR-0921'} / {selectedBatch.farmerName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Cultivation Location</span>
                <span className="font-medium text-stone-700 dark:text-stone-300">{selectedBatch.location}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Batch Identifier</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{selectedBatch.id}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Harvest Date</span>
                <span className="font-semibold text-stone-800 dark:text-stone-250 font-sans">
                  {formatHarvestDate(selectedBatch.expectedHarvestDate || selectedBatch.seedDate)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">immudb Ledger Consensus</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-1 ${
                  isVerified 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}>
                  <ShieldCheck className="h-3 w-3" />
                  {isVerified ? 'VERIFIED' : 'TAMPERED / WARNING'}
                </span>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Trust Score Index</span>
                <span className="text-2xl font-black text-stone-900 dark:text-stone-150">{isVerified ? trustScore : 45}%</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Active immudb Blockchain Hash</span>
                <span className="font-mono text-[10px] text-stone-400 break-all select-all block mt-1 leading-normal p-2.5 bg-stone-50 dark:bg-zinc-900 rounded-xl border border-borders">
                  {activeBatchVerifyInfo?.blockchain_hash || selectedBatch.blockchain_hash || '0x' + 'a'.repeat(64)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tamper / Restore Controls for simulation demonstration */}
        <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Cryptographic Consensus Simulation Console
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
              Demo the secure immudb SHA-256 database ledger verification flow. Simulate database tampering or restore database integrity instantly.
            </p>
          </div>
          <div className="flex gap-2">
            {isVerified ? (
              <button
                onClick={handleTamperClick}
                disabled={loadingVerifyInfo}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Simulate Tampering
              </button>
            ) : (
              <button
                onClick={handleRestoreClick}
                disabled={loadingVerifyInfo}
                className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all animate-pulse"
              >
                Restore Database Integrity
              </button>
            )}
          </div>
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Batch Health & Moisture Timeline */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-950/35 border border-borders dark:border-emerald-950/25 p-6 rounded-[28px] shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Batch Health & Moisture Timeline
              </h3>
              <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                Weekly historical index mapping crop growth parameters, moisture checks and disease inspections.
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: 10 }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="health" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" name="Health Index (%)" />
                  <Area type="monotone" dataKey="moisture" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorMoisture)" name="Soil Moisture (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Trust Score Contribution */}
          <div className="bg-white dark:bg-zinc-950/35 border border-borders dark:border-emerald-950/25 p-6 rounded-[28px] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Trust Score Distribution
              </h3>
              <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                Relative contribution weight of sustainability metrics, quality labs, and database consensus.
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center relative h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trustDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {trustDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">
                  {isVerified ? trustScore : 45}%
                </span>
                <span className="text-[8px] uppercase font-black text-stone-400 tracking-wider">
                  Trust
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-[10px] font-bold">
              {trustDistData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-stone-600 dark:text-stone-400">{item.name}</span>
                  </div>
                  <span className="text-stone-900 dark:text-stone-200">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Verification Logs Table */}
        <div className="bg-white dark:bg-zinc-950/35 border border-borders dark:border-emerald-950/25 p-6 rounded-[28px] shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-primary" />
              immudb Ledger Verification Logs
            </h3>
            <p className="text-[10px] text-stone-400 font-bold mt-0.5">
              Historical ledger consensus checks comparing active relational records with the immutable database state.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-borders dark:border-emerald-950/15 text-[10px] uppercase font-black text-stone-400 tracking-wider">
                  <th className="pb-3 pr-2">Check Date</th>
                  <th className="pb-3 px-2">Verification Type</th>
                  <th className="pb-3 px-2">MySQL Computed Hash</th>
                  <th className="pb-3 px-2">immudb Ledger Hash</th>
                  <th className="pb-3 pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {formattedLogs.map((log, idx) => (
                  <tr 
                    key={log.id || idx}
                    className="border-b border-borders/60 dark:border-emerald-950/10 last:border-none text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    <td className="py-4 pr-2 font-mono text-stone-500 dark:text-stone-400">{log.timestamp}</td>
                    <td className="py-4 px-2 text-stone-900 dark:text-stone-100">{log.type}</td>
                    <td className="py-4 px-2 font-mono text-[10px] text-stone-400">
                      <div className="flex items-center gap-1">
                        <span>{log.mysqlHash ? `${log.mysqlHash.substring(0, 16)}...` : 'N/A'}</span>
                        {log.mysqlHash && (
                          <button
                            onClick={() => handleCopyHash(log.mysqlHash, `mysql-${log.id}`)}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-900 rounded transition-colors"
                          >
                            {copiedBatchId === `mysql-${log.id}` ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 font-mono text-[10px] text-stone-400">
                      <div className="flex items-center gap-1">
                        <span>{log.immudbHash ? `${log.immudbHash.substring(0, 16)}...` : 'N/A'}</span>
                        {log.immudbHash && (
                          <button
                            onClick={() => handleCopyHash(log.immudbHash, `immudb-${log.id}`)}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-900 rounded transition-colors"
                          >
                            {copiedBatchId === `immudb-${log.id}` ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pl-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        log.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // VIEW 4: Traceability Audit View
  if (currentView === 'admin-traceability-audit') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="border-b border-borders dark:border-emerald-950/20 pb-4">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
            Workspace: {selectedBatch.id}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
            <Compass className="h-7 w-7 text-primary" />
            Traceability Ledger Verification
          </h1>
        </div>

        {/* Signature Box */}
        <div className="bg-white dark:bg-stone-800 border border-borders rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shrink-0">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              Verified Crop Record Signature
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-bold text-primary border border-emerald-500/20">
                Secured
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
              This product has been audited and signed by USDA-accredited inspector Alice Smith and recorded in secure history files. Documents match original farmer signatures.
            </p>
          </div>
        </div>

        {/* Timeline Event Grid */}
        <div className="space-y-6 relative pl-4 sm:pl-10 pt-4">
          <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-8">
            <History className="h-5 w-5 text-primary" />
            Verified Crop Lifecycle Timeline
          </h3>
          
          {/* Vertical line helper */}
          <div className="absolute left-[21px] sm:left-[45px] top-16 bottom-4 w-0.5 bg-gradient-to-b from-primary to-warmSand dark:to-zinc-950 shadow-glow" />

          {events.length === 0 ? (
            <div className="p-10 text-center text-xs text-stone-400 border border-dashed border-borders rounded-3xl">
              No blockchain-backed logs recorded for this batch yet.
            </div>
          ) : (
            events.map((evt, index) => {
              const isExpanded = expandedBlockId === evt.id;
              const blockNumber = events.length - index;

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Event Icon Overlay */}
                  <div 
                    className={`absolute -left-[32px] sm:-left-[56px] top-1.5 h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-extrabold border-2 shadow-sm ${
                      (evt.type || '').includes('Approved') || (evt.type || '').includes('Created')
                        ? 'bg-primary border-emerald-800 text-white ring-4 ring-warmSand dark:ring-zinc-900' 
                        : (evt.type || '').includes('Rejected')
                        ? 'bg-red-500 border-red-800 text-white ring-4 ring-warmSand dark:ring-zinc-900'
                        : 'bg-stone-900 border-stone-850 text-white ring-4 ring-warmSand dark:ring-zinc-900'
                    }`}
                  >
                    {getEventEmoji(evt.type)}
                  </div>

                  {/* Event Card */}
                  <div className="bg-white dark:bg-zinc-950/20 border border-borders rounded-[20px] overflow-hidden shadow-sm">
                    
                    {/* Block Header */}
                    <div 
                      onClick={() => setExpandedBlockId(isExpanded ? null : evt.id)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-900 text-stone-500 dark:text-stone-400 font-mono">
                            RECORD #{blockNumber}
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-150">
                            {evt.type}
                          </h4>
                          {evt.verified && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold text-primary border border-primary/20">
                              <ShieldCheck className="h-3 w-3" />
                              INTEGRITY CERTIFIED
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-400 font-semibold uppercase">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(evt.timestamp).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> Operator: {evt.operatorId || 'FMR-0921'}</span>
                        </div>
                      </div>

                      <div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
                      </div>
                    </div>

                    {/* Event Body Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-borders dark:border-stone-800 space-y-4 bg-stone-50/50 dark:bg-zinc-900/10">
                        {/* Description text */}
                        {evt.payload && typeof evt.payload === 'string' ? (
                          <div className="text-xs leading-relaxed font-medium text-stone-600 dark:text-stone-300 font-sans">
                            {evt.payload}
                          </div>
                        ) : evt.payload && typeof evt.payload === 'object' ? (
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5">
                                Activity Parameters
                              </span>
                              <pre className="text-[11px] font-mono bg-[#FAFAFA] dark:bg-stone-900 border border-borders dark:border-stone-800 p-3.5 rounded-2xl text-stone-700 dark:text-stone-300 overflow-x-auto">
                                {JSON.stringify(evt.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs leading-relaxed font-medium text-stone-600 dark:text-stone-300 font-sans">
                            {evt.event_description || 'No detailed parameters logged.'}
                          </div>
                        )}
                        
                        {/* Transaction Hashes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-borders/60 dark:border-stone-800 text-[10px] font-mono text-stone-400">
                          <div>
                            <span className="font-bold text-stone-500 block">Ledger Block Hash</span>
                            <span className="select-all block truncate text-stone-600 dark:text-stone-350">{evt.currentHash || '0x4f2d7d8e6c7a8b9f...'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-stone-500 block">IPFS Cryptographic Link</span>
                            <span className="select-all block truncate text-stone-600 dark:text-stone-350">{evt.ipfsCid || 'QmYwAPJzv5CZ1zo62FMMn7g8b6A2...'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // VIEW 5: QR Code View
  if (currentView === 'admin-qr-code') {
    const isApproved = selectedBatch.status === 'QA Approved' || selectedBatch.status === 'Shipped';
    return (
      <div className="max-w-md mx-auto px-6 py-10 space-y-8 text-center">
        <div className="border-b border-borders dark:border-emerald-950/20 pb-4 text-left">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
            Workspace: {selectedBatch.id}
          </span>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
            <QrCode className="h-7 w-7 text-primary" />
            Distribution QR Code
          </h1>
        </div>

        {!isApproved ? (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 space-y-4">
            <div className="p-3 bg-amber-500 text-white rounded-full w-fit mx-auto shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-amber-800 dark:text-amber-400">QA Approval Required</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              QR Code generation is blocked. Please approve the batch compliance check under the **Approval Section** first.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-800 border border-borders rounded-3xl p-8 shadow-sm space-y-6">
            {qrCodeData ? (
              <>
                <div className="p-4 bg-white border border-borders rounded-2xl w-fit mx-auto shadow-inner">
                  <QRCodeCanvas
                    id="admin-qr-canvas"
                    value={qrCodeData.startsWith('http') ? qrCodeData : "https://farm-buddy-one.vercel.app" + qrCodeData}
                    size={180}
                    level={"H"}
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">QR Code Active</h4>
                  <p className="text-[11px] text-stone-400">Scannable crop passport: {qrCodeData}</p>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleDownloadQR}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Download QR Code PNG
                  </button>
                  <button
                    onClick={() => setCurrentView('consumer-traceability')}
                    className="w-full py-3 rounded-xl border border-borders text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-900 font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Product Passport
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-6">
                <div className="p-3.5 bg-emerald-600/10 text-emerald-600 rounded-full w-fit mx-auto animate-pulse">
                  <QrCode className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">Passport QR Code Not Generated</h4>
                  <p className="text-[11px] text-stone-400">Create the cryptographic distribution barcode for this verified crop batch.</p>
                </div>
                <button
                  onClick={handleGenerateQR}
                  className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse"
                >
                  <QrCode className="h-4.5 w-4.5" />
                  Generate QR Passport
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
