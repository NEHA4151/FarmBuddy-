import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sprout, 
  Calendar, 
  MapPin, 
  FileText, 
  Upload, 
  Layers, 
  CheckCircle,
  FolderOpen,
  Plus,
  Award,
  ChevronRight
} from 'lucide-react';

const CROP_TEMPLATES = {
  apples: {
    cropType: 'Organic Honeycrisp Apples',
    soilType: 'Sandy Loam',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    notes: 'Section 4B orchard planting. Drip lines checked, high mineral content organic compost applied.',
    harvestOffsetMonths: 5
  },
  tomatoes: {
    cropType: 'Heirloom Vine Tomatoes',
    soilType: 'Silty Clay Loam',
    imageUrl: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80',
    notes: 'Greenhouse Zone C. Injected liquid worm castings fertilizer. Organic pest barriers active.',
    harvestOffsetMonths: 3
  },
  blueberries: {
    cropType: 'Organic Jewel Blueberries',
    soilType: 'Acidic Peat Sand',
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80',
    notes: 'North Field Area 2. Pine needle mulch applied for optimal soil acidity levels (target pH 4.8).',
    harvestOffsetMonths: 4
  }
};

export default function CreateBatch() {
  const { user, createBatch, setCurrentView, batches, setCurrentBatchId, calculateTrustScore } = useFarm();
  const [activeTab, setActiveTab] = useState('select'); // 'select' or 'create'
  
  const nextBatchId = `FB-2026-${String(batches.length + 1).padStart(3, '0')}`;
  
  // Form State
  const [cropType, setCropType] = useState('');
  const [seedDate, setSeedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [location, setLocation] = useState(user?.farmName ? `Section 4B, ${user.farmName}` : 'Section 4B, Green Valley Organic Farm, CA');
  const [soilType, setSoilType] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleApplyTemplate = (key) => {
    const template = CROP_TEMPLATES[key];
    if (!template) return;
    
    setSelectedTemplate(key);
    setCropType(template.cropType);
    setSoilType(template.soilType);
    setImageUrl(template.imageUrl);
    setNotes(template.notes);
    
    const sDate = new Date(seedDate);
    sDate.setMonth(sDate.getMonth() + template.harvestOffsetMonths);
    setExpectedHarvestDate(sDate.toISOString().split('T')[0]);
  };

  const handleImageUploadSimulated = () => {
    alert("Farm Image Saved Successfully! (Stored in secure document folder)");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createBatch({
      cropType,
      seedDate,
      expectedHarvestDate,
      location,
      soilType,
      notes,
      imageUrl
    });
  };

  const handleSelectBatch = (batchId) => {
    setCurrentBatchId(batchId);
    setCurrentView('workflow-calendar');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Back link */}
      <button
        onClick={() => setCurrentView('farmer-dashboard')}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-850 dark:hover:text-stone-200 text-xs font-bold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Header and Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-borders dark:border-emerald-950/20 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sprout className="h-7 w-7 text-emerald-600" />
            Batch Registration & Selection
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-stone-400 font-medium mt-1">
            Choose an active crop batch to manage its workflow, or register a new harvest ledger.
          </p>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex bg-biscuitHover dark:bg-zinc-950/40 p-1.5 rounded-xl border border-borders/40 dark:border-emerald-950/20 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('select')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'select'
                ? 'bg-primary text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Select Batch
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-primary text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Plus className="h-4 w-4" />
            New Batch
          </button>
        </div>
      </div>

      {activeTab === 'select' ? (
        /* TAB 1: BATCH SELECTOR GRID */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => {
              const score = calculateTrustScore(batch.id);
              let scoreColor = 'text-emerald-500 bg-emerald-500/10';
              if (score < 50) scoreColor = 'text-red-500 bg-red-500/10';
              else if (score < 75) scoreColor = 'text-amber-500 bg-amber-500/10';
              
              return (
                <motion.div
                  key={batch.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleSelectBatch(batch.id)}
                  className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[22px] shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden"
                >
                  {/* Crop Image Thumbnail */}
                  <img
                    src={batch.imageUrl}
                    alt={batch.cropType}
                    className="w-16 h-16 rounded-xl object-cover border border-borders/60 dark:border-emerald-950/20"
                  />
                  
                  {/* Batch Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-stone-400 dark:text-emerald-400 tracking-wider">
                        {batch.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scoreColor} flex items-center gap-1`}>
                        <Award className="h-3 w-3" />
                        {score} Trust
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate group-hover:text-primary transition-colors">
                      {batch.cropType}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3.5 w-3.5 text-stone-400" />
                        {batch.location.split(',')[0]}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {batch.seedDate}
                      </span>
                    </div>
                  </div>

                  {/* Indicator Arrow */}
                  <div className="text-stone-300 dark:text-stone-700 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors p-1">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB 2: REGISTER NEW BATCH RECORD FORM */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 sm:p-8 shadow-sm"
        >
          {/* Quick templates */}
          <div className="mb-6 space-y-2">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block">
              Quick Autofill Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CROP_TEMPLATES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyTemplate(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedTemplate === key
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-borders hover:bg-stone-50 text-stone-700 dark:text-stone-300 dark:border-emerald-950/40 dark:hover:bg-zinc-800'
                  }`}
                >
                  {CROP_TEMPLATES[key].cropType.split(' ')[1] || CROP_TEMPLATES[key].cropType}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batch ID read-only */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Batch Ledger ID (Auto-Generated)
                </label>
                <input
                  type="text"
                  disabled
                  value={nextBatchId}
                  className="w-full bg-stone-100 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-500 font-bold focus:outline-none"
                />
              </div>

              {/* Crop Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Sprout className="h-4 w-4 text-primary" />
                  Crop Variety Name
                </label>
                <input
                  type="text"
                  required
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  placeholder="e.g. Organic Roma Tomatoes"
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Seed Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  Sowing/Planting Date
                </label>
                <input
                  type="date"
                  required
                  value={seedDate}
                  onChange={(e) => setSeedDate(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {/* Expected Harvest Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  Target Harvest Date
                </label>
                <input
                  type="date"
                  required
                  value={expectedHarvestDate}
                  onChange={(e) => setExpectedHarvestDate(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  Field Location / Parcel
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Section 4B, Green Valley Farm, CA"
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Soil Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Layers className="h-4 w-4 text-primary" />
                  Soil Classification
                </label>
                <input
                  type="text"
                  required
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  placeholder="e.g. Sandy Loam, Clay, Peat"
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <FileText className="h-4 w-4 text-primary" />
                  Batch Details & Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter details about soil moisture targets, nutrient regimes, fertilizer plans..."
                  rows={3}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Image upload simulated */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Crop Image (Secure Document Store)
                </label>
                <div 
                  onClick={handleImageUploadSimulated}
                  className="border-2 border-dashed border-borders dark:border-emerald-950/20 hover:border-primary rounded-[20px] p-6 text-center cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-900/40 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="p-3 rounded-full bg-primary/5 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Click to simulated-upload batch image
                  </span>
                  <span className="text-[10px] text-stone-400">
                    PNG, JPG up to 10MB • Will be stored in secure folder
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('select')}
                className="px-5 py-3 rounded-xl bg-[#F8F6ED] dark:bg-stone-850 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all border border-borders/60 dark:border-emerald-950/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary/95 transition-all hover:-translate-y-0.5"
              >
                <CheckCircle className="h-4.5 w-4.5" />
                Create Batch Record
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
