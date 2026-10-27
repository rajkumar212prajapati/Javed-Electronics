import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X, Smartphone, Zap, ShieldCheck } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('je_pwa_banner_dismissed') === 'true';
      if (!isDismissed && !isInstalled) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, [isInstalled]);

  if (dismissed || isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('je_pwa_banner_dismissed', 'true');
    } catch {}
  };

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-700/50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
              <Zap className="w-4 h-4 fill-slate-950" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-amber-300 mr-1.5 hidden xs:inline">App Available!</span>
              <span className="text-slate-200">
                Install <strong>Javed Electronics App</strong> for 1-tap ordering & offline access.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-slate-900 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Install on iPhone / iPad</h3>
              <button onClick={() => setShowIOSModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <p className="text-slate-600">
              1. Tap <strong>Share</strong> in your Safari browser bar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-1.5 bg-slate-900 text-white rounded-lg font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
