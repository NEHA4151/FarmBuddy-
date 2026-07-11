import React from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Droplet, 
  Leaf, 
  Activity, 
  BarChart, 
  HelpCircle,
  Percent,
  Calendar
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsView() {
  const { currentBatchId, batches, scheduledActivities, calculateTrustScore } = useFarm();
  const batch = batches.find(b => b.id === currentBatchId);

  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to view its performance analytics.
      </div>
    );
  }

  // Calculate task completion percentage
  const batchSchedules = scheduledActivities.filter(a => a.batchId === currentBatchId);
  const totalTasks = batchSchedules.length;
  const completedTasks = batchSchedules.filter(a => a.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Mock Agronomic Resource Usage Data (Water vs Fertilizer)
  const resourceData = [
    { name: 'Week 1', water: 420, fertilizer: 12 },
    { name: 'Week 2', water: 450, fertilizer: 15 },
    { name: 'Week 3', water: 410, fertilizer: 10 },
    { name: 'Week 4', water: 460, fertilizer: 18 },
  ];

  // Pie chart data for disease detection frequency
  const diseaseData = [
    { name: 'Healthy', value: 85, color: '#10b981' },
    { name: 'Aphids Check', value: 8, color: '#f59e0b' },
    { name: 'Late Blight Risk', value: 7, color: '#ef4444' }
  ];

  // Estimated Yield Prediction
  const predictedYield = batch.cropType.includes('Apples') ? '920 Kg' : batch.cropType.includes('Sweet Potatoes') ? '880 Kg' : '450 Kg';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-borders dark:border-emerald-950/20 pb-4">
        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
          Workspace: {batch.id} • {batch.cropType}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
          <BarChart3 className="h-7 w-7 text-emerald-600" />
          Farm Performance & Analytics
        </h1>
      </div>

      {/* Analytics Cards Grid (4 metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Task Completion % */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Completion Rate</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Percent className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{completionRate}%</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Scheduled tasks done</p>
          </div>
        </div>

        {/* Card 2: Yield Prediction */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Yield Prediction</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Leaf className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{predictedYield}</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Est. harvest output</p>
          </div>
        </div>

        {/* Card 3: Water Usage */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Total Water Usage</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Droplet className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">1740 L</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Liters applied this month</p>
          </div>
        </div>

        {/* Card 4: Sensor Node Efficiency */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Sensor Efficiency</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">99.4%</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Telemetry node uptime</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Consumption Bar Chart (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-1 text-stone-850 dark:text-stone-100">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Resource Allocation Log</h3>
          </div>

          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={resourceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(25, 25, 25, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }} 
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="water" name="Water (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fertilizer" name="Fertilizer (Kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Health & Disease Distribution Pie Chart (Right 1 col) */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-850 dark:text-stone-100">
            <Leaf className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Health Distribution</h3>
          </div>

          <div className="w-full h-[180px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {diseaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(25, 25, 25, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-stone-900 dark:text-stone-100">85%</span>
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Healthy</span>
            </div>
          </div>

          {/* Legend indicators */}
          <div className="flex justify-around text-[10px] font-bold text-stone-600 dark:text-stone-450 px-2 mt-4">
            {diseaseData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
