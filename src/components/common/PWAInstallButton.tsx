import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2, Sparkles, QrCode, Copy, Check, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  variant?: 'header' | 'banner' | 'card' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'qr'>('android');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Set default tab based on user agent
  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, [isIOS]);

  // Generate QR code of current app URL
  useEffect(() => {
    if (showGuideModal) {
      const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://javed-electronics.in';
      QRCode.toDataURL(appUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [showGuideModal]);

  // If already running inside installed standalone PWA app, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      // Show guided instructions for mobile phone installation & QR code
      setShowGuideModal(true);
    }
  };

  const handleCopyLink = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (appUrl) {
      navigator.clipboard?.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer ${className}`}
          title="Install Javed Electronics App on your mobile phone"
        >
          <Download className="w-3.5 h-3.5 shrink-0 group-hover:translate-y-0.5 transition-transform" />
          <span className="hidden xs:inline sm:inline">Install App</span>
          <span className="xs:hidden sm:hidden">Install</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install on Mobile</span>
        </button>
      )}

      {variant === 'card' && (
        <div className={`p-4 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl shadow-lg border border-blue-800 ${className}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Install Official Mobile App</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">PWA</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  1-tap access on your home screen with fast offline catalog & Lucknow order dispatch.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              Install App
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>App installed successfully! Look for Javed Electronics on your home screen.</span>
        </div>
      )}

      {/* Guided Install Modal for Mobile Phone */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 relative my-auto animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with App Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-950 p-2 shadow-md shrink-0 flex items-center justify-center border border-blue-700">
                <img src="/pwa-192x192.png" alt="App Icon" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.2 rounded">
                    MOBILE APP INSTALLATION
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Install Javed Electronics on Mobile
                </h3>
              </div>
            </div>

            {/* Platform Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'android' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Android Phone</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* TAB 1: Android Phone Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Steps for Android (Google Chrome / Edge):</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p className="text-slate-700">
                      Open this store website in <strong>Google Chrome</strong> on your phone.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p className="text-slate-700">
                      Look for the prompt <strong>&quot;Add Javed Electronics to Home screen&quot;</strong> or tap the blue <strong>&quot;Install App&quot;</strong> button.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      3
                    </span>
                    <p className="text-slate-700">
                      If the prompt does not appear automatically, tap the <strong>three dots (⋮)</strong> at the top right of Chrome and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      4
                    </span>
                    <p className="text-slate-700">
                      Tap <strong>Install</strong>. The app icon will appear on your phone home screen and open in full-screen standalone mode!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: iPhone / iPad Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Steps for iPhone & iPad (Safari Browser):</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p className="text-slate-700">
                      Open this store website in <strong>Safari</strong> on your iPhone or iPad.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p className="text-slate-700">
                      Tap the <strong>Share</strong> button (the square with an arrow pointing up <Share2 className="w-3.5 h-3.5 inline text-blue-600" />) at the bottom toolbar.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      3
                    </span>
                    <p className="text-slate-700">
                      Scroll down the menu and tap <strong>&quot;Add to Home Screen&quot;</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-blue-600" />).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      4
                    </span>
                    <p className="text-slate-700">
                      Tap <strong>Add</strong> in the top right. The app will install to your iOS home screen with no App Store needed!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Scan QR Code with Phone */}
            {activeTab === 'qr' && (
              <div className="text-center space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-700 font-bold">
                  Scan this QR Code with your Phone&apos;s Camera:
                </p>

                <div className="p-3 bg-white rounded-xl inline-block shadow-sm border border-slate-200 mx-auto">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan to open on mobile"
                      className="w-48 h-48 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                      Generating QR Code...
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Point any Android camera, iPhone camera, or Google Lens at this code to open the store directly on your phone, then follow the 1-tap install prompt.
                </p>
              </div>
            )}

            {/* Copy Link Action & Highlights */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Store Link Copied!' : 'Copy Store Link to WhatsApp'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>App Perks:</strong> No download wait, works offline, instant 4-hour Lucknow delivery dispatch, and takes under 1MB storage.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
