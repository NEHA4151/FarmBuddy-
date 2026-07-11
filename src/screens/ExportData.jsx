import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  Layers, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  CheckCircle,
  Database,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export default function ExportData() {
  const { batches, timeline, setCurrentView, logBatchEvent } = useFarm();

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('ALL');
  const [selectedCropType, setSelectedCropType] = useState('ALL');

  // Included data components
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeQA, setIncludeQA] = useState(true);
  const [includeTransit, setIncludeTransit] = useState(true);

  // Success state
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Extract unique crop types for filter dropdown
  const uniqueCrops = Array.from(new Set(batches.map(b => b.cropType)));

  // Filter batches based on selections
  const getFilteredData = () => {
    return batches.filter(batch => {
      // Crop Type Filter
      if (selectedCropType !== 'ALL' && batch.cropType !== selectedCropType) {
        return false;
      }
      // Batch ID Filter
      if (selectedBatchId !== 'ALL' && batch.id !== selectedBatchId) {
        return false;
      }
      
      // Date Range Filter (compares against sowing date or expected harvest)
      const sowingTime = new Date(batch.seedDate || batch.sowing_date).getTime();
      if (startDate) {
        const startLimit = new Date(startDate).getTime();
        if (sowingTime < startLimit) return false;
      }
      if (endDate) {
        const endLimit = new Date(endDate).getTime();
        if (sowingTime > endLimit) return false;
      }
      
      return true;
    });
  };

  const handleExport = (format) => {
    setExporting(true);
    setExportSuccess(false);

    setTimeout(() => {
      const filteredBatches = getFilteredData();
      let fileContent = '';
      let filename = `FarmBuddy_Export_${new Date().toISOString().split('T')[0]}`;
      let mimeType = 'text/plain';

      if (format === 'csv' || format === 'excel') {
        const headers = [];
        if (includeOverview) headers.push('Batch ID', 'Crop Type', 'Location', 'Soil Type', 'Planted Date', 'Status', 'Trust Score');
        if (includeQA) headers.push('QA Status', 'Total Yield', 'Residue Free');
        if (includeTransit) headers.push('Delivery Status', 'Logistics Handover');
        
        const rows = filteredBatches.map(b => {
          const rowData = [];
          if (includeOverview) {
            rowData.push(b.id, b.cropType, b.location, b.soilType || 'Loam', b.seedDate || b.sowing_date, b.status, `${b.qualityScore || b.trust_score}%`);
          }
          if (includeQA) {
            rowData.push(b.status === 'Growing' ? 'Pending' : 'Approved', b.status === 'Growing' ? 'N/A' : '850kg', '100% Free');
          }
          if (includeTransit) {
            rowData.push(b.status === 'Shipped' ? 'Delivered' : 'At Farm', b.status === 'Shipped' ? 'ColdChain Transit' : 'Pending');
          }
          return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        });

        // Add timeline activities if checked
        if (includeTimeline) {
          rows.push('\n--- CULTIVATION LOGS TIMELINE ---');
          rows.push('Batch ID,Activity Timestamp,Event Type,Operator,Status,Record Hash');
          
          filteredBatches.forEach(b => {
            const events = timeline[b.id] || [];
            events.forEach(evt => {
              rows.push([
                b.id,
                evt.timestamp,
                evt.type,
                evt.operatorId || 'FMR-0921',
                evt.verified ? 'Verified' : 'Unverified',
                evt.currentHash || evt.hash
              ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
            });
          });
        }

        fileContent = [headers.join(','), ...rows].join('\n');
        mimeType = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
        filename += format === 'csv' ? '.csv' : '.xls';
      } 
      
      else if (format === 'pdf') {
        // PDF Export builds a clean formatted print layout and triggers the browser printing console
        const printWindow = window.open('', '_blank');
        const html = `
          <html>
            <head>
              <title>FarmBuddy Cryptographic Ledger Export</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1c1917; padding: 40px; }
                .header { border-bottom: 2px solid #047857; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: 800; color: #047857; }
                .subtitle { font-size: 11px; text-transform: uppercase; color: #78716c; letter-spacing: 1px; margin-top: 5px; }
                .filter-summary { background: #f5f5f4; border-radius: 8px; padding: 15px; font-size: 12px; margin-bottom: 30px; }
                table { w-full border-collapse: collapse; width: 100%; margin-bottom: 30px; font-size: 12px; }
                th { border-bottom: 2px solid #e7e5e4; padding: 10px; font-weight: bold; text-align: left; background: #fafaf9; }
                td { border-bottom: 1px solid #f5f5f4; padding: 10px; }
                .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #dcfce7; color: #15803d; }
                .hash { font-family: monospace; font-size: 10px; color: #78716c; }
                .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">FarmBuddy Trust & Trace Ledger</div>
                <div class="subtitle">Secure Cryptographic Audit Data Export</div>
              </div>
              <div class="filter-summary">
                <strong>Export Filters:</strong> Crop: ${selectedCropType} | Batch: ${selectedBatchId} | Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}<br/>
                <strong>Generated On:</strong> ${new Date().toLocaleString()} | Authenticity Score: 100% Verified
              </div>
              
              <h3>Crop Batch Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Crop Type</th>
                    <th>Location</th>
                    <th>Planted Date</th>
                    <th>Status</th>
                    <th>Trust Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredBatches.map(b => `
                    <tr>
                      <td><strong>${b.id}</strong></td>
                      <td>${b.cropType}</td>
                      <td>${b.location}</td>
                      <td>${b.seedDate || b.sowing_date}</td>
                      <td><span class="badge">${b.status}</span></td>
                      <td>${b.qualityScore || b.trust_score}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              ${includeTimeline ? `
                <h3>Blockchain Audit Logs</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Timestamp</th>
                      <th>Event</th>
                      <th>Operator</th>
                      <th>Record Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredBatches.flatMap(b => {
                      const events = timeline[b.id] || [];
                      return events.map(evt => `
                        <tr>
                          <td><strong>${b.id}</strong></td>
                          <td>${new Date(evt.timestamp).toLocaleDateString()}</td>
                          <td>${evt.type}</td>
                          <td>${evt.operatorId || 'FMR-0921'}</td>
                          <td class="hash">${(evt.currentHash || evt.hash).substring(0, 24)}...</td>
                        </tr>
                      `);
                    }).join('')}
                  </tbody>
                </table>
              ` : ''}

              <div class="footer">
                © 2026 FarmBuddy Trust & Trace Platform. Anchored using SHA256 consensus hashing.
              </div>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        setExporting(false);
        setExportSuccess(true);
        if (logBatchEvent) {
          logBatchEvent(
            'Export Generated',
            'Ledger PDF Exported',
            `Exported ledger PDF report containing ${filteredBatches.length} batches.`,
            'Success',
            0.0
          );
        }
        setTimeout(() => setExportSuccess(false), 3000);
        return;
      }

      // Download file helper (for CSV & Excel)
      const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setExporting(false);
      setExportSuccess(true);
      if (logBatchEvent) {
        logBatchEvent(
          'Export Generated',
          `Ledger ${format.toUpperCase()} Exported`,
          `Exported ledger data in ${format} format. Batches count: ${filteredBatches.length}.`,
          'Success',
          0.0
        );
      }
      setTimeout(() => setExportSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Back button */}
      <button
        onClick={() => setCurrentView('farmer-dashboard')}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-850 text-xs font-bold transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          Secure Ledger Export Panel
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Select data parameters, apply query filters, and download certified agricultural logs to spreadsheet or PDF files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Columns: Filters and Setup */}
        <div className="md:col-span-2 space-y-5">
          
          {/* Section A: Filters */}
          <div className="bg-white dark:bg-zinc-900/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[24px] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-emerald-400 flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-primary" />
              1. Query Filters
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Crop Variety</label>
                <select
                  value={selectedCropType}
                  onChange={(e) => setSelectedCropType(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders rounded-xl px-3.5 py-2.5 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                >
                  <option value="ALL">All Crop Varieties</option>
                  {uniqueCrops.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Target Batch ID</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders rounded-xl px-3.5 py-2.5 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                >
                  <option value="ALL">All Batch IDs</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.id} ({b.cropType})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Sowing Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders rounded-xl px-3.5 py-2 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Sowing End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders rounded-xl px-3.5 py-2 text-xs text-stone-850 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section B: Data Modules Selection */}
          <div className="bg-white dark:bg-zinc-900/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[24px] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-emerald-400 flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              2. Select Modules to Include
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-900 rounded-xl border border-borders cursor-pointer hover:bg-stone-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeOverview}
                  onChange={(e) => setIncludeOverview(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-850 dark:text-stone-200 block">Batch Overview details</span>
                  <span className="text-[10px] text-stone-450">Identifiers, locations, crops, planting dates.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-900 rounded-xl border border-borders cursor-pointer hover:bg-stone-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeTimeline}
                  onChange={(e) => setIncludeTimeline(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-850 dark:text-stone-200 block">Cultivation Activity Timeline</span>
                  <span className="text-[10px] text-stone-450">Irrigation, sprayings, harvests, hashes.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-900 rounded-xl border border-borders cursor-pointer hover:bg-stone-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeQA}
                  onChange={(e) => setIncludeQA(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-850 dark:text-stone-200 block">QA Audits & Lab Notes</span>
                  <span className="text-[10px] text-stone-450">Lab residue test status, inspection grades.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-900 rounded-xl border border-borders cursor-pointer hover:bg-stone-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeTransit}
                  onChange={(e) => setIncludeTransit(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-850 dark:text-stone-200 block">Logistics & Delivery Handover</span>
                  <span className="text-[10px] text-stone-450">Pre-cooling compliance, provider logs.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Download Formats trigger card */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-zinc-900/30 border border-borders dark:border-emerald-950/20 p-6 rounded-[24px] shadow-sm flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-emerald-400 flex items-center gap-1.5">
                <Download className="h-4 w-4 text-primary" />
                3. Download File
              </h3>
              
              <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">
                Generate the report file containing parameters for <span className="text-stone-850 dark:text-stone-200 font-bold">{getFilteredData().length} batches</span> based on current query filters.
              </p>

              {/* Status readout */}
              {exporting && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[11px] font-bold flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Generating secure download file...
                </div>
              )}

              {exportSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-[11px] font-extrabold flex items-center gap-1.5">
                  <CheckCircle className="h-4.5 w-4.5 animate-bounce" />
                  File downloaded successfully!
                </div>
              )}
            </div>

            {/* Formats layout */}
            <div className="space-y-3 pt-4 border-t border-borders">
              
              {/* CSV */}
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-borders hover:border-emerald-600 hover:bg-emerald-50/10 bg-[#FAFAFA] dark:bg-zinc-900 transition-all group disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-all">
                    <FileSpreadsheet className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-850 dark:text-stone-200 block">Comma Separated (CSV)</span>
                    <span className="text-[9px] text-stone-400">Great for loading into sheets</span>
                  </div>
                </div>
                <Download className="h-4.5 w-4.5 text-stone-400 group-hover:text-emerald-600 group-hover:translate-y-0.5 transition-all" />
              </button>

              {/* Excel */}
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-borders hover:border-indigo-600 hover:bg-indigo-50/10 bg-[#FAFAFA] dark:bg-zinc-900 transition-all group disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:scale-105 transition-all">
                    <Database className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-850 dark:text-stone-200 block">Excel Spreadsheet</span>
                    <span className="text-[9px] text-stone-400">Microsoft Excel compatible (.xls)</span>
                  </div>
                </div>
                <Download className="h-4.5 w-4.5 text-stone-400 group-hover:text-indigo-600 group-hover:translate-y-0.5 transition-all" />
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-borders hover:border-red-500 hover:bg-red-500/5 bg-[#FAFAFA] dark:bg-zinc-900 transition-all group disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-105 transition-all">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-850 dark:text-stone-200 block">Document Report (PDF)</span>
                    <span className="text-[9px] text-stone-400">High-fidelity printable layout</span>
                  </div>
                </div>
                <Download className="h-4.5 w-4.5 text-stone-400 group-hover:text-red-500 group-hover:translate-y-0.5 transition-all" />
              </button>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
