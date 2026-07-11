import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Cpu, 
  Code, 
  Mic, 
  FileImage, 
  Activity,
  Layers,
  Database,
  CheckCircle
} from 'lucide-react';

export default function AddEvent() {
  const { 
    batches, 
    currentBatchId, 
    setCurrentBatchId, 
    telemetry, 
    addEvent, 
    setCurrentView 
  } = useFarm();

  const [eventType, setEventType] = useState('Irrigation Logged');
  const [editorMode, setEditorMode] = useState('form'); // 'form' or 'json'
  const [payloadText, setPayloadText] = useState(JSON.stringify({
    source: 'Central Irrigation Tank #1',
    volumeLitres: 500,
    phReported: telemetry.phLevel
  }, null, 2));
  
  const [formFields, setFormFields] = useState(() => ({
    // Irrigation Logged
    source: 'Central Irrigation Tank #1',
    volumeLitres: 500,
    phReported: telemetry.phLevel,
    
    // Fertilizer Application
    brand: 'Nitrogen-Plus BioGrow',
    weightKg: 10,
    applicationMethod: 'Soil Injection',
    
    // Pesticide Application
    compound: 'Organic Neem Concentrate',
    dilutionRatio: '1:50',
    targetedPest: 'Aphids / Mites',
    
    // Crop Harvested
    yieldWeightKg: 850,
    storageVault: 'Silo Section 3',
    qualityGradeEstimate: 'AA Specialty',
    
    // Shipped
    logisticsProvider: 'ColdChain Agri-Transit Inc',
    destination: 'Pacific Central Distribution, SF',
    temperatureMaintained: '4.2°C'
  }));

  const [voiceUploaded, setVoiceUploaded] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [miningStep, setMiningStep] = useState(0);

  const selectedBatch = batches.find(b => b.id === currentBatchId) || batches[0];

  const parseNumber = (val) => {
    if (val === '') return '';
    const num = Number(val);
    return isNaN(num) ? val : num;
  };

  const syncFormToJSON = (type, fields) => {
    let p = {};
    if (type === 'Irrigation Logged') {
      p = { source: fields.source, volumeLitres: parseNumber(fields.volumeLitres), phReported: parseNumber(fields.phReported) };
    } else if (type === 'Fertilizer Application') {
      p = { brand: fields.brand, weightKg: parseNumber(fields.weightKg), applicationMethod: fields.applicationMethod };
    } else if (type === 'Pesticide Application') {
      p = { compound: fields.compound, dilutionRatio: fields.dilutionRatio, targetedPest: fields.targetedPest };
    } else if (type === 'Crop Harvested') {
      p = { yieldWeightKg: parseNumber(fields.yieldWeightKg), storageVault: fields.storageVault, qualityGradeEstimate: fields.qualityGradeEstimate };
    } else if (type === 'Shipped') {
      p = { logisticsProvider: fields.logisticsProvider, destination: fields.destination, temperatureMaintained: fields.temperatureMaintained };
    }

    // Preserve IoT telemetry if present
    if (fields.iotSoilMoisture !== undefined) p.iotSoilMoisture = fields.iotSoilMoisture;
    if (fields.iotAirTemp !== undefined) p.iotAirTemp = fields.iotAirTemp;
    if (fields.iotPhLevel !== undefined) p.iotPhLevel = fields.iotPhLevel;
    if (fields.iotHumidity !== undefined) p.iotHumidity = fields.iotHumidity;
    if (fields.iotReadingTimestamp !== undefined) p.iotReadingTimestamp = fields.iotReadingTimestamp;

    setPayloadText(JSON.stringify(p, null, 2));
  };

  const handleFieldChange = (name, val) => {
    const updated = {
      ...formFields,
      [name]: val
    };
    setFormFields(updated);
    syncFormToJSON(eventType, updated);
  };

  const renderFormFields = () => {
    switch (eventType) {
      case 'Irrigation Logged':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Water Source</label>
              <input
                type="text"
                value={formFields.source || ''}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Central Irrigation Tank #1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Volume (Litres)</label>
              <input
                type="number"
                value={formFields.volumeLitres || ''}
                onChange={(e) => handleFieldChange('volumeLitres', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. 500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">pH Level Reported</label>
              <input
                type="number"
                step="0.01"
                value={formFields.phReported || ''}
                onChange={(e) => handleFieldChange('phReported', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. 6.43"
              />
            </div>
          </div>
        );
      case 'Fertilizer Application':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Fertilizer Brand / Type</label>
              <input
                type="text"
                value={formFields.brand || ''}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Nitrogen-Plus BioGrow"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Weight (Kg)</label>
              <input
                type="number"
                value={formFields.weightKg || ''}
                onChange={(e) => handleFieldChange('weightKg', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. 10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Application Method</label>
              <input
                type="text"
                value={formFields.applicationMethod || ''}
                onChange={(e) => handleFieldChange('applicationMethod', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Soil Injection"
              />
            </div>
          </div>
        );
      case 'Pesticide Application':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Compound / Brand</label>
              <input
                type="text"
                value={formFields.compound || ''}
                onChange={(e) => handleFieldChange('compound', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Organic Neem Concentrate"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Dilution Ratio</label>
              <input
                type="text"
                value={formFields.dilutionRatio || ''}
                onChange={(e) => handleFieldChange('dilutionRatio', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. 1:50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Targeted Pest</label>
              <input
                type="text"
                value={formFields.targetedPest || ''}
                onChange={(e) => handleFieldChange('targetedPest', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Aphids / Mites"
              />
            </div>
          </div>
        );
      case 'Crop Harvested':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Yield Weight (Kg)</label>
              <input
                type="number"
                value={formFields.yieldWeightKg || ''}
                onChange={(e) => handleFieldChange('yieldWeightKg', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. 850"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Storage Location / Vault</label>
              <input
                type="text"
                value={formFields.storageVault || ''}
                onChange={(e) => handleFieldChange('storageVault', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Silo Section 3"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Quality Grade Estimate</label>
              <input
                type="text"
                value={formFields.qualityGradeEstimate || ''}
                onChange={(e) => handleFieldChange('qualityGradeEstimate', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. AA Specialty"
              />
            </div>
          </div>
        );
      case 'Shipped':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Logistics Provider</label>
              <input
                type="text"
                value={formFields.logisticsProvider || ''}
                onChange={(e) => handleFieldChange('logisticsProvider', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. ColdChain Agri-Transit Inc"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Destination</label>
              <input
                type="text"
                value={formFields.destination || ''}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. Pacific Central Distribution, SF"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Temperature Maintained</label>
              <input
                type="text"
                value={formFields.temperatureMaintained || ''}
                onChange={(e) => handleFieldChange('temperatureMaintained', e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                placeholder="e.g. 4.2°C"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderIoTTelemetry = () => {
    if (!formFields.iotSoilMoisture) return null;
    return (
      <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
        <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-primary flex items-center gap-1">
          <Cpu className="h-3 w-3 animate-pulse" />
          Attached IoT Telemetry
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-borders">
            <span className="block text-[9px] text-stone-400 font-bold">Soil Moisture</span>
            <span className="text-xs font-extrabold text-stone-850 dark:text-stone-100">{formFields.iotSoilMoisture}</span>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-borders">
            <span className="block text-[9px] text-stone-400 font-bold">Air Temp</span>
            <span className="text-xs font-extrabold text-stone-850 dark:text-stone-100">{formFields.iotAirTemp}</span>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-borders">
            <span className="block text-[9px] text-stone-400 font-bold">Soil pH</span>
            <span className="text-xs font-extrabold text-stone-850 dark:text-stone-100">{formFields.iotPhLevel}</span>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-borders">
            <span className="block text-[9px] text-stone-400 font-bold">Humidity</span>
            <span className="text-xs font-extrabold text-stone-850 dark:text-stone-100">{formFields.iotHumidity}</span>
          </div>
        </div>
        <p className="text-[8px] text-stone-400 text-right font-medium">
          Synced at: {new Date(formFields.iotReadingTimestamp).toLocaleTimeString()}
        </p>
      </div>
    );
  };


  const handleTabChange = (mode) => {
    if (mode === 'form') {
      try {
        const parsed = JSON.parse(payloadText);
        setFormFields(prev => ({
          ...prev,
          ...parsed
        }));
      } catch (e) {
        // Keep last state if JSON is invalid
      }
    } else {
      syncFormToJSON(eventType, formFields);
    }
    setEditorMode(mode);
  };

  const handleEventTypeChange = (e) => {
    const val = e.target.value;
    setEventType(val);
    syncFormToJSON(val, formFields);
  };

  const handleIoTAutofill = () => {
    if (editorMode === 'form') {
      const updated = {
        ...formFields,
        iotSoilMoisture: `${telemetry.soilMoisture}%`,
        iotAirTemp: `${telemetry.temperature}°C`,
        iotPhLevel: telemetry.phLevel,
        iotHumidity: `${telemetry.humidity}%`,
        iotReadingTimestamp: new Date().toISOString()
      };
      setFormFields(updated);
      syncFormToJSON(eventType, updated);
    } else {
      try {
        const currentPayload = JSON.parse(payloadText);
        const merged = {
          ...currentPayload,
          iotSoilMoisture: `${telemetry.soilMoisture}%`,
          iotAirTemp: `${telemetry.temperature}°C`,
          iotPhLevel: telemetry.phLevel,
          iotHumidity: `${telemetry.humidity}%`,
          iotReadingTimestamp: new Date().toISOString()
        };
        setPayloadText(JSON.stringify(merged, null, 2));
      } catch (err) {
        setPayloadText(JSON.stringify({
          iotSoilMoisture: `${telemetry.soilMoisture}%`,
          iotAirTemp: `${telemetry.temperature}°C`,
          iotPhLevel: telemetry.phLevel,
          iotHumidity: `${telemetry.humidity}%`
        }, null, 2));
      }
    }
  };

  const handleSimulateVoice = () => {
    setVoiceUploaded(true);
    alert("Voice note transcribed: 'Applying irrigation water to section 4B. Telemetry within normal limits.' (Transcribed via FarmBuddy AI)");
  };

  const handleSimulateImage = () => {
    setImageUploaded(true);
    alert("Document uploaded successfully. Metadata cataloged.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch (err) {
      alert("Invalid JSON format. Please correct payload parameters.");
      return;
    }

    // Trigger Mining / Saving Simulation Overlay
    setIsMining(true);
    setMiningStep(0);

    const steps = [
      'Verifying credentials...',
      'Generating secure record ID...',
      'Uploading document metadata...',
      'Securing historical logs...',
      'Activity logged successfully'
    ];

    const runMining = (stepIdx) => {
      if (stepIdx < steps.length) {
        setMiningStep(stepIdx);
        setTimeout(() => runMining(stepIdx + 1), 600);
      } else {
        setIsMining(false);
        addEvent(selectedBatch.id, eventType, parsedPayload);
        setCurrentView('batch-timeline');
      }
    };

    runMining(0);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      {/* Back to Dashboard */}
      <button
        onClick={() => setCurrentView('farmer-dashboard')}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-850 text-xs font-bold transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
          Log Farm Activity
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Log treatments, water inputs, harvests, or dispatch logs into the secure history log.
        </p>
      </div>

      {/* Main Box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-borders p-6 sm:p-8 rounded-[20px] shadow-sm relative overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Batch Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Target Crop Batch</label>
              <select
                value={currentBatchId}
                onChange={(e) => setCurrentBatchId(e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
              >
                {batches.map(b => (
                  <option 
                    key={b.id} 
                    value={b.id} 
                    className="text-stone-900 bg-white" 
                    style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
                  >
                    {b.cropType} ({b.id}) - [{b.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">Activity Type</label>
              <select
                value={eventType}
                onChange={handleEventTypeChange}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold"
              >
                <option value="Irrigation Logged" className="text-stone-900 bg-white" style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}>💧 Irrigation Cycle</option>
                <option value="Fertilizer Application" className="text-stone-900 bg-white" style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}>🧪 Fertilizer Treatment</option>
                <option value="Pesticide Application" className="text-stone-900 bg-white" style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}>🌿 Pest Control Treatment</option>
                <option value="Crop Harvested" className="text-stone-900 bg-white" style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}>🌾 Crop Harvesting</option>
                <option value="Shipped" className="text-stone-900 bg-white" style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}>🚚 Logistics Dispatch</option>
              </select>
            </div>

            {/* Payload Editor Area */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 dark:border-zinc-800 pb-2">
                {/* Mode Switcher Tabs */}
                <div className="flex gap-1 bg-stone-100 dark:bg-zinc-900 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleTabChange('form')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold transition-all ${
                      editorMode === 'form'
                        ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    Visual Form
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('json')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold transition-all ${
                      editorMode === 'json'
                        ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    Developer JSON
                  </button>
                </div>

                {/* IoT Auto fill */}
                <button
                  type="button"
                  onClick={handleIoTAutofill}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-[10px] font-bold text-primary border border-primary/15 hover:bg-primary/20 transition-all hover:-translate-y-0.5"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  Import Live Sensor Data
                </button>
              </div>

              {/* Editor Content Area */}
              <div className="transition-all duration-200">
                {editorMode === 'form' ? (
                  <div className="space-y-4">
                    {renderFormFields()}
                    {renderIoTTelemetry()}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                      <Code className="h-3.5 w-3.5 text-primary" />
                      Payload JSON Parameters
                    </label>
                    <textarea
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      rows={6}
                      className="w-full font-mono text-[11px] bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-2xl p-4 text-stone-850 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="{}"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Upload image simulated */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Attach Photo / Document</label>
              <div 
                onClick={handleSimulateImage}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                  imageUploaded 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-borders hover:border-primary hover:bg-stone-50 text-stone-500'
                }`}
              >
                <FileImage className="h-5 w-5" />
                <span className="text-xs font-bold">
                  {imageUploaded ? 'Document Attached! ✓' : 'Upload Audit Image / PDF'}
                </span>
                <span className="text-[9px] text-stone-400">Files are linked to record ID</span>
              </div>
            </div>

            {/* Voice note upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#374151]">Voice Note Transcription</label>
              <div 
                onClick={handleSimulateVoice}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                  voiceUploaded 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-borders hover:border-primary hover:bg-stone-50 text-stone-500'
                }`}
              >
                <Mic className="h-5 w-5" />
                <span className="text-xs font-bold">
                  {voiceUploaded ? 'Audio Transcribed! ✓' : 'Record Voice Memo'}
                </span>
                <span className="text-[9px] text-stone-400">Converts to text logs</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('farmer-dashboard')}
              className="px-5 py-3 rounded-xl bg-biscuitSec hover:bg-biscuitHover text-stone-700 text-xs font-bold transition-all dark:bg-zinc-900 dark:text-stone-300 dark:hover:bg-primary/30"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all hover:-translate-y-0.5"
            >
              <CheckCircle className="h-4.5 w-4.5" />
              Log Farm Activity
            </button>
          </div>
        </form>

        {/* Blockchain / Saving Activity Loading Overlay */}
        <AnimatePresence>
          {isMining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30"
            >
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full border-4 border-dashed border-primary animate-spin" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 flex items-center justify-center text-primary">
                  <Activity className="h-8 w-8 animate-pulse" />
                </div>
              </div>

              <h3 className="text-lg font-extrabold text-stone-900">Logging Activity Record</h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1 mb-6 leading-relaxed">
                Validating activity details and generating secure record ID...
              </p>

              {/* Progress Stepper List */}
              <div className="space-y-3 max-w-xs text-left mx-auto">
                {[
                  'Verifying credentials...',
                  'Generating secure record ID...',
                  'Uploading document metadata...',
                  'Securing historical logs...',
                  'Activity logged successfully'
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      miningStep > idx
                        ? 'bg-primary text-white'
                        : miningStep === idx
                        ? 'bg-primary/20 border border-primary text-primary animate-pulse'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {miningStep > idx ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs font-semibold ${
                      miningStep > idx
                        ? 'text-primary font-bold'
                        : miningStep === idx
                        ? 'text-stone-900 font-extrabold'
                        : 'text-stone-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
