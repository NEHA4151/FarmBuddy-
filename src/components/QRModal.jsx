import React from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, QrCode, Download, Link2, Copy, Check, ShieldCheck } from 'lucide-react';

export default function QRModal({ isOpen, onClose, batchId }) {
  const { batches, setCurrentView, setCurrentBatchId } = useFarm();
  const [copied, setCopied] = React.useState(false);

  const batch = batches.find(b => b.id === batchId);
  if (!batch) return null;

  const simulateUrl = `${window.location.origin}/traceability/${batchId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(simulateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateScan = () => {
    setCurrentBatchId(batchId);
    setCurrentView('consumer-traceability');
    onClose();
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById(`qr-modal-canvas-${batchId}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${batchId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="w-full max-w-md bg-white border border-borders rounded-[20px] p-6 shadow-xl relative overflow-hidden z-10"
          >
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <QrCode className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-lg">Verified Product Log</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Crop Info */}
            <div className="p-4 rounded-xl bg-stone-50 border border-borders mb-6 text-center">
              <span className="text-[10px] tracking-wider uppercase font-bold text-primary block mb-1">
                Verified Crop Record
              </span>
              <h4 className="font-bold text-base text-stone-900">
                {batch.cropType}
              </h4>
              <p className="text-xs text-stone-500 font-mono mt-1 select-all">
                ID: {batch.id}
              </p>
              
              <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                <ShieldCheck className="h-3 w-3" />
                Verification Status: Secure
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="p-4 bg-white rounded-2xl border border-borders shadow-sm flex items-center justify-center">
                <QRCodeCanvas
                  id={`qr-modal-canvas-${batchId}`}
                  value={simulateUrl}
                  size={180}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <p className="text-[10px] text-stone-400 font-semibold mt-3 text-center">
                Scan with mobile camera to check verified history logs
              </p>
            </div>

            {/* Simulated Link Options */}
            <div className="space-y-3">
              <button
                onClick={handleSimulateScan}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all hover:-translate-y-0.5"
              >
                <Link2 className="h-4 w-4" />
                Simulate QR Scan (Open Consumer Portal)
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-[11px] transition-colors border border-borders"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-primary" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Trace URL
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors border border-borders"
                  title="Download Image"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
