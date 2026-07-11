import { API_BASE } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  File, 
  Eye, 
  Trash2, 
  X, 
  ShieldCheck, 
  Download,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function GeneralReports() {
  const { setCurrentView } = useFarm();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        setErrorMsg('Failed to load reports from server.');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setErrorMsg('Cannot connect to the reports server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

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

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File ${file.name} is too large. Max size is 5MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Content = e.target.result;
      
      // Determine file category type
      let reportType = 'Document';
      if (file.type.includes('pdf')) {
        reportType = 'PDF';
      } else if (file.type.includes('image')) {
        reportType = 'Image';
      } else if (file.type.includes('csv') || file.name.endsWith('.csv')) {
        reportType = 'CSV';
      } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.type.includes('word') || file.type.includes('officedocument')) {
        reportType = 'Word';
      }

      try {
        const res = await fetch(`${API_BASE}/api/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            type: reportType,
            content: base64Content
          }),
        });

        if (res.ok) {
          setSuccessMsg(`Successfully uploaded "${file.name}"!`);
          fetchReports();
          setTimeout(() => setSuccessMsg(''), 4000);
        } else {
          setErrorMsg('Failed to upload report to server.');
        }
      } catch (err) {
        console.error('Error uploading report:', err);
        setErrorMsg('Server connection lost during upload.');
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg(`Report deleted successfully.`);
        fetchReports();
        if (previewReport && previewReport.id === id) {
          setPreviewReport(null);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Failed to delete report.');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setErrorMsg('Error connecting to backend.');
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'Image':
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case 'CSV':
        return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
      case 'Word':
        return <FileText className="h-6 w-6 text-indigo-500" />;
      default:
        return <File className="h-6 w-6 text-stone-500" />;
    }
  };

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render content preview inside the Modal
  const renderPreviewContent = (report) => {
    const { type, content, name } = report;
    
    if (type === 'Image') {
      return (
        <div className="flex justify-center p-4 bg-stone-100 rounded-2xl overflow-hidden max-h-[60vh]">
          <img src={content} alt={name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
        </div>
      );
    }

    if (type === 'PDF') {
      return (
        <div className="w-full h-[60vh] bg-stone-100 rounded-2xl overflow-hidden border border-borders relative">
          <object data={content} type="application/pdf" className="w-full h-full rounded-2xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-12 w-12 text-stone-400 mb-2" />
              <p className="text-sm font-extrabold text-stone-900">PDF Preview Not Rendered by Browser</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">You can download the raw document below to view it locally.</p>
              <a 
                href={content} 
                download={name}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                <Download className="h-4 w-4" />
                Download PDF Document
              </a>
            </div>
          </object>
        </div>
      );
    }

    if (type === 'CSV') {
      try {
        // Simple CSV parser for display
        const rawString = atob(content.split(',')[1]);
        const rows = rawString.split('\n').filter(line => line.trim() !== '');
        
        return (
          <div className="w-full max-h-[60vh] overflow-auto bg-stone-50 rounded-2xl border border-borders p-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-borders bg-stone-100/80">
                  {rows[0]?.split(',').map((header, idx) => (
                    <th key={idx} className="p-2.5 font-extrabold text-stone-600 uppercase tracking-wider">{header.replace(/"/g, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borders bg-white">
                {rows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-stone-50/50">
                    {row.split(',').map((cell, cellIdx) => (
                      <td key={cellIdx} className="p-2.5 font-medium text-stone-800">{cell.replace(/"/g, '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } catch (err) {
        return (
          <div className="p-8 text-center bg-stone-100 rounded-2xl border border-borders">
            <p className="text-xs text-stone-500">Failed to render parsed CSV. File may contain complex characters.</p>
            <a href={content} download={name} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-xs rounded-xl font-bold">
              <Download className="h-4 w-4" /> Download Raw CSV
            </a>
          </div>
        );
      }
    }

    // Default Word / Doc fallback
    return (
      <div className="p-12 text-center bg-stone-50 rounded-2xl border border-dashed border-borders flex flex-col items-center justify-center">
        <File className="h-14 w-14 text-stone-400 mb-3" />
        <h4 className="font-extrabold text-sm text-stone-850">Document Viewer Fallback</h4>
        <p className="text-xs text-stone-500 max-w-sm mt-1 mb-6 leading-relaxed">
          Microsoft Word documents (.doc/.docx) and other formats cannot be viewed inline directly. Please download the document file below to open it on your device.
        </p>
        <a 
          href={content} 
          download={name}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          <Download className="h-4 w-4" />
          Download Document File
        </a>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Back to Dashboard */}
      <button
        onClick={() => setCurrentView('farmer-dashboard')}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-850 text-xs font-bold transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            General Reports Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Upload, browse, delete, and preview audit reports, testing sheets, and certificate documents.
          </p>
        </div>
      </div>

      {/* Alert Toasts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4.5 w-4.5 text-red-600" /> {errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="h-4.5 w-4.5" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle className="h-4.5 w-4.5 text-emerald-600 animate-bounce" /> {successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="h-4.5 w-4.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Drag & Drop Dropzone */}
        <div className="lg:col-span-1">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all h-full min-h-[300px] flex flex-col justify-center items-center gap-4 cursor-pointer ${
              dragActive 
                ? 'border-primary bg-primary/5 text-primary scale-[1.01]' 
                : 'border-borders hover:border-primary hover:bg-stone-50/50 text-stone-500 bg-white dark:bg-zinc-950/20'
            }`}
          >
            <input 
              type="file" 
              id="file-upload-input" 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg,.csv,.doc,.docx"
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-primary/10 text-primary shadow-sm hover:scale-105 transition-all">
                <UploadCloud className="h-8 w-8" />
              </div>
              <span className="text-xs font-extrabold text-stone-850 dark:text-stone-200 block">
                Drag & Drop Document Here
              </span>
              <span className="text-[10px] text-stone-400">
                Or <span className="text-primary font-bold underline">browse local files</span>
              </span>
              <span className="text-[9px] text-stone-400 mt-2 block max-w-[180px] leading-relaxed">
                Supports PDF, JPG, PNG, CSV, and Word DOC files (Max 5MB)
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Reports Browser List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900/30 border border-borders dark:border-emerald-950/20 p-5 rounded-[24px] shadow-sm space-y-4">
            
            {/* Search filter bar */}
            <div className="flex justify-between items-center gap-3">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Uploaded Records Library
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input 
                  type="text"
                  placeholder="Filter reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-borders rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-16 text-center text-xs text-stone-400 font-bold">
                Loading database library logs...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-borders rounded-2xl text-stone-400 text-xs">
                No reports found in the database. Drag one in to start!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-800 text-[10px] text-stone-455 uppercase tracking-widest font-extrabold">
                      <th className="pb-3 pr-2">Report Name</th>
                      <th className="pb-3 px-2">Uploaded</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-transparent">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 pr-2 font-extrabold text-stone-850 dark:text-stone-200 max-w-[200px] truncate">
                          <div className="flex items-center gap-2">
                            {getFileIcon(report.type)}
                            <span className="truncate">{report.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-stone-500 whitespace-nowrap">
                          {new Date(report.uploadDate).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                            report.type === 'PDF' 
                              ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                              : report.type === 'Image' 
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                              : report.type === 'CSV' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                          }`}>
                            {report.type}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewReport(report)}
                              className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 transition-all"
                              title="View Document"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(report.id, report.name)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-600 dark:text-red-400 transition-all"
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
        </div>

      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {previewReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-stone-900 border border-borders rounded-[30px] shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-borders flex justify-between items-center bg-stone-50 dark:bg-zinc-950/25">
                <div className="flex items-center gap-2">
                  {getFileIcon(previewReport.type)}
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 max-w-md truncate">
                      {previewReport.name}
                    </h3>
                    <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                      Uploaded on: {new Date(previewReport.uploadDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-500 transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {renderPreviewContent(previewReport)}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-borders bg-stone-50 dark:bg-zinc-950/25 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  SHA-256 Verified Integrity Check
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewReport(null)}
                    className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 font-bold"
                  >
                    Close
                  </button>
                  <a
                    href={previewReport.content}
                    download={previewReport.name}
                    className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
