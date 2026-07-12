import { API_BASE } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Activity, 
  Layers, 
  Code, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Cpu, 
  Trash2,
  Download,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LogEventView() {
  const { 
    currentBatchId, 
    batches, 
    timeline, 
    addEvent, 
    telemetry, 
    reports, 
    refreshReports, 
    addNotification 
  } = useFarm();

  const batch = batches.find(b => b.id === currentBatchId);

  // Tabs for main view: 'timeline', 'add-log', 'reports'
  const [activeSubTab, setActiveSubTab] = useState('timeline');

  // Form Tab State: 'visual' or 'json'
  const [formTab, setFormTab] = useState('visual');
  const [eventType, setEventType] = useState('Irrigation Logged');
  const [visualData, setVisualData] = useState({
    waterSource: 'Main Irrigation Well',
    waterVolume: '450',
    fertilizerBrand: 'Organic BioGrow',
    fertilizerWeight: '15',
    fertilizerMethod: 'Soil Drenching',
    pestCompound: 'Organic Neem Oil',
    pestRatio: '1:100',
    pestTarget: 'Spider Mites',
    harvestWeight: '800',
    harvestLocation: 'Silo A',
    harvestGrade: 'Grade AA Specialty',
    shipProvider: 'Green Dispatch Logi',
    shipDestination: 'Whole Foods Depot, CA',
    shipTemp: '12.4'
  });
  const [jsonText, setJsonText] = useState('');
  const [isImportedIoT, setIsImportedIoT] = useState(false);

  // Report Section State
  const [loadingReports, setLoadingReports] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [aiReportResult, setAiReportResult] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [batchEvents, setBatchEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = async () => {
    if (!currentBatchId) return;
    setLoadingEvents(true);
    try {
      const res = await fetch(`${API_BASE}/api/batches/${currentBatchId}/batch-events`);
      if (res.ok) {
        const data = await res.json();
        setBatchEvents(data);
      }
    } catch (err) {
      console.error("Error fetching batch events:", err);
    }
    setLoadingEvents(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [currentBatchId]);

  useEffect(() => {
    if (batch) {
      updateJsonFromVisual();
    }
  }, [eventType, visualData, isImportedIoT]);

  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to view its event logs.
      </div>
    );
  }

  const updateJsonFromVisual = () => {
    let payload = {};
    if (eventType === 'Irrigation Logged') {
      payload = {
        source: visualData.waterSource,
        volumeLitres: visualData.waterVolume,
        soilMoisturePost: `${telemetry.soilMoisture}%`
      };
    } else if (eventType === 'Fertilizer Application') {
      payload = {
        brand: visualData.fertilizerBrand,
        quantityKg: visualData.fertilizerWeight,
        method: visualData.fertilizerMethod
      };
    } else if (eventType === 'Pesticide Treatment') {
      payload = {
        compound: visualData.pestCompound,
        dilutionRatio: visualData.pestRatio,
        targetPest: visualData.pestTarget
      };
    } else if (eventType === 'Crop Harvested') {
      payload = {
        yieldWeightKg: visualData.harvestWeight,
        storageLocation: visualData.harvestLocation,
        grade: visualData.harvestGrade
      };
    } else if (eventType === 'Shipped') {
      payload = {
        logisticsProvider: visualData.shipProvider,
        destination: visualData.shipDestination,
        temperatureCelsius: `${visualData.shipTemp}°C`
      };
    } else {
      payload = { note: "General operation log." };
    }

    if (isImportedIoT) {
      payload.iotTelemetry = {
        soilMoisture: `${telemetry.soilMoisture}%`,
        temperature: `${telemetry.temperature}°C`,
        phLevel: telemetry.phLevel,
        humidity: `${telemetry.humidity}%`
      };
    }

    setJsonText(JSON.stringify(payload, null, 2));
  };

  const handleVisualChange = (field, value) => {
    setVisualData(prev => ({ ...prev, [field]: value }));
  };

  const handleImportIoT = () => {
    setIsImportedIoT(true);
    addNotification("IoT Data Imported", "Live sensor values appended to the activity payload.", "success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalDescription = '';

    if (formTab === 'visual') {
      finalDescription = jsonText;
    } else {
      try {
        JSON.parse(jsonText);
        finalDescription = jsonText;
      } catch (err) {
        alert("Invalid JSON format. Please verify and correct.");
        return;
      }
    }

    await addEvent(currentBatchId, eventType, finalDescription);
    confetti({ particleCount: 60, spread: 50 });
    setActiveSubTab('timeline');
    setIsImportedIoT(false);
    fetchEvents();
  };

  // Upload Reports logic
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Content = e.target.result;
      
      let reportType = 'Document';
      if (file.type.includes('pdf')) reportType = 'PDF';
      else if (file.type.includes('image')) reportType = 'Image';
      else if (file.type.includes('csv') || file.name.endsWith('.csv')) reportType = 'CSV';

      try {
        // Prefix report name with batch ID to partition it
        const prefixedName = `[${currentBatchId}] ${file.name}`;
        
        setLoadingReports(true);
        const res = await fetch(`${API_BASE}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prefixedName,
            type: reportType,
            content: base64Content
          }),
        });

        if (res.ok) {
          addNotification("Report Uploaded", "Compliance report successfully uploaded & linked to this batch.", "success");
          refreshReports();
          fetchEvents();
        } else {
          alert("Failed to upload report.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReports(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addNotification("Report Deleted", "The report has been removed from the registry.", "info");
        refreshReports();
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate AI summary report using gemini-2.5-flash
  const handleGenerateAIReport = async () => {
    setGeneratingAI(true);
    setAiReportResult('');
    
    // Construct events summary string for prompt
    const batchLogs = timeline[currentBatchId] || [];
    const logsSummary = batchLogs.map(l => {
      let desc = l.payload;
      if (typeof desc === 'object') desc = JSON.stringify(desc);
      return `Date: ${l.timestamp.split('T')[0]} | Event: ${l.type} | Details: ${desc}`;
    }).join('\n');

    const promptText = `Here is the operational timeline of crop batch ${currentBatchId} (${batch.cropType}):\n${logsSummary}\n\nAnalyze this data and generate a detailed agronomic report including: 1) Cultivation summary, 2) Event audit verification, 3) Suggestions to maximize yields or soil health. Return your report in markdown formatting.`;

    try {
      const res = await fetch(`${API_BASE}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          query: promptText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiReportResult(data.response);
      } else {
        setAiReportResult("Failed to contact the AI assistant server. Please check your credentials.");
      }
    } catch (err) {
      console.error(err);
      setAiReportResult("Error generating report.");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Filter reports specifically linked to this batch (name prefix matches)
  const batchReports = reports.filter(r => r.name.startsWith(`[${currentBatchId}]`));
  const batchLogs = timeline[currentBatchId] || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header and Toggle Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-borders dark:border-emerald-950/20 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
            Workspace: {batch.id} • {batch.cropType}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
            <Activity className="h-7 w-7 text-emerald-600" />
            Activity Log & Compliance Records
          </h1>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex bg-biscuitHover dark:bg-zinc-950/40 p-1.5 rounded-xl border border-borders/40 dark:border-emerald-950/20 self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'timeline'
                ? 'bg-primary text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Timeline Logs
          </button>
          <button
            onClick={() => setActiveSubTab('add-log')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'add-log'
                ? 'bg-primary text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Log Activity
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'reports'
                ? 'bg-primary text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Compliance Reports
          </button>
        </div>
      </div>

      {activeSubTab === 'timeline' && (
        /* TAB 1: TIMELINE VIEW OF LOGGED EVENTS */
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold text-stone-850 dark:text-stone-200 uppercase tracking-wider">
            Ledger Timeline Logs ({batchEvents.length})
          </h2>
          
          {loadingEvents ? (
            <p className="text-xs text-stone-400 italic py-4">Loading timeline logs...</p>
          ) : batchEvents.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-4">No events logged yet for this batch.</p>
          ) : (
            <div className="relative border-l-2 border-borders/80 dark:border-emerald-950/40 ml-4 pl-6 space-y-8 py-2">
              {batchEvents.map((log) => {
                return (
                  <div key={log.id} className="relative">
                    {/* Circle Node indicator */}
                    <span className={`absolute -left-[31px] top-1.5 h-4 w-4 border-4 border-white dark:border-[#0c140f] rounded-full ${
                      log.event_status === 'Warning' || log.event_status === 'Failed'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`} />
                    
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-stone-850 dark:text-stone-200">
                          {log.event_title}
                        </span>
                        <span className="text-[9px] bg-stone-100 dark:bg-zinc-900 text-stone-400 font-bold px-2 py-0.5 rounded-lg border border-borders/40 dark:border-emerald-950/20">
                          {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          parseFloat(log.trust_score_impact) > 0
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : parseFloat(log.trust_score_impact) < 0
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-stone-100 dark:bg-zinc-900 text-stone-400'
                        }`}>
                          {parseFloat(log.trust_score_impact) > 0 ? `+${parseFloat(log.trust_score_impact)}` : parseFloat(log.trust_score_impact)} Trust
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          log.event_status === 'Failed'
                            ? 'bg-red-550/10 text-red-500'
                            : log.event_status === 'Warning'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {log.event_status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-stone-600 dark:text-stone-400 max-w-2xl font-sans">
                        {log.event_description}
                      </p>
                      <span className="text-[9px] bg-stone-50 dark:bg-zinc-900 text-stone-400 font-bold px-1.5 py-0.5 rounded-md inline-block">
                        Category: {log.event_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'add-log' && (
        /* TAB 2: DUAL TAB MANUAL OPERATION LOGGER FORM */
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-borders/40 dark:border-emerald-950/20 pb-3">
            <h2 className="text-sm font-extrabold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Log Operations Event
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Activity Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  <option value="Irrigation Logged">💧 Irrigation Cycle</option>
                  <option value="Fertilizer Application">🧪 Fertilizer Treatment</option>
                  <option value="Pesticide Treatment">🌿 Pest Control Treatment</option>
                  <option value="Crop Harvested">🌾 Crop Harvesting</option>
                  <option value="Shipped">🚚 Logistics Dispatch</option>
                </select>
              </div>

              {/* Import IoT Sensor */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleImportIoT}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all ${
                    isImportedIoT 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                      : 'border-borders hover:bg-stone-50 text-stone-600 dark:text-stone-300 dark:border-emerald-950/40 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Cpu className="h-4.5 w-4.5" />
                  {isImportedIoT ? "IoT Sensors Linked ✓" : "Import Live Sensor Data"}
                </button>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-borders/40 dark:border-emerald-950/20 pt-4">
                {eventType === 'Irrigation Logged' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Water Source</label>
                      <input
                        type="text"
                        value={visualData.waterSource}
                        onChange={(e) => handleVisualChange('waterSource', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Volume (Litres)</label>
                      <input
                        type="number"
                        value={visualData.waterVolume}
                        onChange={(e) => handleVisualChange('waterVolume', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {eventType === 'Fertilizer Application' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Brand Name</label>
                      <input
                        type="text"
                        value={visualData.fertilizerBrand}
                        onChange={(e) => handleVisualChange('fertilizerBrand', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Quantity (Kg)</label>
                      <input
                        type="number"
                        value={visualData.fertilizerWeight}
                        onChange={(e) => handleVisualChange('fertilizerWeight', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Application Method</label>
                      <input
                        type="text"
                        value={visualData.fertilizerMethod}
                        onChange={(e) => handleVisualChange('fertilizerMethod', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {eventType === 'Pesticide Treatment' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Compound Name</label>
                      <input
                        type="text"
                        value={visualData.pestCompound}
                        onChange={(e) => handleVisualChange('pestCompound', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Dilution Ratio</label>
                      <input
                        type="text"
                        value={visualData.pestRatio}
                        onChange={(e) => handleVisualChange('pestRatio', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Targeted Pests / Insects</label>
                      <input
                        type="text"
                        value={visualData.pestTarget}
                        onChange={(e) => handleVisualChange('pestTarget', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {eventType === 'Crop Harvested' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Yield Weight (Kg)</label>
                      <input
                        type="number"
                        value={visualData.harvestWeight}
                        onChange={(e) => handleVisualChange('harvestWeight', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Storage Location</label>
                      <input
                        type="text"
                        value={visualData.harvestLocation}
                        onChange={(e) => handleVisualChange('harvestLocation', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Quality Classification Grade</label>
                      <input
                        type="text"
                        value={visualData.harvestGrade}
                        onChange={(e) => handleVisualChange('harvestGrade', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {eventType === 'Shipped' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Logistics Provider</label>
                      <input
                        type="text"
                        value={visualData.shipProvider}
                        onChange={(e) => handleVisualChange('shipProvider', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Temperature Maintained (°C)</label>
                      <input
                        type="number"
                        value={visualData.shipTemp}
                        onChange={(e) => handleVisualChange('shipTemp', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Destination Address</label>
                      <input
                        type="text"
                        value={visualData.shipDestination}
                        onChange={(e) => handleVisualChange('shipDestination', e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-borders/40 dark:border-emerald-950/20">
              <button
                type="button"
                onClick={() => setActiveSubTab('timeline')}
                className="px-5 py-3 rounded-xl bg-warmSand dark:bg-[#0c140f] border border-borders dark:border-emerald-950/20 text-stone-750 dark:text-stone-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all"
              >
                Submit Event to Blockchain
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'reports' && (
        /* TAB 3: COMPLIANCE REPORTS UPLOAD, PREVIEW AND GEMINI AI SUMMARIES */
        <div className="space-y-6">
          {/* UPLOAD DOCUMENT CARD */}
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-stone-850 dark:text-stone-200 uppercase tracking-wider">
              Upload Compliance Report
            </h3>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-borders dark:border-emerald-950/20 hover:border-primary dark:hover:border-emerald-900 bg-stone-50/20'
              }`}
            >
              <input
                type="file"
                id="report-file-input"
                className="hidden"
                onChange={handleFileInput}
                accept=".pdf,.png,.jpg,.jpeg,.csv"
              />
              <label htmlFor="report-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="p-3.5 rounded-full bg-primary/5 text-primary">
                  <UploadCloud className="h-6.5 w-6.5" />
                </div>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Drag & drop or <span className="text-primary hover:underline">browse files</span>
                </span>
                <span className="text-[10px] text-stone-400">
                  PDF, PNG, JPG, CSV up to 5MB • Prefixed to this batch automatically
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List (Left 2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-stone-850 dark:text-stone-200 uppercase tracking-wider">
                Compliance Document Library ({batchReports.length})
              </h3>
              
              {loadingReports ? (
                <p className="text-xs text-stone-400 italic">Processing document...</p>
              ) : batchReports.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-4">No reports uploaded yet for this batch.</p>
              ) : (
                <div className="space-y-3">
                  {batchReports.map((rep) => {
                    const cleanName = rep.name.replace(`[${currentBatchId}] `, '');
                    return (
                      <div key={rep.id} className="border border-borders/50 dark:border-emerald-950/20 p-3.5 rounded-xl flex items-center justify-between gap-4 bg-stone-50/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-lg bg-primary/5 text-primary">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{cleanName}</p>
                            <span className="text-[9px] bg-stone-100 dark:bg-zinc-900 text-stone-400 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                              {rep.type} • {new Date(rep.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewReport(rep)}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-900 text-stone-500 hover:text-stone-850 rounded-lg transition-all"
                            title="View Report"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <a
                            href={rep.content}
                            download={cleanName}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-900 text-stone-500 hover:text-stone-850 rounded-lg transition-all"
                            title="Download Report"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteReport(rep.id)}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-900 text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                            title="Delete Report"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Reports Summary (Right 1 col) */}
            <div className="bg-gradient-to-br from-emerald-900/5 to-green-900/10 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 text-primary dark:text-emerald-400">
                <Sparkles className="h-5 w-5" />
                <h4 className="text-xs font-black uppercase tracking-wider">AI Agronomic Analyzer</h4>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
                Click below to generate a comprehensive AI-powered agronomy summary and yield optimization report based on all events logged for this crop batch.
              </p>

              <button
                onClick={handleGenerateAIReport}
                disabled={generatingAI}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/95 disabled:bg-stone-300 text-white font-bold text-xs shadow-sm transition-all"
              >
                {generatingAI ? "Summarizing Logs..." : "Generate AI Audit Summary"}
              </button>

              {aiReportResult && (
                <div className="bg-white dark:bg-zinc-950/40 border border-borders/60 dark:border-emerald-950/20 p-4 rounded-2xl max-h-[220px] overflow-y-auto mt-4 text-[11px] font-medium leading-relaxed text-stone-700 dark:text-stone-300 space-y-2 whitespace-pre-line">
                  {aiReportResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Document Modal */}
      <AnimatePresence>
        {previewReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-stone-850 border border-borders dark:border-emerald-950/20 w-full max-w-2xl h-[80vh] rounded-[24px] p-6 shadow-xl flex flex-col relative"
            >
              <button 
                onClick={() => setPreviewReport(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-sm font-black text-stone-850 dark:text-stone-100 flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-emerald-600" />
                {previewReport.name.replace(`[${currentBatchId}] `, '')}
              </h3>

              <div className="flex-1 bg-stone-50 dark:bg-zinc-900 rounded-2xl overflow-hidden p-4 flex items-center justify-center border border-borders/50 dark:border-emerald-950/20">
                {previewReport.type === 'Image' ? (
                  <img
                    src={previewReport.content}
                    alt="Report Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <FileText className="h-10 w-10 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500 font-bold">Preview not supported for {previewReport.type} file format.</p>
                    <a
                      href={previewReport.content}
                      download={previewReport.name.replace(`[${currentBatchId}] `, '')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Download to View
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
