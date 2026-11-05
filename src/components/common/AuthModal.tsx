import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Role, UserAccount } from '../../types';
import {
  generateTotpCode,
  generateSmsOtp,
  buildGoogleAuthenticatorUri,
  formatBase32Secret,
} from '../../utils/authenticator';
import { generateQrDataUrl } from '../../utils/qrcode';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  QrCode,
  Smartphone,
  RefreshCw,
  Clock,
  Key,
  ChevronLeft,
  Copy,
  Check,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    loginUser,
    verifyAdminOtpAndLogin,
    registerCustomer,
    initiateCustomerSignupOtp,
    resendCustomerSignupOtp,
    verifyCustomerSignupOtp,
    accounts,
  } = useStore();

  const [authMode, setAuthMode] = useState<'customer_login' | 'customer_register' | 'staff_login'>('customer_login');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Customer Login form fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Customer Registration form fields & OTP verification state
  const [customerSignupStep, setCustomerSignupStep] = useState<'form' | 'verify_otp'>('form');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('Nalasopara');
  const [regPincode, setRegPincode] = useState('401209');
  const [regAddress, setRegAddress] = useState('');

  // Customer Signup 6-digit OTP states
  const [customerOtpDigits, setCustomerOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [customerOtpTimer, setCustomerOtpTimer] = useState<number>(0);
  const [simulatedCustomerEmailOtp, setSimulatedCustomerEmailOtp] = useState<string | null>(null);
  const [copiedCustomerOtp, setCopiedCustomerOtp] = useState(false);
  const customerOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Staff / Admin Login fields
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Step 2: 2FA Authenticator OTP state
  const [pendingAdminAccount, setPendingAdminAccount] = useState<UserAccount | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp_app' | 'sms_whatsapp' | 'recovery_code'>('totp_app');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [simulatedSmsOtp, setSimulatedSmsOtp] = useState<string | null>(null);
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [showQrScanInModal, setShowQrScanInModal] = useState(false);
  const [modalQrDataUrl, setModalQrDataUrl] = useState('');

  // Live TOTP clock state for Authenticator App simulator
  const [totpData, setTotpData] = useState<{ code: string; secondsRemaining: number }>({
    code: '123456',
    secondsRemaining: 30,
  });

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Generate QR code for Google Authenticator in modal
  useEffect(() => {
    if (pendingAdminAccount && showQrScanInModal) {
      const uri = buildGoogleAuthenticatorUri({
        secret: pendingAdminAccount.twoFactorSecret || 'JAVE2ELECTRONICSADMINSECRETKEY33',
        accountName: pendingAdminAccount.email,
        issuer: 'Javed Electronics',
      });
      generateQrDataUrl(uri, {
        width: 240,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setModalQrDataUrl);
    }
  }, [pendingAdminAccount, showQrScanInModal]);

  // Live 1-second TOTP generator ticker
  useEffect(() => {
    const secret = pendingAdminAccount?.twoFactorSecret || 'JE-ADMIN-SECRET-KEY';
    const updateTotp = () => {
      setTotpData(generateTotpCode(secret, 30));
    };
    updateTotp();
    const timer = setInterval(updateTotp, 1000);
    return () => clearInterval(timer);
  }, [pendingAdminAccount?.twoFactorSecret]);

  // SMS cooldown timer
  useEffect(() => {
    if (smsCooldown > 0) {
      const timer = setTimeout(() => setSmsCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [smsCooldown]);

  // Timer countdown for customer signup OTP resend
  useEffect(() => {
    if (customerOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setCustomerOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [customerOtpTimer]);

  if (activeModal !== 'auth') return null;

  const handleClose = () => {
    setActiveModal(null);
    setStatusMessage(null);
    setPendingAdminAccount(null);
    setOtpDigits(['', '', '', '', '', '']);
    setSimulatedSmsOtp(null);
    setCustomerSignupStep('form');
    setCustomerOtpDigits(['', '', '', '', '', '']);
    setSimulatedCustomerEmailOtp(null);
  };

  // 1-Click Quick Demo Login Helper
  const handleQuickLogin = (email: string, pass: string) => {
    setStatusMessage(null);
    const res = loginUser(email, pass);
    if (res.requires2FA && res.account) {
      setAuthMode('staff_login');
      setPendingAdminAccount(res.account);
      setOtpDigits(['', '', '', '', '', '']);
      setStatusMessage({
        type: 'success',
        text: 'Credentials verified! Please enter your 6-digit Authenticator OTP code.',
      });
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
      return;
    }

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Submit Customer Login
  const handleCustomerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your email or phone and password.' });
      return;
    }

    const res = loginUser(loginIdentifier, loginPassword);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Step 1: Submit Customer Registration & Generate 6-digit OTP
  const handleCustomerRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in all required registration fields.' });
      return;
    }

    if (regPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password should be at least 6 characters long.' });
      return;
    }

    const res = initiateCustomerSignupOtp({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      city: regCity,
      pincode: regPincode,
      addressLine: regAddress,
    });

    if (res.success && res.otpCode) {
      setSimulatedCustomerEmailOtp(res.otpCode);
      setCustomerOtpDigits(['', '', '', '', '', '']);
      setCustomerOtpTimer(res.resendSeconds || 60);
      setCustomerSignupStep('verify_otp');
      setStatusMessage({
        type: 'success',
        text: `6-digit verification code sent to ${regEmail}.`,
      });
      setTimeout(() => {
        customerOtpInputRefs.current[0]?.focus();
      }, 200);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Handle customer 6-digit OTP input change
  const handleCustomerOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...customerOtpDigits];
    newDigits[index] = clean.slice(-1);
    setCustomerOtpDigits(newDigits);

    // Auto-advance to next input box
    if (clean && index < 5) {
      customerOtpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (clean && index === 5 && newDigits.every((d) => d !== '')) {
      const fullCode = newDigits.join('');
      executeCustomerOtpVerification(fullCode);
    }
  };

  const handleCustomerOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !customerOtpDigits[index] && index > 0) {
      customerOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCustomerOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...customerOtpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setCustomerOtpDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 5);
    customerOtpInputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      executeCustomerOtpVerification(pasted);
    }
  };

  const executeCustomerOtpVerification = (codeToVerify?: string) => {
    setStatusMessage(null);
    const code = codeToVerify || customerOtpDigits.join('');
    if (code.length < 6) {
      setStatusMessage({ type: 'error', text: 'Please enter all 6 digits of the verification code.' });
      return;
    }

    const res = verifyCustomerSignupOtp(regEmail, code);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Email verified successfully! Welcome, ${res.user?.name || regName}.`,
      });
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleResendCustomerOtp = () => {
    if (customerOtpTimer > 0) return;
    setStatusMessage(null);

    const res = resendCustomerSignupOtp(regEmail);
    if (res.success && res.otpCode) {
      setSimulatedCustomerEmailOtp(res.otpCode);
      setCustomerOtpDigits(['', '', '', '', '', '']);
      setCustomerOtpTimer(res.resendSeconds || 60);
      setStatusMessage({
        type: 'success',
        text: `New verification code sent to ${regEmail}.`,
      });
      setTimeout(() => {
        customerOtpInputRefs.current[0]?.focus();
      }, 200);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const fillSimulatedCustomerOtp = () => {
    if (!simulatedCustomerEmailOtp) return;
    const digits = simulatedCustomerEmailOtp.split('');
    setCustomerOtpDigits(digits);
    setCopiedCustomerOtp(true);
    setTimeout(() => setCopiedCustomerOtp(false), 2000);
    executeCustomerOtpVerification(simulatedCustomerEmailOtp);
  };

  // Step 1: Submit Admin & Staff Credentials
  const handleStaffLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!staffIdentifier.trim() || !staffPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your staff ID or email and password.' });
      return;
    }

    const res = loginUser(staffIdentifier, staffPassword);
    if (res.requires2FA && res.account) {
      setPendingAdminAccount(res.account);
      setOtpDigits(['', '', '', '', '', '']);
      setStatusMessage({
        type: 'success',
        text: 'Credentials verified! Please enter your 6-digit Authenticator OTP code.',
      });
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
      return;
    }

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Step 2: Handle OTP Digit Change
  const handleDigitChange = (index: number, val: string) => {
    // Only allow numbers
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (clean && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        verifyOtpCode(fullCode);
      }
    }
  };

  // Handle OTP Keydown (Backspace navigation)
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste 6 digits
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split('');
    const newDigits = [...otpDigits];
    digits.forEach((d, i) => {
      if (i < 6) newDigits[i] = d;
    });
    setOtpDigits(newDigits);

    const targetFocus = Math.min(digits.length, 5);
    otpInputRefs.current[targetFocus]?.focus();

    if (pasted.length === 6) {
      verifyOtpCode(pasted);
    }
  };

  // Step 2: Verify OTP and finalize login
  const verifyOtpCode = (codeToVerify?: string) => {
    if (!pendingAdminAccount) return;
    setStatusMessage(null);

    let code = codeToVerify || otpDigits.join('');
    if (twoFactorMethod === 'recovery_code') {
      code = recoveryCodeInput.trim();
    }

    if (!code) {
      setStatusMessage({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }

    const res = verifyAdminOtpAndLogin(
      pendingAdminAccount.id,
      code,
      simulatedSmsOtp || undefined
    );

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  // Auto-fill Current TOTP Code helper
  const handleAutoFillTotp = () => {
    const code = totpData.code;
    const digits = code.split('');
    setOtpDigits(digits);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
    verifyOtpCode(code);
  };

  // Send simulated SMS/WhatsApp OTP
  const handleSendSmsOtp = () => {
    if (smsCooldown > 0) return;
    const newSms = generateSmsOtp();
    setSimulatedSmsOtp(newSms);
    setSmsCooldown(30);
    setStatusMessage({
      type: 'success',
      text: `One-Time Security OTP dispatched to ${pendingAdminAccount?.phone || '+91 98390 12345'} (Code: ${newSms}).`,
    });
  };

  const handleCopySecret = () => {
    const secret = pendingAdminAccount?.twoFactorSecret || 'JE-ADMIN-SECRET-KEY';
    navigator.clipboard?.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm ${
              pendingAdminAccount ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
            }`}>
              {pendingAdminAccount ? <ShieldCheck className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                {pendingAdminAccount
                  ? 'Admin 2FA Authenticator'
                  : authMode === 'customer_login'
                  ? 'Customer Sign In'
                  : authMode === 'customer_register'
                  ? 'Create Customer Account'
                  : 'Admin & Store Staff Portal'}
              </h3>
              <p className="text-xs text-slate-500">
                {pendingAdminAccount
                  ? 'Two-step verification required to protect merchant operations'
                  : authMode === 'customer_login'
                  ? 'Access your orders, wishlist & 4-hour local delivery'
                  : authMode === 'customer_register'
                  ? 'Anyone can register for fast checkout & rewards'
                  : 'Secure access for Super Admins and Branch Managers'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection (Only shown when not in 2FA pending state) */}
        {!pendingAdminAccount && (
          <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => {
                setAuthMode('customer_login');
                setStatusMessage(null);
              }}
              className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'customer_login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="truncate">Customer Login</span>
            </button>

            <button
              onClick={() => {
                setAuthMode('customer_register');
                setStatusMessage(null);
              }}
              className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'customer_register'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="truncate">Register</span>
            </button>

            <button
              onClick={() => {
                setAuthMode('staff_login');
                setStatusMessage(null);
              }}
              className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'staff_login'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Admin / Store</span>
            </button>
          </div>
        )}

        {/* Status Alert Notification */}
        {statusMessage && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="break-words flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* ==================================================================== */}
          {/* STEP 2: 2FA AUTHENTICATOR OTP SCREEN FOR ADMIN                       */}
          {/* ==================================================================== */}
          {pendingAdminAccount ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Admin Identity Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 text-sm">
                    {pendingAdminAccount.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs sm:text-sm truncate text-white">
                      {pendingAdminAccount.name}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate font-mono">
                      {pendingAdminAccount.email}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase shrink-0">
                  {pendingAdminAccount.role === 'super_admin' ? 'Super Admin' : 'Store Manager'}
                </span>
              </div>

              {/* 2FA Method Selector */}
              <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('totp_app')}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    twoFactorMethod === 'totp_app'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="truncate">Authenticator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('sms_whatsapp')}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    twoFactorMethod === 'sms_whatsapp'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="truncate">SMS / WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('recovery_code')}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    twoFactorMethod === 'recovery_code'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span className="truncate">Recovery Code</span>
                </button>
              </div>

              {/* METHOD 1: AUTHENTICATOR APP (Google Authenticator / Microsoft Authenticator / TOTP) */}
              {twoFactorMethod === 'totp_app' && (
                <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900">Google / Microsoft Authenticator</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Open the authenticator app on your mobile device and enter the 6-digit verification code below.
                    </p>
                  </div>
                </div>
              )}

              {/* METHOD 2: SMS / WHATSAPP OTP */}
              {twoFactorMethod === 'sms_whatsapp' && (
                <div className="space-y-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>SMS & WhatsApp Security Code</span>
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold font-mono">
                      {pendingAdminAccount.phone || '+91 98390 12345'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Click send to dispatch a 6-digit one-time passcode to the registered admin mobile number.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendSmsOtp}
                      disabled={smsCooldown > 0}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        smsCooldown > 0
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${smsCooldown > 0 ? 'animate-spin' : ''}`} />
                      <span>{smsCooldown > 0 ? `Resend code in ${smsCooldown}s` : 'Send Code via WhatsApp / SMS'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* METHOD 3: EMERGENCY RECOVERY CODE */}
              {twoFactorMethod === 'recovery_code' && (
                <div className="space-y-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>Admin Emergency Recovery Code</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If you lost access to your Authenticator app, enter your 16-character admin recovery passkey.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value)}
                      placeholder="e.g. JE-SAFE-9901"
                      className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              {/* 6-Digit OTP Box Inputs (for Authenticator & SMS) */}
              {twoFactorMethod !== 'recovery_code' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-800 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 shadow-xs transition-all outline-none"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Verification & Back Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => verifyOtpCode()}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify OTP & Launch Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingAdminAccount(null);
                    setStatusMessage(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Credentials</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ================================================================ */}
              {/* STEP 1: CREDENTIALS & DEMO CHIPS                                 */}
              {/* ================================================================ */}


              {/* TAB 1: CUSTOMER LOGIN */}
              {authMode === 'customer_login' && (
                <form onSubmit={handleCustomerLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address or Mobile Phone
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. sameer.siddiqui@example.com or 9839277102"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your customer password"
                        className="w-full text-xs pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Sign In as Customer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-500">Don't have an account yet? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('customer_register')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Register here (Free)
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: CUSTOMER SELF-REGISTRATION WITH EMAIL OTP */}
              {authMode === 'customer_register' && (
                <div>
                  {customerSignupStep === 'form' ? (
                    <form onSubmit={handleCustomerRegisterSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Mobile Phone <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="+91 98390 12345"
                              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Create Password (minimum 6 characters) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Create a secure password"
                            className="w-full text-xs pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={regCity}
                            onChange={(e) => setRegCity(e.target.value)}
                            placeholder="Nalasopara"
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={regPincode}
                            onChange={(e) => setRegPincode(e.target.value)}
                            placeholder="401209"
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <span>Continue & Verify Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="text-center pt-1">
                        <span className="text-xs text-slate-500">Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => setAuthMode('customer_login')}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Sign In here
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* STEP 2: 6-DIGIT EMAIL VERIFICATION OTP */
                    <div className="space-y-4">
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                          <Mail className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          Verify Your Email Address
                        </h4>
                        <p className="text-xs text-slate-500">
                          Enter the 6-digit code sent to <strong className="text-slate-800">{regEmail}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerSignupStep('form');
                            setStatusMessage(null);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Change email address</span>
                        </button>
                      </div>

                      {/* Developer Testing Simulator Helper */}
                      {simulatedCustomerEmailOtp && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-amber-800 block">
                              Email Inbox Simulation:
                            </span>
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {simulatedCustomerEmailOtp}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={fillSimulatedCustomerOtp}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {copiedCustomerOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCustomerOtp ? 'Verified!' : 'Auto-Fill & Verify'}</span>
                          </button>
                        </div>
                      )}

                      {/* 6 Segmented Input Boxes */}
                      <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
                        {customerOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              customerOtpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCustomerOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleCustomerOtpKeyDown(idx, e)}
                            onPaste={handleCustomerOtpPaste}
                            className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                          />
                        ))}
                      </div>

                      {/* Submit & Cooldown actions */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => executeCustomerOtpVerification()}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Verify & Complete Signup</span>
                        </button>

                        <div className="flex items-center justify-between text-xs pt-1 px-1">
                          <span className="text-slate-500">Didn't receive the code?</span>
                          {customerOtpTimer > 0 ? (
                            <span className="text-slate-400 font-mono font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Resend in {customerOtpTimer}s</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendCustomerOtp}
                              className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADMIN & STORE STAFF LOGIN */}
              {authMode === 'staff_login' && (
                <form onSubmit={handleStaffLoginSubmit} className="space-y-3.5">
                  <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorized Merchant & Admin Access Only</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Platform administrators and store managers are protected by <strong>2-Step Authenticator OTP</strong> verification.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff Email or Login Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={staffIdentifier}
                        onChange={(e) => setStaffIdentifier(e.target.value)}
                        placeholder="e.g. admin@javed-electronics.in or store"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter staff password"
                        className="w-full text-xs pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Proceed to Authenticator OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Enforced 2FA: Google Authenticator, Microsoft Authenticator, or WhatsApp SMS OTP.</span>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
