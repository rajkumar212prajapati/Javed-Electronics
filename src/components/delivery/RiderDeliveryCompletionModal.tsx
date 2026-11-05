import React, { useState, useRef, useEffect } from 'react';
import { Order, CustomerDeliveryFeedback } from '../../types';
import { InHouseRider as Rider } from '../../data/mockDeliveryPartners';
import { formatINR } from '../../utils/currency';
import {
  CheckCircle2,
  Camera,
  Banknote,
  KeyRound,
  Star,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  X,
  RotateCcw,
  UploadCloud,
  Check,
  AlertCircle,
  Smartphone,
  ChevronRight,
  ThumbsUp,
  Heart,
  QrCode,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { cleanCustomerName } from '../../utils/cleaners';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';

interface RiderDeliveryCompletionModalProps {
  order: Order;
  rider: Rider;
  supportPhone?: string;
  supportWhatsapp?: string;
  onClose: () => void;
  onDeliveryCompleted: (params: {
    collectedAmount: number;
    paymentMethodCollected: 'cash' | 'doorstep_upi_qr';
    receiverName: string;
    note: string;
    podImageUrl: string;
    deliveryPinEntered: string;
    verifiedOtp?: boolean;
    feedback?: CustomerDeliveryFeedback;
  }) => void;
}

// Preset realistic POD images for quick snap / testing
const SAMPLE_POD_IMAGES = [
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', // Package handed over
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', // Doorstep box delivery
  'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80', // Electronics carton delivered
];

const COMPLIMENT_TAGS = [
  '⚡ Fast & On-Time',
  '😊 Polite & Courteous',
  '📦 Box in Pristine Condition',
  '🛡️ Safe & Contactless Handover',
  '📱 Smooth OTP Verification',
  '💵 Quick Payment Handling',
  '🗺️ Easily Found Address',
];

export const RiderDeliveryCompletionModal: React.FC<RiderDeliveryCompletionModalProps> = ({
  order,
  rider,
  supportPhone = '+91 98390 12345',
  supportWhatsapp = '919839012345',
  onClose,
  onDeliveryCompleted,
}) => {
  // Steps: 1: COD Collection -> 2: 4-Digit Delivery Code -> 3: Take POD -> 4: Customer Feedback -> 5: Done Celebration
  const isCodOrder = order.paymentMethod === 'cod' || order.dispatchDetails?.isCod;
  const targetOtp =
    order.deliveryCode ||
    order.dispatchDetails?.riderOtp ||
    order.id.replace(/\D/g, '').slice(-4) ||
    '4829';

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: COD Collection State
  const [collectedAmount, setCollectedAmount] = useState<number>(
    isCodOrder ? order.finalTotal : 0
  );
  const [paymentMethodCollected, setPaymentMethodCollected] = useState<'cash' | 'doorstep_upi_qr'>(
    'cash'
  );
  const [isCashConfirmedByRider, setIsCashConfirmedByRider] = useState<boolean>(!isCodOrder);

  // Step 2: 4-Digit Delivery Code State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [customerDeniedOtp, setCustomerDeniedOtp] = useState<boolean>(false);
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Step 3: POD Photo State
  const [podImageUrl, setPodImageUrl] = useState<string>(
    order.deliveryProof?.podImageUrl || ''
  );
  const [receiverName, setReceiverName] = useState<string>(
    cleanCustomerName(order.customer.name)
  );
  const [deliveryNote, setDeliveryNote] = useState<string>(
    'Handed over package safely at customer doorstep with invoice'
  );
  const [podCaptureTimestamp, setPodCaptureTimestamp] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Customer Feedback State
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '⚡ Fast & On-Time',
    '😊 Polite & Courteous',
    '📦 Box in Pristine Condition',
  ]);
  const [customerComments, setCustomerComments] = useState<string>('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  // Feedback Submitted State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto focus first OTP input when reaching step 2
  useEffect(() => {
    if (step === 2 && otpInputRefs[0].current) {
      setTimeout(() => otpInputRefs[0].current?.focus(), 150);
    }
  }, [step]);

  // Handle OTP digit changes
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto-advance to next input
    if (cleaned && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Check if 4 digits are complete
    const fullCode = newDigits.join('');
    if (fullCode.length === 4) {
      if (fullCode === targetOtp) {
        setIsOtpVerified(true);
        setOtpError(null);
      } else {
        setIsOtpVerified(false);
        setOtpError(`Incorrect Code. The entered code (${fullCode}) does not match.`);
      }
    } else {
      setIsOtpVerified(false);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length > 0) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      if (pasted.length === 4) {
        if (pasted === targetOtp) {
          setIsOtpVerified(true);
          setOtpError(null);
        } else {
          setIsOtpVerified(false);
          setOtpError(`Incorrect Code. The entered code (${pasted}) does not match.`);
        }
      }
    }
  };

  const handleAutoFillTestOtp = () => {
    const chars = targetOtp.split('');
    setOtpDigits(chars);
    setIsOtpVerified(true);
    setOtpError(null);
  };

  // Handle File Upload for POD
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPodImageUrl(reader.result);
          setPodCaptureTimestamp(
            new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSnapSamplePod = () => {
    const randomSample =
      SAMPLE_POD_IMAGES[Math.floor(Math.random() * SAMPLE_POD_IMAGES.length)];
    setPodImageUrl(randomSample);
    setPodCaptureTimestamp(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // STEP TRANSITIONS
  const handleProceedFromCod = () => {
    if (isCodOrder && (!isCashConfirmedByRider || collectedAmount <= 0)) {
      return;
    }
    setStep(2);
  };

  const handleProceedFromOtp = () => {
    if (customerDeniedOtp) {
      setStep(3);
      return;
    }
    const entered = otpDigits.join('');
    if (entered !== targetOtp) {
      setOtpError('Invalid OTP. Please ask the customer for the 4-digit delivery OTP.');
      return;
    }
    setStep(3);
  };

  // Mark Delivered Directly when Customer Denies OTP
  const handleMarkDeliveredWithoutOtp = () => {
    setCustomerDeniedOtp(true);
    setIsOtpVerified(false);
    setOtpError(null);
    const fallbackPod = podImageUrl || SAMPLE_POD_IMAGES[0];
    setPodImageUrl(fallbackPod);
    const denialNote = 'Delivered at doorstep (Customer denied to share OTP)';
    setDeliveryNote(denialNote);

    onDeliveryCompleted({
      collectedAmount: isCodOrder ? Number(collectedAmount) : 0,
      paymentMethodCollected,
      receiverName: receiverName || order.customer.name,
      note: denialNote,
      podImageUrl: fallbackPod,
      deliveryPinEntered: 'OTP_DENIED_BY_CUSTOMER',
      verifiedOtp: false,
    });

    setStep(5);
  };

  // Step 3 -> Step 4: Mark Delivered!
  const handleMarkDelivered = () => {
    if (!podImageUrl) {
      return;
    }

    onDeliveryCompleted({
      collectedAmount: isCodOrder ? Number(collectedAmount) : 0,
      paymentMethodCollected,
      receiverName: receiverName || order.customer.name,
      note:
        deliveryNote ||
        (customerDeniedOtp
          ? 'Delivered at doorstep (Customer denied to share OTP)'
          : 'Handed over package safely'),
      podImageUrl,
      deliveryPinEntered: customerDeniedOtp ? 'OTP_DENIED_BY_CUSTOMER' : otpDigits.join(''),
      verifiedOtp: !customerDeniedOtp && isOtpVerified,
    });

    setStep(4);
  };

  // Step 4 -> Complete with Customer Feedback
  const handleSubmitCustomerFeedback = () => {
    setIsSubmitting(true);
    const feedback: CustomerDeliveryFeedback = {
      rating: customerRating,
      tags: selectedTags,
      comment: customerComments.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    onDeliveryCompleted({
      collectedAmount: isCodOrder ? Number(collectedAmount) : 0,
      paymentMethodCollected,
      receiverName: receiverName || order.customer.name,
      note:
        deliveryNote ||
        (customerDeniedOtp
          ? 'Delivered at doorstep (Customer denied to share OTP)'
          : 'Handed over package safely'),
      podImageUrl,
      deliveryPinEntered: customerDeniedOtp ? 'OTP_DENIED_BY_CUSTOMER' : otpDigits.join(''),
      verifiedOtp: !customerDeniedOtp && isOtpVerified,
      feedback,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(5);
    }, 600);
  };

  // Dynamic reaction texts based on rating
  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return { emoji: '🌟', text: 'Exceptional & Polite!', color: 'text-amber-500' };
      case 4:
        return { emoji: '😊', text: 'Very Good Delivery', color: 'text-emerald-500' };
      case 3:
        return { emoji: '🙂', text: 'Satisfactory', color: 'text-blue-500' };
      case 2:
        return { emoji: '😐', text: 'Fair Experience', color: 'text-amber-600' };
      default:
        return { emoji: '😞', text: 'Needs Improvement', color: 'text-rose-500' };
    }
  };

  const activeRatingInfo = getRatingLabel(hoveredStar || customerRating);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 flex items-center justify-between border-b border-indigo-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                Doorstep Delivery Handover
              </span>
              <span className="font-mono text-xs font-bold text-slate-300">
                {order.id}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Delivering to {cleanCustomerName(order.customer.name)}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Step Progression Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 shrink-0">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { num: 1, label: isCodOrder ? '1. Collect COD' : '1. Payment' },
              { num: 2, label: '2. 4-Digit Code' },
              { num: 3, label: '3. Take POD' },
              { num: 4, label: '4. Feedback' },
            ].map((s) => {
              const isCurrent = step === s.num || (step === 5 && s.num === 4);
              const isDone = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 shadow-2xs'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold hidden sm:inline ${
                      isCurrent
                        ? 'text-indigo-900 font-extrabold'
                        : isDone
                        ? 'text-emerald-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* ================= STEP 1: PAYMENT / COD COLLECTION ================= */}
          {step === 1 && (
            <div className="space-y-4">
              {!isCodOrder ? (
                /* Clean single prepaid box - no redundant duplicates */
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm">Prepaid Order (Zero Cash Due)</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Payment was verified online via UPI/Card. No collection needed. Proceed to enter customer's 4-digit delivery code.
                  </p>
                </div>
              ) : (
                /* Single clean COD collection box */
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
                    <Banknote className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-900">
                        Collect Cash on Delivery
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Collect payment from customer before entering the 4-digit delivery code.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        Cash on Delivery Amount Due:
                      </span>
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {formatINR(order.finalTotal)}
                      </span>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="font-bold text-slate-700 block mb-1.5 text-[11px]">
                        Payment Mode Received:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethodCollected('cash')}
                          className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            paymentMethodCollected === 'cash'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Cash in Hand</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethodCollected('doorstep_upi_qr')}
                          className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            paymentMethodCollected === 'doorstep_upi_qr'
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Doorstep UPI Scan</span>
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                        Collected Amount (₹):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={collectedAmount}
                          onChange={(e) => setCollectedAmount(Number(e.target.value))}
                          className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setCollectedAmount(order.finalTotal)}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer border border-slate-200"
                        >
                          Exact {formatINR(order.finalTotal)}
                        </button>
                      </div>
                    </div>

                    {/* Rider Checkbox Confirmation */}
                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCashConfirmedByRider}
                        onChange={(e) => setIsCashConfirmedByRider(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-700 font-medium">
                        I confirm that I have collected{' '}
                        <strong className="text-slate-900 font-bold">
                          {formatINR(collectedAmount)}
                        </strong>{' '}
                        via {paymentMethodCollected === 'cash' ? 'Cash' : 'Doorstep UPI'} from customer {cleanCustomerName(order.customer.name)}.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Advance Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProceedFromCod}
                  disabled={isCodOrder && (!isCashConfirmedByRider || collectedAmount <= 0)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <span>Next: Enter 4-Digit Code</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: 4-DIGIT DELIVERY CODE ================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 flex items-start gap-2.5">
                <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-indigo-900">
                    Ask Customer for 4-Digit Delivery OTP
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Request the 4-digit OTP from the customer and enter it below to confirm delivery.
                  </p>
                </div>
              </div>

              {/* 4 Pin Inputs Container (Customer OTP is never displayed to rider) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-4">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Enter Customer&apos;s 4-Digit OTP
                </label>

                <div
                  className="flex items-center justify-center gap-3"
                  onPaste={handlePasteOtp}
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpInputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        setCustomerDeniedOtp(false);
                        handleDigitChange(index, e.target.value);
                      }}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-black font-mono rounded-2xl border-2 transition-all ${
                        isOtpVerified
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                          : otpError
                          ? 'border-rose-400 bg-rose-50 text-rose-950 focus:ring-rose-400'
                          : 'border-slate-300 bg-white text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Validation Feedback */}
                {isOtpVerified && (
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>OTP Verified! Click below to confirm delivery.</span>
                  </div>
                )}

                {otpError && (
                  <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl flex items-center justify-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for OTP Verified */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromOtp}
                  disabled={!isOtpVerified}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm OTP &amp; Proceed</span>
                </button>
              </div>

              {/* Customer Denied to Give OTP -> Mark Delivered or Connect to Support Team */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Customer Denied to Share OTP?
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800">
                    Fallback Options
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  If the customer refuses or is unable to share the OTP, you can mark the order delivered directly or connect with the Support Team (Admin / Store can also mark delivered manually).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleMarkDeliveredWithoutOtp}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Delivered (OTP Denied)</span>
                  </button>

                  <a
                    href={`tel:${supportPhone}`}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Call Support</span>
                  </a>

                  <a
                    href={getWhatsAppClickToChatUrl(
                      supportWhatsapp,
                      `Hi Support Team, I am Rider ${rider.name} at customer doorstep for Order ${order.id} (${order.customer.name}). Customer denied/unable to share OTP. Please assist or mark delivered manually.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Support</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: TAKE POD IMAGE & MARK DELIVERED ================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5">
                <Camera className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">
                    Step 3: Capture Proof of Delivery (POD) Image
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Take a clear photo of the delivered parcel at the customer's doorstep or during handover.
                  </p>
                </div>
              </div>

              {/* POD Photo Preview Container */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                {podImageUrl ? (
                  <div className="space-y-2.5">
                    <div className="relative rounded-xl overflow-hidden border-2 border-indigo-500 shadow-sm bg-black aspect-video max-h-56 flex items-center justify-center">
                      <img
                        src={podImageUrl}
                        alt="Proof of Delivery"
                        className="w-full h-full object-cover"
                      />
                      {/* Watermarked GPS & Timestamp Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 text-white text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>
                            {order.shippingAddress?.area || order.customer.area || 'Mahanagar'}, {order.shippingAddress?.city || 'Lucknow'} (26.8721° N, 80.9528° E)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {podCaptureTimestamp}</span>
                          </span>
                          <span className="font-mono bg-indigo-600/80 px-1.5 py-0.2 rounded font-bold text-white">
                            POD REF: {order.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>POD Photo Attached</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleSnapSamplePod}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          Snap Alternative
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3 bg-white">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        No POD Photo Captured Yet
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Use device camera to snap doorstep delivery, or select quick sample photo.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo / Upload</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSnapSamplePod}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>📸 Snap Quick Doorstep POD</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Receiver Name & Handover Note */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      Received By (Full Name) *:
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Receiver name"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      Proof Note / Remarks:
                    </label>
                    <input
                      type="text"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      placeholder="e.g. Handed over safely with sealed invoice"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Mark Delivered & Proceed to Feedback */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleMarkDelivered}
                  disabled={!podImageUrl}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Delivered &amp; Ask Customer Feedback →</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: CUSTOMER FEEDBACK SHEET ================= */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Hand Phone to Customer Banner */}
              <div className="p-3.5 bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl text-white shadow-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-white/20 text-white">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100">
                    Customer Experience Sheet
                  </span>
                </div>
                <h4 className="text-base font-black text-white">
                  Hand Phone to Customer: {order.customer.name}
                </h4>
                <p className="text-[11px] text-indigo-100">
                  Order <strong>{order.id}</strong> is marked delivered! Please rate your doorstep experience with rider <strong>{rider.name}</strong>.
                </p>
              </div>

              {/* 5-Star Interactive Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  Tap Stars to Rate Delivery (1 - 5)
                </span>

                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoveredStar || customerRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setCustomerRating(star)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${star} Star`}
                      >
                        <Star
                          className={`w-9 h-9 sm:w-11 sm:h-11 transition-all ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 fill-transparent hover:text-amber-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
                  <span className="text-base">{activeRatingInfo.emoji}</span>
                  <span className={`font-black text-xs ${activeRatingInfo.color}`}>
                    {activeRatingInfo.text} ({customerRating}/5)
                  </span>
                </div>
              </div>

              {/* Compliments / Tags Chips */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block text-[11px]">
                  What did you like about this delivery? (Select compliments)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMPLIMENT_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Comments Textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-[11px]">
                  Customer Remarks / Suggestions (Optional):
                </label>
                <textarea
                  rows={2}
                  value={customerComments}
                  onChange={(e) => setCustomerComments(e.target.value)}
                  placeholder="e.g. Very fast delivery, polite rider, box arrived in perfect condition!"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Feedback Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmitCustomerFeedback}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback & Complete Delivery ✓'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: FINAL CELEBRATION CARD ================= */}
          {step === 5 && (
            <div className="py-6 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  Delivery &amp; Customer Feedback Complete!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Order <strong>{order.id}</strong> has been successfully delivered to{' '}
                  <strong>{order.customer.name}</strong>.
                </p>
              </div>

              {/* Summary Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Delivery Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    DELIVERED ✓
                  </span>
                </div>
                {isCodOrder && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">COD Cash Collected:</span>
                    <span className="font-mono font-black text-slate-900">
                      {formatINR(collectedAmount)} ({paymentMethodCollected === 'cash' ? 'Cash' : 'Doorstep UPI'})
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">OTP Verification:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {customerDeniedOtp ? 'OTP Denied by Customer (Manual Handover)' : 'Verified ✓'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer Rating:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{customerRating}/5 Stars</span>
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Return to Active Deliveries
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
