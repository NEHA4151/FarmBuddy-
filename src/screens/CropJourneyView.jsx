import React from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Sprout, 
  Flower, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Activity,
  ArrowRight
} from 'lucide-react';

const STAGES = [
  { name: 'Seed', description: 'Planting and initial soil anchoring.' },
  { name: 'Germination', description: 'First cotyledon leaf breaking soil surface.' },
  { name: 'Vegetative Growth', description: 'Rapid leaf development and root system extension.' },
  { name: 'Flowering', description: 'Blossom generation and pollination window.' },
  { name: 'Fruiting', description: 'Fruit set and ripening stage.' },
  { name: 'Harvest', description: 'Crop ready for yield collection and QA inspection.' }
];

export default function CropJourneyView() {
  const { currentBatchId, batches } = useFarm();
  const batch = batches.find(b => b.id === currentBatchId);

  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to view its journey.
      </div>
    );
  }

  // Determine current stage based on batch status/type
  const getStageIndex = (status) => {
    switch (status) {
      case 'Planted': return 0;
      case 'Growing': return 2;
      case 'In Quality Check': return 4;
      case 'QA Approved': return 5;
      case 'Shipped': return 5;
      default: return 1;
    }
  };

  const currentStageIdx = getStageIndex(batch.status);
  const progressPercent = Math.min(100, Math.round(((currentStageIdx + 1) / STAGES.length) * 100));

  // Calculate days remaining to next stage (or harvest)
  const today = new Date('2026-06-25');
  const harvestDate = new Date(batch.expectedHarvestDate || '2026-09-15');
  const diffTime = Math.abs(harvestDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-borders dark:border-emerald-950/20 pb-4">
        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
          Workspace: {batch.id} • {batch.cropType}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
          <Compass className="h-7 w-7 text-emerald-600" />
          Crop Lifecycle Journey
        </h1>
      </div>

      {/* Main Info Card */}
      <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={batch.imageUrl}
            alt={batch.cropType}
            className="w-20 h-20 rounded-2xl object-cover border border-borders/60 dark:border-emerald-950/20"
          />
          <div className="space-y-1">
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">{batch.cropType}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-bold">
              <span className="flex items-center gap-0.5">
                <MapPin className="h-4 w-4 text-stone-400" />
                {batch.location}
              </span>
              <span className="flex items-center gap-0.5">
                <Calendar className="h-4 w-4 text-stone-400" />
                Planted on {batch.seedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50/50 dark:bg-zinc-900/30 border border-borders/40 dark:border-emerald-950/20 p-4 rounded-2xl text-center md:text-right space-y-1 self-start md:self-auto min-w-[200px]">
          <span className="text-[9px] font-black text-stone-400 dark:text-emerald-400 uppercase tracking-widest block">Est. Time to Harvest</span>
          <p className="text-2xl font-black text-stone-850 dark:text-stone-100">
            {diffDays > 0 ? `${diffDays} Days` : 'Ready for Harvest'}
          </p>
          <span className="text-[10px] text-stone-400 font-bold">Target: {batch.expectedHarvestDate || '2026-09-15'}</span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 sm:p-8 shadow-sm space-y-8">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700 dark:text-stone-300">
            <span>Overall Growth Progress</span>
            <span className="text-primary dark:text-emerald-400">{progressPercent}% Completed</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-3 bg-stone-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-borders/40 dark:border-emerald-950/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-600 to-green-400"
            />
          </div>
        </div>

        {/* Lifecycle Stages Linear Path */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isActive = idx === currentStageIdx;
            
            let statusColor = 'border-borders dark:border-emerald-950/30 bg-white dark:bg-zinc-900 text-stone-400';
            if (isCompleted) statusColor = 'border-primary bg-primary/5 text-primary dark:text-emerald-400 dark:border-emerald-500';
            else if (isActive) statusColor = 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 animate-pulse';

            return (
              <div key={stage.name} className="flex md:flex-col items-start gap-4 md:gap-3 text-left md:text-center relative">
                {/* Visual node */}
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 mx-auto transition-all ${statusColor}`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                </div>

                {/* Connecting arrow in desktop */}
                {idx < STAGES.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-borders dark:bg-emerald-950/20 z-0">
                    <div className={`h-full ${isCompleted ? 'bg-primary dark:bg-emerald-500' : 'bg-transparent'}`} />
                  </div>
                )}

                {/* Stage Info */}
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-emerald-600 dark:text-emerald-400' : isCompleted ? 'text-stone-800 dark:text-stone-200 font-bold' : 'text-stone-400 font-bold'}`}>
                    {stage.name}
                  </h4>
                  <p className="text-[10px] text-stone-450 dark:text-stone-500 font-semibold leading-relaxed leading-none">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
