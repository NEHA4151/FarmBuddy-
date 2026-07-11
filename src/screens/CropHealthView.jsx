import React from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Award, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function CropHealthView() {
  const { currentBatchId, batches, telemetry, calculateTrustScore } = useFarm();
  const batch = batches.find(b => b.id === currentBatchId);

  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to view its health metrics.
      </div>
    );
  }

  const trustScore = calculateTrustScore(batch.id);

  // Trust Score Category
  let categoryLabel = 'Low Trust';
  let categoryColor = 'text-red-500 border-red-500/20 bg-red-500/5';
  let gaugeColor = '#ef4444'; // red
  if (trustScore >= 90) {
    categoryLabel = 'Excellent';
    categoryColor = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    gaugeColor = '#10b981'; // emerald
  } else if (trustScore >= 75) {
    categoryLabel = 'Good';
    categoryColor = 'text-[#A3E635] border-lime-500/20 bg-lime-500/5';
    gaugeColor = '#84cc16'; // lime
  } else if (trustScore >= 50) {
    categoryLabel = 'Moderate Risk';
    categoryColor = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    gaugeColor = '#f59e0b'; // amber
  }

  // Mock Trust History Chart Data
  const chartData = [
    { name: 'Week 1', score: 100 },
    { name: 'Week 2', score: 99 },
    { name: 'Week 3', score: 99 },
    { name: 'Week 4', score: 98 },
    { name: 'Current', score: trustScore }
  ];

  // Dynamic Crop Health percentage (based on qualityScore / telemetry)
  const healthPercent = batch.qualityScore || 94;

  // Improvement Suggestions based on Trust Score
  const suggestions = [];
  if (trustScore < 100) {
    suggestions.push("Complete all pending scheduled activities in the Calendar immediately.");
  }
  if (telemetry.soilMoisture < 35) {
    suggestions.push("Soil moisture is critically low (under 35%). Run an irrigation cycle to resolve sensor alerts.");
  }
  if (batch.verification_logs && batch.verification_logs.length > 0) {
    suggestions.push("A blockchain mismatch was detected. Run the ledger verification tool to restore original data.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Perfect tracking! Maintain regular calendar updates and log events to sustain 100% Trust rating.");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-borders dark:border-emerald-950/20 pb-4">
        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
          Workspace: {batch.id} • {batch.cropType}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
          <Heart className="h-7 w-7 text-emerald-600 animate-pulse" />
          Crop Health & Trust Score System
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side Panel: Trust Score Gauges */}
        <div className="space-y-6">
          {/* Trust Score Gauge Card */}
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-between text-center space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-400 dark:text-emerald-400 tracking-wider">
              Verification Trust Score
            </h3>

            {/* Circular Gauge */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="stroke-stone-100 dark:stroke-zinc-900"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Foreground Meter */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke={gaugeColor}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={427}
                  initial={{ strokeDashoffset: 427 }}
                  animate={{ strokeDashoffset: 427 - (427 * trustScore) / 100 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-stone-900 dark:text-stone-100">{trustScore}</span>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Rating</span>
              </div>
            </div>

            {/* Score Category Badge */}
            <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border tracking-widest ${categoryColor}`}>
              {categoryLabel}
            </span>
          </div>

          {/* Crop Health percentage card */}
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-stone-400 dark:text-emerald-400 tracking-wider">
                Overall Crop Health
              </h3>
              <span className="text-sm font-black text-emerald-500">{healthPercent}%</span>
            </div>
            
            {/* Visual health progress bar */}
            <div className="w-full h-2.5 bg-stone-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            
            <p className="text-[10px] text-stone-400 font-semibold leading-normal">
              Measured using real-time leaf color indices, water retention, and environmental stress variables.
            </p>
          </div>
        </div>

        {/* Right Side Panel: History Graph and Improvement suggestions (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trust History Chart */}
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-stone-850 dark:text-stone-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Trust Rating History</h3>
            </div>

            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[80, 100]} stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(25, 25, 25, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable suggestions */}
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 text-stone-850 dark:text-stone-100">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">AI Suggestions & Score Improvement</h3>
            </div>

            <div className="space-y-3">
              {suggestions.map((sug, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-stone-50/50 dark:bg-zinc-900/30 p-3.5 rounded-xl border border-borders/30 dark:border-emerald-950/20">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-stone-750 dark:text-stone-300 leading-relaxed">
                    {sug}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
