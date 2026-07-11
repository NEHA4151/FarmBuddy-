import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Layers, 
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function BatchTimeline() {
  const { 
    batches, 
    timeline, 
    currentBatchId, 
    setCurrentBatchId, 
    setCurrentView,
    user
  } = useFarm();

  const [expandedBlockId, setExpandedBlockId] = useState(null);

  const activeBatch = batches.find(b => b.id === currentBatchId) || batches[0];
  const events = timeline[activeBatch?.id] || [];

  const toggleExpandBlock = (blockId) => {
    setExpandedBlockId(expandedBlockId === blockId ? null : blockId);
  };

  const handleBack = () => {
    if (user?.role === 'farmer') {
      setCurrentView('farmer-dashboard');
    } else if (user?.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('consumer-traceability');
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Back & Batch Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-850 text-xs font-bold transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Dropdown selector for active batch */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-stone-400 dark:text-emerald-400 uppercase">Crop Batch:</label>
          <select
            value={currentBatchId}
            onChange={(e) => setCurrentBatchId(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-3 py-1.5 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
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
      </div>

      {/* Batch Profile Header */}
      {activeBatch && (
        <div className="bg-white border border-borders p-6 rounded-[20px] mb-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="h-28 w-28 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
            <img src={activeBatch.imageUrl} alt={activeBatch.cropType} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-2.5 text-center md:text-left">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
                {activeBatch.status}
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-2">
                {activeBatch.cropType}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {activeBatch.location}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Planted {activeBatch.seedDate}</span>
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {activeBatch.soilType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Event Grid */}
      <div className="space-y-8 relative pl-4 sm:pl-10">
        
        {/* Vertical line helper */}
        <div className="absolute left-[21px] sm:left-[45px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary to-warmSand shadow-glow" />

        {events.map((evt, index) => {
          const isExpanded = expandedBlockId === evt.id;
          const blockNumber = index + 1;

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
                  evt.type.includes('Approved') || evt.type.includes('Created')
                    ? 'bg-primary border-emerald-800 text-white ring-4 ring-warmSand dark:ring-zinc-950' 
                    : evt.type.includes('Rejected')
                    ? 'bg-red-500 border-red-800 text-white ring-4 ring-warmSand dark:ring-zinc-950'
                    : 'bg-stone-900 border-stone-850 text-white ring-4 ring-warmSand dark:ring-zinc-950'
                }`}
              >
                {getEventEmoji(evt.type)}
              </div>

              {/* Event Card */}
              <div className="bg-white border border-borders rounded-[20px] overflow-hidden shadow-sm">
                
                {/* Block Header */}
                <div 
                  onClick={() => toggleExpandBlock(evt.id)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-500 font-mono">
                        RECORD #{blockNumber}
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
                        {evt.type}
                      </h4>
                      {evt.verified && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          Record Verified
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-400 font-semibold uppercase">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(evt.timestamp).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Operator: {evt.operatorId}</span>
                    </div>
                  </div>

                  <div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
                  </div>
                </div>

                {/* Event Body Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-borders space-y-4 bg-stone-50">
                    
                    {/* Activity details */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5">
                        Activity Parameters
                      </span>
                      <pre className="text-[11px] font-mono bg-[#FAFAFA] border border-borders p-3.5 rounded-2xl text-stone-700 overflow-x-auto">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    </div>

                    {/* Verification details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-white border border-borders rounded-xl">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">Prior Log Link Key</span>
                        <span className="text-[10px] font-mono text-stone-600 truncate block mt-0.5 select-all">
                          {evt.prevHash}
                        </span>
                      </div>
                      
                      <div className="p-3 bg-white border border-borders rounded-xl">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">Secure Verification Hash</span>
                        <span className="text-[10px] font-mono text-emerald-600 truncate block mt-0.5 select-all">
                          {evt.currentHash}
                        </span>
                      </div>

                      <div className="p-3 bg-white border border-borders rounded-xl">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">Digital Document ID</span>
                        <span className="text-[10px] font-mono text-amber-600 truncate block mt-0.5 select-all flex items-center justify-between">
                          {evt.ipfsCid.substring(0, 16)}...
                          <ExternalLink className="h-3 w-3 text-stone-400 cursor-pointer" onClick={() => alert(`Redirecting to document store gateway`)} />
                        </span>
                      </div>
                    </div>

                    {/* Consensus Status Check */}
                    <div className="flex items-center gap-1.5 p-3.5 bg-primary/5 border border-primary/10 rounded-2xl text-[10px] text-primary font-semibold leading-relaxed">
                      <Lock className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        This record has been signed and secured with operator key <span className="font-mono bg-primary/10 px-1 rounded">{evt.operatorId}</span>. The linkage integrity hash check has been fully verified.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Pulse placeholder for mining next block */}
        {activeBatch?.status !== 'Shipped' && activeBatch?.status !== 'QA Rejected' && (
          <div className="relative">
            <div className="absolute -left-[20px] sm:-left-[44px] top-1 h-8 w-8 rounded-xl border border-dashed border-primary/60 bg-primary/5 flex items-center justify-center animate-pulse">
              <span className="h-2 w-2 bg-primary rounded-full" />
            </div>
            <div className="py-2.5 pl-4 flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest animate-pulse">
                Awaiting Next Log Entry...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
