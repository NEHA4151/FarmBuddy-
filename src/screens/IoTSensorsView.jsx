import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Droplet, 
  Thermometer, 
  Wind, 
  Activity, 
  AlertTriangle,
  Lightbulb,
  Scale,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function IoTSensorsView() {
  const { currentBatchId, batches, telemetry, logBatchEvent } = useFarm();
  const batch = batches.find(b => b.id === currentBatchId);

  // Keep a local running log of sensor readings for the line chart (10 readings max)
  const [sensorHistory, setSensorHistory] = useState([]);
  const [ignoredAlerts, setIgnoredAlerts] = useState([]);

  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSensorHistory(prev => {
      const next = [...prev, {
        time: timeStr,
        moisture: telemetry.soilMoisture,
        temp: telemetry.temperature,
        ph: telemetry.phLevel,
        humidity: telemetry.humidity
      }];
      if (next.length > 10) return next.slice(1);
      return next;
    });
  }, [telemetry]);

  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to monitor its sensors.
      </div>
    );
  }

  // Set limits and warnings
  const alerts = [];
  if (telemetry.soilMoisture < 35) {
    alerts.push({
      sensor: 'Soil Moisture',
      val: `${telemetry.soilMoisture}%`,
      desc: 'Critical low soil moisture. Irrigation suggested immediately.'
    });
  }
  if (telemetry.temperature > 30) {
    alerts.push({
      sensor: 'Ambient Temperature',
      val: `${telemetry.temperature}°C`,
      desc: 'High greenhouse heat. Activate cooling fans.'
    });
  }

  const handleIgnoreAlert = (sensorName) => {
    setIgnoredAlerts(prev => [...prev, sensorName]);
    if (logBatchEvent) {
      logBatchEvent(
        'Sensor Alert Ignored',
        `${sensorName} Alert Ignored`,
        `Farmer chose to ignore the active ${sensorName} alert. Current reading: ${sensorName === 'Soil Moisture' ? telemetry.soilMoisture + '%' : telemetry.temperature + '°C'}`,
        'Warning',
        -1.0
      );
    }
  };

  const activeAlerts = alerts.filter(al => !ignoredAlerts.includes(al.sensor));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-borders dark:border-emerald-950/20 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
            Workspace: {batch.id} • {batch.cropType}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
            <Cpu className="h-7 w-7 text-emerald-600" />
            Live IoT Sensor Monitor
          </h1>
        </div>

        {/* Live Status indicator */}
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          IoT Nodes Online
        </span>
      </div>

      {/* Threshold Alerts */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/5 border border-amber-500/25 rounded-[22px] p-5 space-y-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5.5 w-5.5" />
              <h3 className="text-xs font-black uppercase tracking-wider">Active Threshold Alerts</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeAlerts.map((al, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-950/20 p-3 rounded-xl border border-amber-500/15 text-xs flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-center font-bold text-stone-850 dark:text-stone-100">
                      <span>{al.sensor}</span>
                      <span className="text-red-500 font-extrabold">{al.val}</span>
                    </div>
                    <p className="text-[10px] text-stone-450 dark:text-stone-500 font-semibold mt-1 leading-normal">{al.desc}</p>
                  </div>
                  <button
                    onClick={() => handleIgnoreAlert(al.sensor)}
                    className="ml-3 px-2 py-1 text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold rounded-lg transition-all whitespace-nowrap self-center"
                  >
                    Ignore
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sensor Grid (6 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Soil Moisture */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Soil Moisture</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Droplet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{telemetry.soilMoisture}%</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Target range: 40% - 60%</p>
          </div>
        </div>

        {/* Card 2: Temperature */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Temperature</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Thermometer className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{telemetry.temperature}°C</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Target range: 18°C - 28°C</p>
          </div>
        </div>

        {/* Card 3: Humidity */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Humidity</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Wind className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{telemetry.humidity}%</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Target range: 50% - 75%</p>
          </div>
        </div>

        {/* Card 4: Soil pH */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Soil pH</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Scale className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{telemetry.phLevel}</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Target range: 6.0 - 7.0</p>
          </div>
        </div>

        {/* Card 5: Water Level */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Reservoir Water Level</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Droplet className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">82.4%</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Minimum safety: 20%</p>
          </div>
        </div>

        {/* Card 6: Light Intensity */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-emerald-400 tracking-wider">Light Intensity</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Lightbulb className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">4200 Lux</span>
            <p className="text-[9px] text-stone-400 font-bold mt-1">Daytime target: &gt; 3000 Lux</p>
          </div>
        </div>
      </div>

      {/* Real-time telemetry chart */}
      <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-1 text-stone-850 dark:text-stone-100">
          <LineChartIcon className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Real-Time Soil Moisture Log</h3>
        </div>

        <div className="w-full h-[220px]">
          {sensorHistory.length === 0 ? (
            <p className="text-xs text-stone-400 italic">Waiting for sensor stream...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="time" stroke="#a3a3a3" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis domain={[30, 60]} stroke="#a3a3a3" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(25, 25, 25, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="moisture" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorMoisture)"
                  strokeWidth={2.5} 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
