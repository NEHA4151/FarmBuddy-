import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Droplet, 
  Sparkles, 
  Sprout,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CalendarView() {
  const { currentBatchId, batches, scheduledActivities, setScheduledActivities, addNotification, logBatchEvent, timeline } = useFarm();
  
  const batch = batches.find(b => b.id === currentBatchId);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5)); // June 2026
 
  // Editing state for schedules
  const [editingTask, setEditingTask] = useState(null);
 
  // Form State for new activity
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskType, setTaskType] = useState('Watering');
  const [notes, setNotes] = useState('');

  // Date notes state persistent via localStorage
  const [dateNotes, setDateNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`notes_${currentBatchId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteText, setEditingNoteText] = useState('');

  const handleSaveNote = (noteText) => {
    const updated = {
      ...dateNotes,
      [selectedDate]: noteText
    };
    setDateNotes(updated);
    try {
      localStorage.setItem(`notes_${currentBatchId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setIsEditingNote(false);
  };
 
  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to view its calendar.
      </div>
    );
  }
 
  // Generate calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
 
  const days = [];
  // Padding for start of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateStr: dStr,
      dayNum: d
    });
  }
 
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
 
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
 
  const todayStr = '2026-06-25'; // Context date
 
  // Filter activities for this batch
  const batchActivities = scheduledActivities.filter(a => a.batchId === currentBatchId);

  // Map logged events into same calendar schema to show them in the Interactive Crop Calendar
  const loggedEvents = useMemo(() => {
    const rawEvents = timeline && timeline[currentBatchId] ? timeline[currentBatchId] : [];
    return rawEvents.map(evt => {
      // payload extraction helper
      let payloadNotes = '';
      if (evt.payload && typeof evt.payload === 'object') {
        payloadNotes = Object.entries(evt.payload)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      } else {
        payloadNotes = String(evt.payload || '');
      }

      return {
        id: evt.id || `evt-${Math.random()}`,
        batchId: currentBatchId,
        date: evt.timestamp ? evt.timestamp.split('T')[0] : selectedDate,
        type: evt.type || 'Farming Log',
        notes: payloadNotes,
        completed: true,
        isLoggedEvent: true
      };
    });
  }, [timeline, currentBatchId, selectedDate]);

  const allCalendarItems = useMemo(() => {
    return [...batchActivities, ...loggedEvents];
  }, [batchActivities, loggedEvents]);
 
  const handleAddTask = (e) => {
    e.preventDefault();
    const newTask = {
      id: `sch-${Date.now()}`,
      batchId: currentBatchId,
      date: selectedDate,
      type: taskType,
      notes: notes,
      completed: false
    };
 
    setScheduledActivities(prev => [...prev, newTask]);
    addNotification("Task Scheduled", `${taskType} task scheduled successfully for ${selectedDate}.`, "info");
    if (logBatchEvent) {
      logBatchEvent(
        'Task Scheduled',
        `${taskType} Task Scheduled`,
        `Farming task '${taskType}' scheduled for ${selectedDate}. Notes: ${notes}`,
        'Success',
        0.0
      );
    }
    setShowAddModal(false);
    setNotes('');
  };
 
  const handleCompleteTask = (taskId) => {
    const act = scheduledActivities.find(a => a.id === taskId);
    setScheduledActivities(prev => prev.map(a => {
      if (a.id === taskId) {
        confetti({ particleCount: 50, spread: 40 });
        return {
          ...a,
          completed: true,
          completedAt: new Date().toISOString()
        };
      }
      return a;
    }));
    addNotification("Task Completed", "Scheduled task successfully executed and logged.", "success");
    if (act && logBatchEvent) {
      const today = new Date().toISOString().split('T')[0];
      const isDelayed = today > act.date;
      const impact = isDelayed ? -0.5 : 5.0; // Delayed: -0.5, On-time: +5.0
      logBatchEvent(
        'Activity Completed',
        `${act.type} Task Completed`,
        `Executed scheduled task: ${act.notes}. Status: ${isDelayed ? 'Completed Late' : 'Completed On-Time'}`,
        'Success',
        impact
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-borders dark:border-emerald-950/20 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
            Workspace: {batch.id} • {batch.cropType}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
            <CalendarIcon className="h-7 w-7 text-emerald-600" />
            Interactive Crop Calendar
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Schedule Activity
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid Container (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-extrabold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1 bg-biscuitHover dark:bg-zinc-900 p-1 rounded-xl">
              <button onClick={handlePrevMonth} className="p-1.5 text-stone-500 hover:text-stone-850 dark:hover:text-stone-100 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 text-stone-500 hover:text-stone-850 dark:hover:text-stone-100 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 text-center gap-2 mb-2 text-[10px] font-black uppercase text-stone-400 tracking-wider">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} className="aspect-square" />;
              
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === todayStr;
              const hasActivity = allCalendarItems.some(a => a.date === day.dateStr);
              const hasMissed = batchActivities.some(a => a.date === day.dateStr && day.dateStr < todayStr && !a.completed);
              
              let cellBg = 'bg-stone-50/50 hover:bg-stone-100/70 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/60';
              if (isSelected) cellBg = 'bg-primary text-white ring-2 ring-emerald-500/20';
              else if (isToday) cellBg = 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
              
              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleSelectDate(day.dateStr)}
                  className={`aspect-square flex flex-col justify-between p-2 rounded-xl transition-all cursor-pointer select-none relative ${cellBg}`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-stone-800 dark:text-stone-200'}`}>
                    {day.dayNum}
                  </span>
                  
                  {/* Indicators for tasks & notes */}
                  <div className="flex gap-1 justify-center mt-1">
                    {hasActivity && (
                      hasMissed ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                      )
                    )}
                    {dateNotes[day.dateStr] && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info Panel (Right 1 col) */}
        <div className="space-y-6">
          {/* Selected Date Summary */}
          <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 shadow-sm space-y-4">
            <div>
              <span className="text-[9px] font-black text-stone-400 dark:text-emerald-400 uppercase tracking-widest block">Selected Date</span>
              <h3 className="text-sm font-black text-stone-800 dark:text-stone-100 mt-0.5">
                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
            </div>

            {/* Date Notes Section */}
            <div className="pt-3 border-t border-borders dark:border-emerald-950/10 space-y-2">
              <span className="text-[9px] font-black text-stone-400 dark:text-emerald-400 uppercase tracking-widest block">
                Farmer Notes
              </span>
              
              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    placeholder="Write a note for this date..."
                    rows={2}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleSaveNote(editingNoteText);
                        setIsEditingNote(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-[10px] shadow-sm transition-all"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNote(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-borders text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-900 font-bold text-[10px] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : dateNotes[selectedDate] ? (
                <div className="bg-stone-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-borders/60 dark:border-emerald-950/10 relative">
                  <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed font-semibold">
                    {dateNotes[selectedDate]}
                  </p>
                  <button
                    onClick={() => {
                      setEditingNoteText(dateNotes[selectedDate]);
                      setIsEditingNote(true);
                    }}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-2 block"
                  >
                    Edit Note
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingNoteText('');
                    setIsEditingNote(true);
                  }}
                  className="w-full py-2 rounded-xl border border-dashed border-borders hover:bg-stone-50 dark:hover:bg-zinc-900/30 text-stone-500 dark:text-stone-400 font-bold text-xs transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Note for this Date
                </button>
              )}
            </div>            <div className="space-y-3 pt-3 border-t border-borders dark:border-emerald-950/10">
              {allCalendarItems.filter(a => a.date === selectedDate).length === 0 ? (
                <p className="text-xs text-stone-400 italic">No activities or events logged for this date.</p>
              ) : (
                allCalendarItems.filter(a => a.date === selectedDate).map(act => (
                  <div key={act.id} className="border border-borders/50 dark:border-emerald-950/20 p-3.5 rounded-xl flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider flex items-center gap-1">
                        <Droplet className={`h-3 w-3 ${act.isLoggedEvent ? 'text-blue-500' : 'text-primary'}`} />
                        {act.type} {act.isLoggedEvent && '(Logged Event)'}
                      </span>
                      <p className="text-xs font-bold text-stone-850 dark:text-stone-200 leading-normal">{act.notes}</p>
                      {act.isLoggedEvent ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                          <CheckCircle2 className="h-3 w-3" />
                          Logged & Verified (Ledger)
                        </span>
                      ) : act.completed ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </span>
                      ) : act.date < todayStr ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-500 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                          <AlertTriangle className="h-3 w-3" />
                          Missed (Affects Trust Score)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                          <Clock className="h-3 w-3" />
                          Scheduled
                        </span>
                      )}
                    </div>
                    
                    {!act.completed && !act.isLoggedEvent && (
                      <div className="flex gap-1.5 self-center">
                        <button
                          onClick={() => setEditingTask(act)}
                          className="px-2 py-1.5 text-[10px] font-bold border border-borders text-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCompleteTask(act.id)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-primary text-white rounded-lg hover:bg-primary/95 transition-all shadow-sm"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-stone-850 border border-borders dark:border-emerald-950/20 w-full max-w-md rounded-[24px] p-6 shadow-xl relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-6">
                <Sprout className="h-5 w-5 text-emerald-600" />
                Schedule Crop Task
              </h3>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Activity Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    <option value="Watering">Watering</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pesticide">Pesticide</option>
                    <option value="Harvest">Harvest</option>
                    <option value="Custom Task">Custom Task</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => handleSelectDate(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Notes / Details</label>
                  <textarea
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter details like volume, quantity, compound used, or instructions..."
                    rows={3}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all mt-4"
                >
                  Schedule Crop Activity
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-stone-850 border border-borders dark:border-emerald-950/20 w-full max-w-md rounded-[24px] p-6 shadow-xl relative"
            >
              <button 
                onClick={() => setEditingTask(null)}
                className="absolute top-4 right-4 p-1 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Edit Scheduled Task
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Activity Type</label>
                  <select
                    value={editingTask.type}
                    onChange={(e) => setEditingTask({ ...editingTask, type: e.target.value })}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    <option value="Watering">Watering</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pesticide">Pesticide</option>
                    <option value="Harvest">Harvest</option>
                    <option value="Custom Task">Custom Task</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Notes / Details</label>
                  <textarea
                    required
                    value={editingTask.notes}
                    onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                    placeholder="Enter details..."
                    rows={3}
                    className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setScheduledActivities(prev => prev.map(a => a.id === editingTask.id ? editingTask : a));
                      addNotification("Task Updated", "Scheduled activity successfully updated.", "success");
                      setEditingTask(null);
                    }}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduledActivities(prev => prev.filter(a => a.id !== editingTask.id));
                      addNotification("Task Deleted", "Scheduled activity deleted.", "warning");
                      setEditingTask(null);
                    }}
                    className="py-3 px-4 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all font-bold text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
