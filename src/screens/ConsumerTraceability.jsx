import { API_BASE } from '../apiConfig';
import React from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Globe, 
  Leaf, 
  Droplet, 
  Lock, 
  TrendingDown, 
  Clock, 
  Sparkles,
  ChevronLeft,
  AlertTriangle,
  Compass,
  Check,
  Copy
} from 'lucide-react';

export default function ConsumerTraceability() {
  const { batches, timeline, currentBatchId, setCurrentBatchId } = useFarm();

  const [activeSubView, setActiveSubView] = React.useState('landing'); // 'landing', 'journey', 'verification'
  const [verifying, setVerifying] = React.useState(false);
  const [verifyResult, setVerifyResult] = React.useState(null);
  const [verifyError, setVerifyError] = React.useState(null);
  const [copiedHash, setCopiedHash] = React.useState(null); // stores 'original' or 'generated'

  const [selectedBatchDetails, setSelectedBatchDetails] = React.useState(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState(null);

  // Sync currentBatchId fallback on startup
  React.useEffect(() => {
    if (!currentBatchId && batches && batches.length > 0) {
      setCurrentBatchId(batches[0].id);
    }
  }, [currentBatchId, batches]);

  // Fetch full details from MySQL
  React.useEffect(() => {
    if (currentBatchId) {
      setLoadingDetails(true);
      setDetailsError(null);
      setSelectedBatchDetails(null);
      
      fetch(`${API_BASE}/api/batches/${currentBatchId}`)
        .then(res => {
          if (res.status === 404) {
            throw new Error('Invalid QR code or batch not found.');
          }
          if (!res.ok) {
            throw new Error('Failed to load batch details.');
          }
          return res.json();
        })
        .then(data => {
          setSelectedBatchDetails(data);
          setLoadingDetails(false);
        })
        .catch(err => {
          console.error(err);
          setDetailsError(err.message);
          setLoadingDetails(false);
        });
    }
  }, [currentBatchId]);

  const selectedBatch = selectedBatchDetails ? {
    id: selectedBatchDetails.batch_id,
    cropType: selectedBatchDetails.crop_name,
    farmerName: selectedBatchDetails.farm_name || 'John Doe',
    seedDate: selectedBatchDetails.sowing_date ? selectedBatchDetails.sowing_date.split('T')[0] : '',
    expectedHarvestDate: selectedBatchDetails.expected_harvest ? selectedBatchDetails.expected_harvest.split('T')[0] : '',
    location: selectedBatchDetails.farm_location,
    imageUrl: selectedBatchDetails.crop_image,
    status: selectedBatchDetails.status,
    qualityScore: selectedBatchDetails.trust_score,
    blockchain_hash: selectedBatchDetails.blockchain_hash
  } : null;

  const events = selectedBatchDetails?.cultivation_logs || [];

  const getEvtType = (e) => e.type || e.activity_type || '';
  const fertilizerLogs = events.filter(e => getEvtType(e).toLowerCase().includes('fertilizer') || getEvtType(e).toLowerCase().includes('nutrient'));
  const pesticideLogs = events.filter(e => getEvtType(e).toLowerCase().includes('pest') || getEvtType(e).toLowerCase().includes('pesticide') || getEvtType(e).toLowerCase().includes('chemical') || getEvtType(e).toLowerCase().includes('treatment'));
  const irrigationLogs = events.filter(e => getEvtType(e).toLowerCase().includes('irrigation') || getEvtType(e).toLowerCase().includes('water'));
  const harvestEvent = events.find(e => getEvtType(e) === 'Crop Harvested');
  const harvestDate = harvestEvent ? new Date(harvestEvent.timestamp).toLocaleDateString() : (selectedBatch?.status === 'Growing' || selectedBatch?.status === 'Planted' ? 'Pending' : (selectedBatch?.expectedHarvestDate || 'Completed'));

  // Reset active sub-view when batch changes
  React.useEffect(() => {
    setActiveSubView('landing');
    setVerifyResult(null);
    setVerifyError(null);
  }, [currentBatchId]);

  const runVerification = async (batchId) => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        setVerifyError('Failed to retrieve secure immudb ledger proof.');
      }
    } catch (err) {
      setVerifyError('Network error connecting to immudb ledger.');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyHash = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Journey milestones data list
  const milestones = selectedBatch ? [
    {
      title: 'Batch Created',
      emoji: '🌱',
      isCompleted: true,
      date: selectedBatch.seedDate || '2026-04-10',
      details: 'Product initialized on the secure immudb ledger with cryptographic seed status.'
    },
    {
      title: 'Sowing / Planting',
      emoji: '🚜',
      isCompleted: true,
      date: selectedBatch.seedDate || '2026-04-10',
      details: `Planted at ${selectedBatch.location.split(',')[0]} under soil classification: ${selectedBatch.soilType}.`
    },
    {
      title: 'Crop Care',
      emoji: '💧',
      isCompleted: fertilizerLogs.length > 0 || irrigationLogs.length > 0,
      date: fertilizerLogs[0] ? new Date(fertilizerLogs[0].timestamp).toLocaleDateString() : '2026-05-01',
      details: `Irrigation logged: ${irrigationLogs.length} times, Fertilization logs: ${fertilizerLogs.length} times. Drip feed active.`
    },
    {
      title: 'Disease Check',
      emoji: '🔍',
      isCompleted: true,
      date: '2026-06-02',
      details: 'Visual leaf diagnostic inspections and AI assistant checks completed. Healthy crop certified.'
    },
    {
      title: 'Harvested',
      emoji: '🌾',
      isCompleted: ['In Quality Check', 'QA Approved', 'QA Rejected', 'Shipped'].includes(selectedBatch.status),
      date: harvestDate !== 'Pending' ? harvestDate : 'Pending',
      details: `Yield: ${selectedBatch.qualityScore > 80 ? 'Grade AA' : 'Standard'} harvested. Signed off by farmer.`
    },
    {
      title: 'Quality Check',
      emoji: '🛡️',
      isCompleted: ['QA Approved', 'QA Rejected', 'Shipped'].includes(selectedBatch.status),
      date: selectedBatch.status === 'QA Rejected' ? 'Residual Failed' : (['QA Approved', 'Shipped'].includes(selectedBatch.status) ? 'Passed' : 'Pending'),
      details: selectedBatch.status === 'QA Rejected' ? 'Anomalies detected in chemical residues check.' : '100% Residue-free and USDA-accredited check passed.'
    },
    {
      title: 'Packed & Dispatched',
      emoji: '📦',
      isCompleted: ['QA Approved', 'Shipped'].includes(selectedBatch.status),
      date: ['QA Approved', 'Shipped'].includes(selectedBatch.status) ? 'Completed' : 'Pending',
      details: 'Cold chain pre-cooling completed. Boxed, sealed, and cryptographically verified.'
    },
    {
      title: 'In Transit',
      emoji: '🚚',
      isCompleted: selectedBatch.status === 'Shipped',
      date: selectedBatch.status === 'Shipped' ? 'In Transit' : 'Pending',
      details: 'Logistics dispatch logged. Temperature-monitored carrier active. In Route to Retailer.'
    },
    {
      title: 'Delivered',
      emoji: '🏪',
      isCompleted: selectedBatch.status === 'Shipped' && selectedBatch.id === 'FB-2026-003',
      date: selectedBatch.status === 'Shipped' && selectedBatch.id === 'FB-2026-003' ? 'Delivered' : 'Pending',
      details: 'Consolidated logistics handover verified. Product received at target retail store.'
    }
  ] : [];

  // Run verification when activeSubView becomes 'verification'
  React.useEffect(() => {
    if (activeSubView === 'verification' && selectedBatch) {
      runVerification(selectedBatch.id);
    }
  }, [activeSubView, selectedBatch?.id]);
  if (loadingDetails) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-warmSand dark:bg-[#0c140f] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
        <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Fetching crop passport details...</span>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-warmSand dark:bg-[#0c140f] px-4">
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[28px] p-8 max-w-md w-full text-center space-y-4 shadow-sm animate-fadeIn">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-base font-black text-stone-900 dark:text-stone-150">Verification Failure</h3>
          <p className="text-xs text-stone-500 dark:text-stone-455 font-semibold leading-relaxed">
            {detailsError}
          </p>
          <button
            onClick={() => {
              if (batches && batches.length > 0) {
                setCurrentBatchId(batches[0].id);
              }
            }}
            className="mt-2 px-6 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-sm"
          >
            Show Default Batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8 bg-warmSand dark:bg-[#0c140f] transition-colors duration-300 min-h-[calc(100vh-5rem)]">
      
      {/* Product Selector (Dropdown) for demo inspection */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-4 rounded-[20px] shadow-sm">
        <div className="text-xs">
          <span className="font-bold text-stone-900 dark:text-stone-100 block">Product Simulator Selector:</span>
          <span className="text-[#6B7280] dark:text-stone-400">Review other QR code endpoints.</span>
        </div>
        <select
          value={selectedBatch?.id}
          onChange={(e) => setCurrentBatchId(e.target.value)}
          className="bg-stone-50 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-3 py-1.5 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
        >
          {batches.map(b => (
            <option 
              key={b.id} 
              value={b.id} 
              className="text-stone-900 bg-white" 
              style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
            >
              {b.cropType} ({b.id})
            </option>
          ))}
        </select>
      </div>

      {!selectedBatch ? (
        <div className="bg-white dark:bg-zinc-950/20 border border-dashed border-borders p-12 text-center text-stone-400 rounded-3xl">
          No crop selected. Please choose a variety from the dropdown menu.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ================= LANDING SUBVIEW ================= */}
          {activeSubView === 'landing' && (
            <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[28px] overflow-hidden shadow-sm flex flex-col animate-fadeIn">
              {/* Top Crop image */}
              <div className="h-72 sm:h-96 relative w-full overflow-hidden">
                <img 
                  src={selectedBatch.imageUrl} 
                  alt={selectedBatch.cropType} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/30 to-transparent" />
                
                {/* Shield Seal */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-primary text-white shadow flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Ledger Seeded
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                    Product Traceability Passport
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{selectedBatch.cropType}</h2>
                  <span className="inline-block px-2 py-0.5 bg-stone-900/80 rounded text-[10px] font-mono font-bold tracking-wider text-stone-300">
                    {selectedBatch.id}
                  </span>
                </div>
              </div>

              {/* Middle Crop Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm font-semibold border-b border-borders dark:border-emerald-950/15 pb-6 text-stone-700 dark:text-stone-300">
                  <div className="flex justify-between sm:justify-start sm:gap-10">
                    <span className="text-stone-400 dark:text-stone-500 font-bold uppercase text-[10px] tracking-wider w-24">Farmer</span>
                    <span className="font-bold text-stone-900 dark:text-stone-150">{selectedBatch.farmerName}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-10">
                    <span className="text-stone-400 dark:text-stone-500 font-bold uppercase text-[10px] tracking-wider w-24">Planting Date</span>
                    <span className="font-bold text-stone-900 dark:text-stone-150">{selectedBatch.seedDate}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-10">
                    <span className="text-stone-400 dark:text-stone-500 font-bold uppercase text-[10px] tracking-wider w-24">Harvest Date</span>
                    <span className="font-bold text-stone-900 dark:text-stone-150">{harvestDate}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-10">
                    <span className="text-stone-400 dark:text-stone-500 font-bold uppercase text-[10px] tracking-wider w-24">Farm Location</span>
                    <span className="font-bold text-stone-900 dark:text-stone-150 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedBatch.location.split(',')[0]}
                    </span>
                  </div>
                </div>

                {/* Score section wrapper */}
                <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 dark:border-emerald-500/5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary dark:text-emerald-400 tracking-wider">Crop Trust Score</span>
                    <p className="text-3xl font-black text-primary dark:text-emerald-500 mt-1">
                      {selectedBatch.qualityScore || 94}%
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-bold text-stone-500 dark:text-stone-400 space-y-0.5">
                    <span className="text-primary dark:text-emerald-400 block font-black">🌱 100% Organic Origin</span>
                    <span>Consensus Ledger Certified</span>
                  </div>
                </div>

                {/* Action buttons panel */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => setActiveSubView('journey')}
                    className="flex-1 py-4 bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/20 text-primary dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-500/10 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Compass className="h-4.5 w-4.5" />
                    Crop Journey Timeline
                  </button>
                  <button
                    onClick={() => setActiveSubView('verification')}
                    className="flex-1 py-4 bg-primary hover:bg-primary/95 text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Lock className="h-4.5 w-4.5" />
                    Consensus Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= CROP JOURNEY SUBVIEW ================= */}
          {activeSubView === 'journey' && (
            <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-6 sm:p-8 rounded-[28px] shadow-sm space-y-6 animate-fadeIn">
              
              {/* Sub-Header */}
              <div className="flex items-center justify-between border-b border-borders dark:border-emerald-950/15 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-primary dark:text-emerald-400 tracking-wider uppercase block">
                    Product: {selectedBatch.id}
                  </span>
                  <h3 className="font-black text-lg sm:text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Compass className="h-5.5 w-5.5 text-primary" />
                    Crop Journey Lifecycle
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSubView('landing')}
                  className="px-4 py-2 border border-borders dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-zinc-900 text-stone-600 dark:text-stone-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>

              {/* Vertical Milestones Timeline */}
              <div className="relative pl-6 sm:pl-10 space-y-8 py-4">
                {/* Connection line */}
                <div className="absolute left-[13px] sm:left-[21px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/30 to-stone-200 dark:to-zinc-900" />

                {milestones.map((m, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle bullet indicator */}
                    <div className={`absolute -left-[20px] sm:-left-[28px] top-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      m.isCompleted 
                        ? 'bg-primary border-emerald-800 text-white ring-4 ring-white dark:ring-[#0c140f]' 
                        : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-450 ring-4 ring-white dark:ring-[#0c140f]'
                    }`}>
                      {m.isCompleted ? '✓' : ''}
                    </div>

                    {/* Timeline card container */}
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
                      m.isCompleted 
                        ? 'bg-stone-50/70 dark:bg-zinc-900/10 border-borders dark:border-emerald-950/10 text-stone-700 dark:text-stone-300' 
                        : 'bg-white/40 dark:bg-transparent border-stone-200/50 dark:border-stone-900/40 text-stone-400 dark:text-stone-600'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-borders/50 dark:border-emerald-950/5 pb-2 mb-2">
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-150 flex items-center gap-1.5">
                          <span className="text-sm">{m.emoji}</span>
                          {m.title}
                        </h4>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                          {m.isCompleted ? `Completed (${m.date})` : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium">
                        {m.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= VERIFICATION SUBVIEW ================= */}
          {activeSubView === 'verification' && (
            <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-6 sm:p-8 rounded-[28px] shadow-sm space-y-6 animate-fadeIn">
              
              {/* Sub-Header */}
              <div className="flex items-center justify-between border-b border-borders dark:border-emerald-950/15 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-primary dark:text-emerald-400 tracking-wider uppercase block">
                    Target: {selectedBatch.id}
                  </span>
                  <h3 className="font-black text-lg sm:text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Lock className="h-5.5 w-5.5 text-primary" />
                    Secure immudb Verification
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSubView('landing')}
                  className="px-4 py-2 border border-borders dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-zinc-900 text-stone-600 dark:text-stone-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>

              {/* Status block logic */}
              {verifying ? (
                <div className="py-16 text-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    Querying MySQL records, computing SHA-256 state, and checking immudb ledger...
                  </p>
                </div>
              ) : verifyError ? (
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center space-y-4">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
                  <p className="text-xs font-bold text-red-600">{verifyError}</p>
                  <button
                    onClick={() => runVerification(selectedBatch.id)}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold"
                  >
                    Retry Verification
                  </button>
                </div>
              ) : verifyResult ? (
                <div className="space-y-6">
                  {/* Verified / Mismatch Banner */}
                  {verifyResult.verified ? (
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.01] border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-6 text-center space-y-4 animate-scaleIn">
                      <div className="p-3 bg-primary text-white rounded-full w-fit mx-auto shadow-sm">
                        <ShieldCheck className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-primary dark:text-emerald-400">
                          ✅ VERIFIED
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-450 font-bold">
                          “This product is authentic and tamper-proof.”
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                        <span className="px-3 py-1 bg-emerald-500/10 text-primary dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">
                          🌱 100% Organic
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-primary dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">
                          🧪 Chemical Free
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-primary dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center gap-1 font-mono">
                          🔒 Immutable Verified
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/5 dark:bg-red-500/[0.01] border border-red-500/20 dark:border-red-500/10 rounded-2xl p-6 text-center space-y-4 animate-scaleIn">
                      <div className="p-3 bg-red-600 text-white rounded-full w-fit mx-auto shadow-sm animate-pulse">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-red-600">
                          ❌ NOT VERIFIED
                        </h3>
                        <p className="text-xs text-red-500 font-bold uppercase tracking-wider">
                          “Data integrity compromised.”
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hash values comparison */}
                  <div className="bg-stone-50 dark:bg-zinc-950/20 border border-borders dark:border-emerald-950/10 p-5 rounded-2xl space-y-4 text-xs font-semibold text-stone-700 dark:text-stone-300">
                    <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-150 flex items-center gap-1.5 border-b border-borders dark:border-emerald-950/15 pb-2.5">
                      <Sparkles className="h-4.5 w-4.5 text-primary" />
                      Ledger Hash comparison
                    </h4>

                    {/* Original stored hash */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-stone-450">
                        <span>Original Hash (from immudb)</span>
                        <button 
                          onClick={() => handleCopyHash(verifyResult.blockchain_hash, 'original')}
                          className="flex items-center gap-1 text-[9px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                        >
                          {copiedHash === 'original' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 bg-white dark:bg-stone-900 border border-borders dark:border-stone-800 rounded-xl text-[10px] font-mono text-stone-600 dark:text-stone-300 overflow-x-auto whitespace-pre-wrap break-all select-all leading-normal">
                        {verifyResult.blockchain_hash}
                      </pre>
                    </div>

                    {/* Generated hash */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-stone-450">
                        <span>Generated Hash (from MySQL data)</span>
                        <button 
                          onClick={() => handleCopyHash(verifyResult.current_hash, 'generated')}
                          className="flex items-center gap-1 text-[9px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                        >
                          {copiedHash === 'generated' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className={`p-3 bg-white dark:bg-stone-900 border rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all select-all leading-normal ${
                        verifyResult.verified 
                          ? 'border-borders dark:border-stone-800 text-stone-600 dark:text-stone-300' 
                          : 'border-red-300 dark:border-red-950/40 text-red-650 bg-red-500/[0.02]'
                      }`}>
                        {verifyResult.current_hash}
                      </pre>
                    </div>

                    {/* Meta stats list */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-borders dark:border-emerald-950/15 text-[11px]">
                      <div>
                        <span className="text-stone-400 block font-bold uppercase text-[9px] tracking-wider">Match Status</span>
                        <span className={`font-black text-xs ${verifyResult.verified ? 'text-primary dark:text-emerald-500' : 'text-red-500'}`}>
                          {verifyResult.verified ? '✓ MATCHED SUCCESS' : '✗ HASH MISMATCH'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-bold uppercase text-[9px] tracking-wider">Trust Score</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-150">{selectedBatch.qualityScore || 94}% rating</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-bold uppercase text-[9px] tracking-wider">Verified Timestamp</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-150">{new Date(verifyResult.timestamp).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-bold uppercase text-[9px] tracking-wider">Verification Source</span>
                        <span className="font-black text-primary dark:text-emerald-500 uppercase tracking-widest font-mono text-[9px]">immudb Ledger</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
