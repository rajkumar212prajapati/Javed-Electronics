import React, { useState, useEffect } from 'react';
import { UserAccount } from '../../types';
import {
  generateTotpCode,
  verifyAdminOtp,
  buildGoogleAuthenticatorUri,
  formatBase32Secret,
  generateRandomBase32Secret,
  ADMIN_EMERGENCY_RECOVERY_CODES,
  cleanBase32Secret,
} from '../../utils/authenticator';
import { generateQrDataUrl } from '../../utils/qrcode';
import {
  QrCode,
  ShieldCheck,
  Smartphone,
  Check,
  Copy,
  Download,
  RefreshCw,
  AlertCircle,
  X,
  ExternalLink,
  Lock,
  CheckCircle2,
  Clock,
  Printer,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface AdminAuthenticatorQrModalProps {
  account: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAccount?: (accountId: string, updates: Partial<UserAccount>) => void;
}

export const AdminAuthenticatorQrModal: React.FC<AdminAuthenticatorQrModalProps> = ({
  account,
  isOpen,
  onClose,
  onUpdateAccount,
}) => {
  const currentSecret = cleanBase32Secret(account.twoFactorSecret || 'JAVE2ELECTRONICSADMINSECRETKEY33');
  const [activeSecret, setActiveSecret] = useState<string>(currentSecret);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [totpData, setTotpData] = useState<{ code: string; secondsRemaining: number }>({
    code: '000000',
    secondsRemaining: 30,
  });
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [testCodeInput, setTestCodeInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'qr_scan' | 'manual_entry' | 'recovery_codes'>('qr_scan');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(account.twoFactorEnabled ?? true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Sync state when account prop changes
  useEffect(() => {
    const sec = cleanBase32Secret(account.twoFactorSecret || 'JAVE2ELECTRONICSADMINSECRETKEY33');
    setActiveSecret(sec);
    setTwoFactorEnabled(account.twoFactorEnabled ?? true);
  }, [account.id, account.twoFactorSecret, account.twoFactorEnabled]);

  // Generate QR Code data URL whenever secret or account changes
  useEffect(() => {
    let isMounted = true;
    const uri = buildGoogleAuthenticatorUri({
      secret: activeSecret,
      accountName: account.email || 'admin@javed-electronics.in',
      issuer: 'Javed Electronics',
    });

    generateQrDataUrl(uri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).then((url) => {
      if (isMounted) {
        setQrDataUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeSecret, account.email]);

  // Synchronized TOTP ticker (updates code & countdown every second)
  useEffect(() => {
    const update = () => {
      setTotpData(generateTotpCode(activeSecret, 30));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSecret]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(activeSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(ADMIN_EMERGENCY_RECOVERY_CODES.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `google-authenticator-qr-${account.role}-${account.email.split('@')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTestVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testCodeInput.trim()) {
      setTestResult({ success: false, message: 'Please enter the 6-digit code shown in Google Authenticator.' });
      return;
    }

    const verification = verifyAdminOtp(testCodeInput, activeSecret);
    if (verification.valid) {
      setTestResult({
        success: true,
        message: 'Google Authenticator verified successfully! Your device is synchronized and ready for 2FA OTP login.',
      });
    } else {
      setTestResult({
        success: false,
        message: 'Code does not match. Ensure your device clock is set to automatic time and try again.',
      });
    }
  };

  const handleRegenerateSecret = () => {
    if (!window.confirm('Regenerating a new secret key will disconnect your existing Google Authenticator app until you scan the new QR code. Proceed?')) {
      return;
    }
    setIsRegenerating(true);
    const newSec = generateRandomBase32Secret(32);
    setActiveSecret(newSec);
    setTestCodeInput('');
    setTestResult(null);

    if (onUpdateAccount) {
      onUpdateAccount(account.id, {
        twoFactorSecret: newSec,
        twoFactorEnabled: true,
      });
    }

    setTimeout(() => setIsRegenerating(false), 400);
  };

  const handleToggleTwoFactor = () => {
    const newState = !twoFactorEnabled;
    setTwoFactorEnabled(newState);
    if (onUpdateAccount) {
      onUpdateAccount(account.id, {
        twoFactorEnabled: newState,
        twoFactorSecret: activeSecret,
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto overflow-hidden">
        {/* Header Bar */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Google Authenticator Registration</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  RFC 6238 TOTP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Admin 2-Factor Authentication (2FA) for <span className="font-semibold text-white">{account.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2FA Status & Toggle Banner */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${twoFactorEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-slate-700 font-semibold">
              2FA Status: <strong className={twoFactorEnabled ? 'text-emerald-700' : 'text-slate-500'}>
                {twoFactorEnabled ? 'Active & Enforced on Admin Login' : 'Disabled (Optional)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTwoFactor}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                twoFactorEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
              }`}
            >
              {twoFactorEnabled ? '2FA Enabled ✓' : 'Enable 2FA'}
            </button>
            <button
              onClick={handleRegenerateSecret}
              disabled={isRegenerating}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Generate a brand new QR code and secret key"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin text-blue-600' : ''}`} />
              <span>Reset Key</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-5 pt-2">
          <button
            onClick={() => setActiveTab('qr_scan')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr_scan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('manual_entry')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual_entry'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Manual Key Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('recovery_codes')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recovery_codes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Backup Recovery Passkeys</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5">
          {/* TAB 1: SCAN QR CODE */}
          {activeTab === 'qr_scan' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Setup Instructions for Google Authenticator:</span>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                    <li>Open <strong>Google Authenticator</strong> (or Microsoft Authenticator) on your phone.</li>
                    <li>Tap the <strong>+</strong> button at the bottom right and choose <strong>"Scan a QR code"</strong>.</li>
                    <li>Point your phone camera at the QR code below to connect your Admin account.</li>
                  </ol>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/90">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Google Authenticator QR Code"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-[11px] font-mono text-slate-500 mt-2">
                    {account.email}
                  </span>
                </div>

                {/* Live Sync Preview & Actions */}
                <div className="space-y-3 max-w-xs text-left w-full sm:w-auto">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Live Sync Preview:</span>
                      </span>
                      <span className="font-mono text-blue-600 font-bold text-[11px]">
                        {totpData.secondsRemaining}s
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono tracking-widest text-slate-900 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 text-center">
                      {totpData.code.slice(0, 3)} {totpData.code.slice(3)}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-tight">
                      This 6-digit code matches what your Google Authenticator displays right now.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={handleDownloadQr}
                      className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download QR Code (.png)</span>
                    </button>
                    <button
                      onClick={handleCopySecret}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Secret Key Copied!' : 'Copy Base32 Secret Key'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL KEY ENTRY */}
          {activeTab === 'manual_entry' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Manual Setup without Camera:</span>
                </span>
                <p className="text-amber-800">
                  If your phone camera is unavailable, tap <strong>"Enter a setup key"</strong> in Google Authenticator and fill in these values:
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">1. Account Name:</label>
                  <div className="font-mono text-slate-900 bg-white p-2.5 rounded-lg border border-slate-300 font-bold select-all">
                    Javed Electronics ({account.email})
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">2. Your Secret Key (Base32):</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-slate-900 bg-white p-2.5 rounded-lg border border-slate-300 font-black tracking-wider text-sm select-all">
                      {formatBase32Secret(activeSecret)}
                    </div>
                    <button
                      onClick={handleCopySecret}
                      className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">3. Type of Key:</label>
                  <div className="font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    Time-based (30 seconds)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP RECOVERY PASSKEYS */}
          {activeTab === 'recovery_codes' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Emergency Admin Recovery Passkeys:</span>
                </span>
                <p className="text-red-800">
                  Store these recovery codes in a safe password manager. If you ever lose your phone or Google Authenticator access, any of these codes bypass 2FA immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs font-bold text-slate-800">
                {ADMIN_EMERGENCY_RECOVERY_CODES.map((code, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
                    <span>{code}</span>
                    <span className="text-[10px] text-slate-400 font-normal uppercase">One-Time Backup</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyRecoveryCodes}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCodes ? 'Recovery Codes Copied!' : 'Copy All Recovery Codes'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          )}

          {/* Test & Verification Section */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Connection with Google Authenticator:</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              After scanning the QR code above, type the 6-digit code currently appearing in your Google Authenticator app to test and confirm.
            </p>

            <form onSubmit={handleTestVerify} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={testCodeInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setTestCodeInput(val);
                  if (val.length === 6) {
                    const verification = verifyAdminOtp(val, activeSecret);
                    setTestResult({
                      success: verification.valid,
                      message: verification.message,
                    });
                  }
                }}
                placeholder="e.g. 123456"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-sm font-black tracking-widest text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Code</span>
              </button>
            </form>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Powered by standard <strong>TOTP RFC 6238</strong> authentication.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
