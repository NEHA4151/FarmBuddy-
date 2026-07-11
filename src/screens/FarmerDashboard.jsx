import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sprout, 
  Calendar, 
  MapPin, 
  FileText, 
  Upload, 
  Layers, 
  CheckCircle,
  ChevronRight,
  Award,
  X,
  FolderOpen
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

export default function FarmerDashboard() {
  const { user, batches, createBatch, setCurrentBatchId, setCurrentView, calculateTrustScore } = useFarm();
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for new batch registration
  const [cropType, setCropType] = useState('');
  const [seedDate, setSeedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [location, setLocation] = useState(user?.farmName ? `Section 4B, ${user.farmName}` : 'Section 4B, Green Valley Organic Farm, CA');
  const [soilType, setSoilType] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const nextBatchId = `FB-2026-${String(batches.length + 1).padStart(3, '0')}`;

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
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setCropType('');
    setSeedDate(new Date().toISOString().split('T')[0]);
    setExpectedHarvestDate('');
    setLocation(user?.farmName ? `Section 4B, ${user.farmName}` : 'Section 4B, Green Valley Organic Farm, CA');
    setSoilType('');
    setNotes('');
    setImageUrl('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80');
    setSelectedTemplate('');
  };

  const handleSelectBatch = (batchId) => {
    setCurrentBatchId(batchId);
    setCurrentView('workflow-calendar');
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 sm:px-10 space-y-10 bg-warmSand dark:bg-[#0c140f] min-h-[calc(100vh-80px)] transition-colors duration-300 animate-fadeIn">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-borders dark:border-emerald-950/20 pb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <Sprout className="h-8 w-8 text-primary" />
            Crop ID Dashboard
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mt-1">
            Welcome back, {user?.name || 'Farmer'}. Select an active cultivation ledger below to manage its workflow or register a new crop.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:bg-primary/95 hover:-translate-y-0.5 transition-all duration-200 self-start sm:self-center"
        >
          <Plus className="h-4.5 w-4.5" />
          Create New Batch
        </button>
      </div>

      {/* Grid of Crop IDs / Batches */}
      {batches.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-950/20 border border-dashed border-borders dark:border-emerald-950/20 rounded-[28px] p-8 space-y-4">
          <FolderOpen className="h-12 w-12 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300">No batches registered yet</h3>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">Click "Create New Batch" above to log your first cultivation ledger.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b) => {
            const score = calculateTrustScore(b.id);
            let scoreColor = 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400';
            if (score < 50) scoreColor = 'text-red-500 bg-red-500/10';
            else if (score < 75) scoreColor = 'text-amber-500 bg-amber-500/10';

            return (
              <motion.div
                key={b.id}
                whileHover={{ scale: 1.015, y: -2 }}
                onClick={() => handleSelectBatch(b.id)}
                className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
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
                      <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Sown Date</span>
                      <span className="font-extrabold text-stone-700 dark:text-stone-200">{b.seedDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">Target Harvest</span>
                      <span className="font-extrabold text-stone-700 dark:text-stone-200">{b.expectedHarvestDate || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW BATCH MODAL DIALOG */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm animate-fadeIn"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#0c140f] border border-borders dark:border-emerald-950/30 rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto z-10 p-6 sm:p-8 space-y-6 relative"
            >
              {/* Close button */}
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-primary" />
                  Register Crop Ledger
                </h2>
                <p className="text-xs text-stone-400 font-medium">
                  Autofill with standard templates or log a custom batch on the blockchain traceability database.
                </p>
              </div>

              {/* Autofill templates */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                  Autofill Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CROP_TEMPLATES).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyTemplate(key)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedTemplate === key
                          ? 'bg-primary text-white border-primary shadow-sm animate-pulse'
                          : 'bg-stone-50 dark:bg-zinc-900 border-borders hover:bg-stone-100 text-stone-700 dark:text-stone-300 dark:border-emerald-950/40 dark:hover:bg-zinc-850'
                      }`}
                    >
                      {CROP_TEMPLATES[key].cropType.split(' ')[1] || CROP_TEMPLATES[key].cropType} Template
                    </button>
                  ))}
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Batch ID read-only */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Ledger Batch ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={nextBatchId}
                      className="w-full bg-stone-50 dark:bg-zinc-900/60 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-400 font-extrabold cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  {/* Crop Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Sprout className="h-4 w-4 text-primary" />
                      Crop Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      placeholder="e.g. Organic Roma Tomatoes"
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Seed Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      Sowing Date
                    </label>
                    <input
                      type="date"
                      required
                      value={seedDate}
                      onChange={(e) => setSeedDate(e.target.value)}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Expected Harvest Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      Expected Harvest Date
                    </label>
                    <input
                      type="date"
                      required
                      value={expectedHarvestDate}
                      onChange={(e) => setExpectedHarvestDate(e.target.value)}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      Field Location
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Section 4B, Green Valley Farm"
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Soil Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Layers className="h-4 w-4 text-primary" />
                      Soil Type
                    </label>
                    <input
                      type="text"
                      required
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      placeholder="e.g. Sandy Loam, Clay"
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-primary" />
                      Batch Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Autofilled from template or enter special notes about water cycle targets..."
                      rows={3}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Image upload simulated */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Crop Image (Secure Document Store)
                    </label>
                    <div 
                      onClick={handleImageUploadSimulated}
                      className="border border-dashed border-borders dark:border-emerald-950/30 hover:border-primary rounded-xl p-4 text-center cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-900/20 transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <Upload className="h-5 w-5 text-stone-400" />
                      <span className="text-[11px] font-bold text-stone-600 dark:text-stone-350">
                        Upload batch image (Simulated)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-borders/60 dark:border-emerald-950/15">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-600 dark:text-stone-350 text-xs font-bold border border-borders/60 dark:border-emerald-950/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:bg-primary/95 transition-all"
                  >
                    <CheckCircle className="h-4.5 w-4.5" />
                    Register Batch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
