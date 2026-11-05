import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, QrCode, Copy, Check, ExternalLink } from 'lucide-react';

export const QuickQRModal: React.FC = () => {
  const { activeModal, closeQrModal, qrModalData } = useStore();
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'quick_qr' || !qrModalData) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(qrModalData.qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 relative text-center animate-in zoom-in-95 duration-150">
        <button
          onClick={closeQrModal}
          className="absolute top-3.5 right-3.5 px-2.5 py-1 bg-slate-100 hover:bg-rose-600 text-slate-600 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            DYNAMIC QR CODE
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 px-2">
          {qrModalData.title}
        </h3>

        {qrModalData.subtitle && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {qrModalData.subtitle}
          </p>
        )}

        {/* QR Image Canvas */}
        <div className="my-4 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-inner max-w-full box-border">
          {qrModalData.qrImage ? (
            <img
              src={qrModalData.qrImage}
              alt="Generated QR Code"
              className="w-44 h-44 sm:w-52 sm:h-52 max-w-full mx-auto bg-white p-1 rounded-lg object-contain"
            />
          ) : (
            <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center text-xs text-slate-400">
              Generating QR...
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Point any Android / iPhone camera or Google Lens to open link.
        </p>

        {/* Copy / Close actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
          </button>
          <button
            onClick={closeQrModal}
            className="flex items-center justify-center gap-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
