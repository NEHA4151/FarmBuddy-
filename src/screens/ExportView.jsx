import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File, 
  CheckCircle,
  Database,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ExportView() {
  const { currentBatchId, batches, timeline, scheduledActivities, reports, calculateTrustScore, logBatchEvent } = useFarm();
  
  const batch = batches.find(b => b.id === currentBatchId);

  // States
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeSchedules, setIncludeSchedules] = useState(true);
  const [includeTrustScore, setIncludeTrustScore] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!batch) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a Crop Batch first to export records.
      </div>
    );
  }

  const handleDownload = (format) => {
    setExporting(true);
    setExportSuccess(false);

    setTimeout(() => {
      let fileContent = '';
      let mimeType = 'text/plain';
      let extension = 'txt';
      const score = calculateTrustScore(batch.id);

      if (format === 'csv' || format === 'excel') {
        mimeType = 'text/csv';
        extension = format === 'csv' ? 'csv' : 'xls';
        
        // 1. Overview Section
        if (includeOverview) {
          fileContent += '--- CROP BATCH OVERVIEW ---\n';
          fileContent += 'Batch ID,Crop Variety,Location,Planted Date,Status,Quality Rating\n';
          fileContent += `"${batch.id}","${batch.cropType}","${batch.location}","${batch.seedDate}","${batch.status}","${batch.qualityScore}%"\n\n`;
        }

        // 2. Trust Score Section
        if (includeTrustScore) {
          fileContent += '--- TRUST SCORE AUDIT ---\n';
          fileContent += 'Current Trust Rating,Score Category,Audited Date\n';
          fileContent += `"${score}","${score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : 'Moderate Risk'}","2026-06-25"\n\n`;
        }

        // 3. Calendar Activities
        if (includeSchedules) {
          fileContent += '--- SCHEDULED CALENDAR ACTIVITIES ---\n';
          fileContent += 'Date,Activity Type,Notes,Completed,Completion Date\n';
          const schedules = scheduledActivities.filter(s => s.batchId === batch.id);
          schedules.forEach(s => {
            fileContent += `"${s.date}","${s.type}","${s.notes || ''}","${s.completed ? 'YES' : 'NO'}","${s.completedAt || ''}"\n`;
          });
          fileContent += '\n';
        }

        // 4. Timeline Logs
        if (includeTimeline) {
          fileContent += '--- BLOCKCHAIN TIMELINE TRANSACTION LOGS ---\n';
          fileContent += 'Event Date,Activity Type,Payload Details,Record Hash\n';
          const logs = timeline[batch.id] || [];
          logs.forEach(l => {
            let detailsStr = '';
            if (typeof l.payload === 'object') {
              detailsStr = JSON.stringify(l.payload).replace(/"/g, '""');
            } else {
              detailsStr = l.payload;
            }
            fileContent += `"${l.timestamp.split('T')[0]}","${l.type}","${detailsStr}","${l.currentHash}"\n`;
          });
        }
      } else {
        // PDF / Plain Text Document Format
        mimeType = 'text/plain';
        extension = 'txt';
        
        fileContent += `==============================================\n`;
        fileContent += `FARMBUDDY AGRONOMIC CROP PASSPORT: ${batch.id}\n`;
        fileContent += `==============================================\n\n`;

        if (includeOverview) {
          fileContent += `[CROP OVERVIEW]\n`;
          fileContent += `- Crop ID: ${batch.id}\n`;
          fileContent += `- Variety: ${batch.cropType}\n`;
          fileContent += `- parcel Location: ${batch.location}\n`;
          fileContent += `- Date Planted: ${batch.seedDate}\n`;
          fileContent += `- Cultivation Status: ${batch.status}\n`;
          fileContent += `- Quality Rating: ${batch.qualityScore || 94}%\n\n`;
        }

        if (includeTrustScore) {
          fileContent += `[TRUST RATING AUDIT]\n`;
          fileContent += `- Verification Score: ${score}/100\n`;
          fileContent += `- Audit category: ${score >= 90 ? 'Excellent Trust' : score >= 75 ? 'Good' : 'Moderate Risk'}\n`;
          fileContent += `- Carbon footprint: ${batch.carbonFootprint || 'N/A'}\n`;
          fileContent += `- Water intensity: ${batch.waterUsage || 'N/A'}\n\n`;
        }

        if (includeSchedules) {
          fileContent += `[CALENDAR CYCLE ENTRIES]\n`;
          const schedules = scheduledActivities.filter(s => s.batchId === batch.id);
          schedules.forEach(s => {
            fileContent += `* [${s.date}] ${s.type} - Completed: ${s.completed ? 'Yes' : 'No'} (${s.notes || ''})\n`;
          });
          fileContent += `\n`;
        }

        if (includeTimeline) {
          fileContent += `[BLOCKCHAIN LEDGER INTEGRITY LOGS]\n`;
          const logs = timeline[batch.id] || [];
          logs.forEach(l => {
            let details = typeof l.payload === 'object' ? JSON.stringify(l.payload) : l.payload;
            fileContent += `* [${l.timestamp.split('T')[0]}] ${l.type} : ${details}\n  Hash: ${l.currentHash}\n`;
          });
        }
      }

      // Trigger download
      const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FarmBuddy_Report_${batch.id}_${new Date().toISOString().split('T')[0]}.${extension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExporting(false);
      setExportSuccess(true);
      if (logBatchEvent) {
        logBatchEvent(
          'Export Generated',
          'Crop Passport Exported',
          `Successfully exported report for batch ${batch.id} in ${format} format.`,
          'Success',
          0.0
        );
      }
      confetti({ particleCount: 50, spread: 40 });
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-borders dark:border-emerald-950/20 pb-4">
        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
          Workspace: {batch.id} • {batch.cropType}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-1">
          <Download className="h-7 w-7 text-emerald-600" />
          Export Crop Passport & Logs
        </h1>
      </div>

      <div className="bg-white dark:bg-zinc-950/30 border border-borders dark:border-emerald-950/20 rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-stone-400 dark:text-emerald-400 tracking-wider">
            Select Data Components to Include
          </h3>
          <p className="text-[11px] text-stone-500 font-medium">
            Customize which parts of the agronomic registry to compile into the crop passport.
          </p>
        </div>

        {/* Checkbox Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-borders/50 dark:border-emerald-950/20 py-4">
          <label className="flex items-center gap-3 p-3 bg-stone-50/50 dark:bg-zinc-900/30 rounded-xl border border-borders/40 dark:border-emerald-950/10 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOverview}
              onChange={(e) => setIncludeOverview(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">Crop Overview</span>
              <span className="text-[10px] text-stone-400">Varieties, Parcel location, planted dates.</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50/50 dark:bg-zinc-900/30 rounded-xl border border-borders/40 dark:border-emerald-950/10 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTrustScore}
              onChange={(e) => setIncludeTrustScore(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">Trust & Audit Score</span>
              <span className="text-[10px] text-stone-400">Trust ranking, carbon footprint, water metrics.</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50/50 dark:bg-zinc-900/30 rounded-xl border border-borders/40 dark:border-emerald-950/10 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSchedules}
              onChange={(e) => setIncludeSchedules(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">Calendar Schedules</span>
              <span className="text-[10px] text-stone-400">Irrigation, fertilizing cycles.</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50/50 dark:bg-zinc-900/30 rounded-xl border border-borders/40 dark:border-emerald-950/10 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTimeline}
              onChange={(e) => setIncludeTimeline(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">Timeline Transaction Logs</span>
              <span className="text-[10px] text-stone-400">Cryptographic SHA-256 hashes of logs.</span>
            </div>
          </label>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-stone-400 dark:text-emerald-400 tracking-wider">
            Select Export File Format
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleDownload('csv')}
              disabled={exporting}
              className="flex items-center justify-center gap-2 p-3 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl text-stone-800 dark:text-stone-200 font-bold text-xs transition-all"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
              Download CSV
            </button>
            <button
              onClick={() => handleDownload('excel')}
              disabled={exporting}
              className="flex items-center justify-center gap-2 p-3 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl text-stone-800 dark:text-stone-200 font-bold text-xs transition-all"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-blue-500" />
              Download Excel
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={exporting}
              className="flex items-center justify-center gap-2 p-3 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-900 border border-borders dark:border-emerald-950/40 rounded-xl text-stone-800 dark:text-stone-200 font-bold text-xs transition-all"
            >
              <FileText className="h-4.5 w-4.5 text-red-500" />
              Download PDF / Doc
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-xs font-bold justify-center">
            <CheckCircle className="h-5 w-5" />
            Report Exported and Downloaded Successfully!
          </div>
        )}
      </div>
    </div>
  );
}
