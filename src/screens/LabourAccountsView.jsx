import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Users,
  Calendar,
  IndianRupee,
  Clock,
  FileText,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

export default function LabourAccountsView() {
  const { labourAccounts, addLabourAccount, updateLabourAccount, deleteLabourAccount, currentBatchId, batches } = useFarm();
  const activeBatch = batches.find(b => b.id === currentBatchId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Selection states
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalLabour, setTotalLabour] = useState('');
  const [male, setMale] = useState('');
  const [female, setFemale] = useState('');
  const [duration, setDuration] = useState('');
  const [durationFemale, setDurationFemale] = useState('');
  const [wage, setWage] = useState('');
  const [wageFemale, setWageFemale] = useState('');
  const [totalExpense, setTotalExpense] = useState(0);
  const [remarks, setRemarks] = useState('');

  // Auto-calculate total expense
  useEffect(() => {
    const m = parseInt(male || 0, 10);
    const f = parseInt(female || 0, 10);
    const wm = parseFloat(wage || 0);
    const wf = parseFloat(wageFemale || wage || 0);
    const d = parseFloat(duration || 0);
    if (m > 0 || f > 0) {
      setTotalExpense(parseFloat(((m * wm * d) + (f * wf * d)).toFixed(2)));
    } else {
      const totalL = parseFloat(totalLabour || 0);
      setTotalExpense(parseFloat((totalL * wm * d).toFixed(2)));
    }
  }, [totalLabour, male, female, wage, wageFemale, duration]);

  // Sync male & female to total labour helper
  const handleMaleChange = (val) => {
    setMale(val);
    const m = parseInt(val || 0, 10);
    const f = parseInt(female || 0, 10);
    setTotalLabour(m + f > 0 ? (m + f).toString() : '');
  };

  const handleFemaleChange = (val) => {
    setFemale(val);
    const m = parseInt(male || 0, 10);
    const f = parseInt(val || 0, 10);
    setTotalLabour(m + f > 0 ? (m + f).toString() : '');
  };

  const handleTotalLabourChange = (val) => {
    setTotalLabour(val);
    // Reset male and female if total is set directly
    setMale('');
    setFemale('');
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTotalLabour('');
    setMale('');
    setFemale('');
    setDuration('');
    setWage('');
    setWageFemale('');
    setTotalExpense(0);
    setRemarks('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!date || !totalLabour) return;

    addLabourAccount({
      date,
      total_labour: parseInt(totalLabour, 10),
      male: parseInt(male || 0, 10),
      female: parseInt(female || 0, 10),
      duration: parseFloat(duration),
      wage: parseFloat(wage),
      wage_female: parseFloat(wageFemale || wage),
      total_expense: totalExpense,
      remarks
    });
    setShowAddModal(false);
    resetForm();
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setDate(entry.date.split('T')[0]);
    setTotalLabour(entry.total_labour.toString());
    setMale(entry.male ? entry.male.toString() : '');
    setFemale(entry.female ? entry.female.toString() : '');
    setDuration(entry.duration.toString());
    setWage(entry.wage.toString());
    setWageFemale(entry.wage_female ? entry.wage_female.toString() : entry.wage.toString());
    setTotalExpense(entry.total_expense);
    setRemarks(entry.remarks || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedEntry) return;

    updateLabourAccount(selectedEntry.id, {
      date,
      total_labour: parseInt(totalLabour, 10),
      male: parseInt(male || 0, 10),
      female: parseInt(female || 0, 10),
      duration: parseFloat(duration),
      wage: parseFloat(wage),
      wage_female: parseFloat(wageFemale || wage),
      total_expense: totalExpense,
      remarks
    });
    setShowEditModal(false);
    setSelectedEntry(null);
    resetForm();
  };

  const openDeleteConfirm = (entry) => {
    setSelectedEntry(entry);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedEntry) return;
    deleteLabourAccount(selectedEntry.id);
    setShowDeleteConfirm(false);
    setSelectedEntry(null);
  };

  // Metrics calculations
  const totalSpend = labourAccounts.reduce((sum, item) => sum + parseFloat(item.total_expense || 0), 0);
  const totalWorkers = labourAccounts.reduce((sum, item) => sum + parseInt(item.total_labour || 0, 10), 0);
  const averageWage = labourAccounts.length > 0 
    ? (labourAccounts.reduce((sum, item) => sum + parseFloat(item.wage || 0), 0) / labourAccounts.length).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 sm:px-10 space-y-10 bg-warmSand dark:bg-[#0c140f] min-h-[calc(100vh-80px)] transition-colors duration-300 animate-fadeIn">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-borders dark:border-emerald-950/20 pb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <Briefcase className="h-8 w-8 text-primary" />
            Labour Accounts
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mt-1">
            Maintain daily labour wages, duration logs, and gender statistics for crop batch <span className="text-primary dark:text-emerald-450 font-black">{activeBatch?.cropType || 'Crop'} ({currentBatchId})</span>.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:bg-primary/95 hover:-translate-y-0.5 transition-all duration-200 self-start sm:self-center"
        >
          <Plus className="h-4.5 w-4.5" />
          Log Labour Entry
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[24px] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Total Labour Expense</span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              ₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[24px] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Total Workers Employed</span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {totalWorkers} <span className="text-xs text-stone-400 font-bold">People</span>
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[24px] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Average Hourly Wage</span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              ₹{averageWage} <span className="text-xs text-stone-400 font-bold">/ hr</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Labour Table */}
      <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[28px] shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-primary" />
          Labour Ledger Accounts
        </h3>
        
        {labourAccounts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-borders dark:border-emerald-950/10 rounded-2xl text-stone-400">
            <Users className="h-10 w-10 mx-auto mb-2 text-stone-300" />
            <p className="text-xs font-bold">No labour accounts logged yet.</p>
            <p className="text-[10px] text-stone-450 mt-0.5">Click "Log Labour Entry" to create a new record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-borders dark:border-emerald-950/15 text-[10px] uppercase font-black text-stone-400 tracking-wider">
                  <th className="pb-3 pr-2">Date</th>
                  <th className="pb-3 px-2">Total Labour</th>
                  <th className="pb-3 px-2">Male</th>
                  <th className="pb-3 px-2">Female</th>
                  <th className="pb-3 px-2">Duration</th>
                  <th className="pb-3 px-2">Hourly Wage</th>
                  <th className="pb-3 px-2">Total Expense</th>
                  <th className="pb-3 px-2">Remarks</th>
                  <th className="pb-3 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {labourAccounts.map((entry) => (
                  <tr 
                    key={entry.id}
                    className="border-b border-borders/60 dark:border-emerald-950/10 last:border-none text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    <td className="py-4 pr-2 font-mono text-stone-550 dark:text-stone-400">
                      {entry.date ? entry.date.split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-4 px-2 text-stone-900 dark:text-stone-100 font-extrabold">{entry.total_labour}</td>
                    <td className="py-4 px-2 text-stone-500">{entry.male || 0}</td>
                    <td className="py-4 px-2 text-stone-500">{entry.female || 0}</td>
                    <td className="py-4 px-2 font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px]">M: {entry.duration} hrs</span>
                        {entry.female > 0 && (
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">F: {entry.duration_female || entry.duration} hrs</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px]">M: ₹{parseFloat(entry.wage).toFixed(2)}</span>
                        {entry.female > 0 && (
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">F: ₹{parseFloat(entry.wage_female || entry.wage).toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 font-mono text-primary dark:text-emerald-450 font-black">
                      ₹{parseFloat(entry.total_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-2 max-w-[200px] truncate text-stone-500" title={entry.remarks}>
                      {entry.remarks || '—'}
                    </td>
                    <td className="py-4 pl-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-300 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(entry)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD LABOUR ENTRY MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm animate-fadeIn"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#0c140f] border border-borders dark:border-emerald-950/30 rounded-[28px] shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto z-10 p-6 sm:p-8 space-y-6 relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  Log Labour Account
                </h2>
                <p className="text-xs text-stone-400 font-medium font-bold">
                  Enter worker parameters, duration, and wage details to log daily overhead expense.
                </p>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* MALE Parameters Card */}
                  <div className="p-4 bg-stone-50/50 dark:bg-zinc-950/25 border border-borders dark:border-emerald-950/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-borders/60 dark:border-emerald-950/10 pb-2">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Male Labour Details
                      </span>
                      <span className="text-[10px] font-mono text-stone-550 dark:text-stone-400 font-bold">
                        M-Subtotal: ₹{(parseInt(male || 0, 10) * parseFloat(wage || 0) * parseFloat(duration || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Male Count</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={male}
                          onChange={(e) => handleMaleChange(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Wage (₹/hr)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 15.00"
                          value={wage}
                          onChange={(e) => setWage(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Duration (hrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="e.g. 8.0"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FEMALE Parameters Card */}
                  <div className="p-4 bg-stone-50/50 dark:bg-zinc-950/25 border border-borders dark:border-emerald-950/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-borders/60 dark:border-emerald-950/10 pb-2">
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Female Labour Details
                      </span>
                      <span className="text-[10px] font-mono text-stone-550 dark:text-stone-400 font-bold">
                        F-Subtotal: ₹{(parseInt(female || 0, 10) * parseFloat(wageFemale || wage || 0) * parseFloat(durationFemale || duration || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Female Count</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={female}
                          onChange={(e) => handleFemaleChange(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Wage (₹/hr)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 15.00"
                          value={wageFemale}
                          onChange={(e) => setWageFemale(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Duration (hrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="e.g. 8.0"
                          value={durationFemale}
                          onChange={(e) => setDurationFemale(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Workers & Expense Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        Total Workers Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 10"
                        value={totalLabour}
                        onChange={(e) => handleTotalLabourChange(e.target.value)}
                        className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5 text-primary" />
                        Total Expense (Auto-calculated)
                      </label>
                      <div className="w-full bg-stone-100 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-sm text-primary dark:text-emerald-450 font-black cursor-not-allowed flex items-center gap-1 h-[42px] mt-0.5">
                        <IndianRupee className="h-4 w-4" />
                        <span>{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-stone-400 font-bold ml-auto uppercase tracking-widest">(Male Exp + Female Exp)</span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Remarks / Description
                    </label>
                    <textarea
                      placeholder="Enter details on tasks completed (e.g. apple orchard pruning)..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-borders/60 dark:border-emerald-950/15">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-3 rounded-xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-600 dark:text-stone-350 text-xs font-bold border border-borders/60 dark:border-emerald-950/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:bg-primary/95 transition-all"
                  >
                    <CheckCircle className="h-4.5 w-4.5" />
                    Log Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT LABOUR ENTRY MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm animate-fadeIn"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#0c140f] border border-borders dark:border-emerald-950/30 rounded-[28px] shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto z-10 p-6 sm:p-8 space-y-6 relative"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-primary" />
                  Edit Labour Account
                </h2>
                <p className="text-xs text-stone-400 font-medium font-bold">
                  Modify date, workforce size, wage rates, or comments for log #{selectedEntry?.id}.
                </p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* MALE Parameters Card */}
                  <div className="p-4 bg-stone-50/50 dark:bg-zinc-950/25 border border-borders dark:border-emerald-950/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-borders/60 dark:border-emerald-950/10 pb-2">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Male Labour Details
                      </span>
                      <span className="text-[10px] font-mono text-stone-550 dark:text-stone-400 font-bold">
                        M-Subtotal: ₹{(parseInt(male || 0, 10) * parseFloat(wage || 0) * parseFloat(duration || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Male Count</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={male}
                          onChange={(e) => handleMaleChange(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Wage (₹/hr)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 15.00"
                          value={wage}
                          onChange={(e) => setWage(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Duration (hrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="e.g. 8.0"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FEMALE Parameters Card */}
                  <div className="p-4 bg-stone-50/50 dark:bg-zinc-950/25 border border-borders dark:border-emerald-950/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-borders/60 dark:border-emerald-950/10 pb-2">
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Female Labour Details
                      </span>
                      <span className="text-[10px] font-mono text-stone-550 dark:text-stone-400 font-bold">
                        F-Subtotal: ₹{(parseInt(female || 0, 10) * parseFloat(wageFemale || wage || 0) * parseFloat(durationFemale || duration || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Female Count</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={female}
                          onChange={(e) => handleFemaleChange(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Wage (₹/hr)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 15.00"
                          value={wageFemale}
                          onChange={(e) => setWageFemale(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Duration (hrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="e.g. 8.0"
                          value={durationFemale}
                          onChange={(e) => setDurationFemale(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-borders dark:border-emerald-950/30 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Workers & Expense Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        Total Workers Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 10"
                        value={totalLabour}
                        onChange={(e) => handleTotalLabourChange(e.target.value)}
                        className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5 text-primary" />
                        Total Expense (Auto-calculated)
                      </label>
                      <div className="w-full bg-stone-100 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-sm text-primary dark:text-emerald-450 font-black cursor-not-allowed flex items-center gap-1 h-[42px] mt-0.5">
                        <IndianRupee className="h-4 w-4" />
                        <span>{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-stone-400 font-bold ml-auto uppercase tracking-widest">(Male Exp + Female Exp)</span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Remarks / Description
                    </label>
                    <textarea
                      placeholder="Enter details on tasks completed..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                      className="w-full bg-stone-50/50 dark:bg-zinc-900/40 border border-borders dark:border-emerald-950/30 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-borders/60 dark:border-emerald-950/15">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-3 rounded-xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-600 dark:text-stone-350 text-xs font-bold border border-borders/60 dark:border-emerald-950/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:bg-primary/95 transition-all"
                  >
                    <CheckCircle className="h-4.5 w-4.5" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm animate-fadeIn"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#0c140f] border border-borders dark:border-emerald-950/30 rounded-[24px] shadow-2xl w-full max-w-md z-10 p-6 space-y-6 relative"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-650 dark:text-red-400 rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                    Delete Labour Log Record
                  </h3>
                  <p className="text-xs text-stone-550 dark:text-stone-405 leading-relaxed font-bold">
                    Are you sure you want to delete the labour log entry from <span className="font-mono text-stone-800 dark:text-stone-200">{selectedEntry?.date.split('T')[0]}</span>? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-borders/60 dark:border-emerald-950/15">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-600 dark:text-stone-350 text-xs font-bold border border-borders/60 dark:border-emerald-950/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
