import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { InHouseRider } from '../../data/mockDeliveryPartners';
import { RiderRemittanceSubmission } from '../../types';
import { formatINR } from '../../utils/currency';
import { generateQrDataUrl } from '../../utils/qrcode';
import {
  X,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building2,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';

interface RiderCashSubmitModalProps {
  rider: InHouseRider;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenApproveModal?: (remittance: RiderRemittanceSubmission) => void;
}

export const RiderCashSubmitModal: React.FC<RiderCashSubmitModalProps> = ({
  rider,
  isOpen,
  onClose,
  onSuccess,
  onOpenApproveModal,
}) => {
  const {
    outlets,
    orders,
    submitRiderCashRemittance,
    approveRiderCashRemittance,
    currentUser,
    currentRole,
    settings,
  } = useStore();

  const [amount, setAmount] = useState<number>(rider.codCashInHand || 0);
  const [submissionMethod, setSubmissionMethod] = useState<'cash_deposit' | 'upi_qr'>('cash_deposit');
  const [selectedOutletId, setSelectedOutletId] = useState<string>(rider.outletId || 'out_hazratganj');
  const [notes, setNotes] = useState<string>('');
  const [submittedRemittance, setSubmittedRemittance] = useState<RiderRemittanceSubmission | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isInstantApproving, setIsInstantApproving] = useState(false);
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);

  // Delivered COD orders for this rider
  const riderCodOrders = orders.filter(
    (o) =>
      o.dispatchDetails?.riderId === rider.id &&
      (o.dispatchDetails?.isCod || o.paymentMethod === 'cod') &&
      o.orderStatus === 'delivered'
  );

  // Generate QR Code when UPI or Submission is created
  useEffect(() => {
    if (submissionMethod === 'upi_qr' || submittedRemittance) {
      const code =
        submittedRemittance?.remittanceCode ||
        Math.floor(10000000 + Math.random() * 90000000).toString();
      const payload = `upi://pay?pa=${encodeURIComponent(settings.upiId || 'javed.electronics@icici')}&pn=${encodeURIComponent(settings.upiName || 'Javed Electronics')}&am=${amount}&tr=REMIT-${code}&tn=${encodeURIComponent(`Rider Cash Remit ${rider.name}`)}&cu=INR`;

      generateQrDataUrl(payload, { width: 220 }).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [submissionMethod, submittedRemittance, amount, rider.name, settings.upiId, settings.upiName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const res = submitRiderCashRemittance({
      riderId: rider.id,
      amount,
      submissionMethod,
      outletId: selectedOutletId,
      orderIds: riderCodOrders.map((o) => o.id),
      qrDataUrl: qrCodeDataUrl,
      notes,
    });

    if (res.success && res.remittance) {
      setSubmittedRemittance(res.remittance);
    }
  };

  const handleInstantApproveByStore = () => {
    if (!submittedRemittance) return;
    setIsInstantApproving(true);
    const approver = `${currentUser.name} (${currentRole.replace('_', ' ')})`;
    const res = approveRiderCashRemittance(
      submittedRemittance.id,
      approver,
      notes || `Cash handed over by ${rider.name} and approved at store counter.`
    );
    setIsInstantApproving(false);
    if (res.success) {
      setApprovalSuccessMsg(res.message);
      if (onSuccess) onSuccess();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Rider Cash Remittance to Store / Admin
              </h3>
              <p className="text-xs text-slate-500">
                Submit doorstep COD cash collected by rider to the store counter drawer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Approval Success Banner */}
        {approvalSuccessMsg ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">Cash Successfully Deposited!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                {approvalSuccessMsg}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs max-w-xs mx-auto text-left space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Rider:</span>
                <span className="font-bold text-slate-900">{rider.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Deposited:</span>
                <span className="font-bold text-emerald-700">{formatINR(amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Receipt Number:</span>
                <span className="font-bold text-indigo-700">{submittedRemittance?.receiptNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cash In Hand Remaining:</span>
                <span className="font-bold text-slate-900">
                  {formatINR(Math.max(0, rider.codCashInHand - amount))}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : submittedRemittance ? (
          /* Step 2: Remittance Submitted — QR Code & Verification Token */
          <div className="py-4 space-y-4">
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Remittance Request Generated
                </span>
                <div className="font-black text-indigo-950 text-base">
                  {formatINR(submittedRemittance.amount)}
                </div>
                <span className="text-[11px] text-indigo-800">
                  Method: {submittedRemittance.submissionMethod === 'cash_deposit' ? 'Physical Cash at Counter' : 'UPI QR Remittance'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Verification Token</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-xl font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 tracking-wider">
                    {submittedRemittance.remittanceCode}
                  </span>
                  <button
                    onClick={() => copyCode(submittedRemittance.remittanceCode)}
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-600 cursor-pointer"
                    title="Copy Code"
                  >
                    {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic QR Code display for Store Manager to Scan */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Store Cashier QR Scan Code</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Store cashier can scan this QR or verify Token{' '}
                <strong className="font-mono text-slate-900">{submittedRemittance.remittanceCode}</strong> to approve collection into store drawer.
              </p>

              {qrCodeDataUrl ? (
                <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200 mx-auto">
                  <img
                    src={qrCodeDataUrl}
                    alt="Remittance QR Code"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    Scan with Store Scanner / UPI App
                  </div>
                </div>
              ) : (
                <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-xl mx-auto flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Immediate Store Action for Testing / Counter Cashier */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Keep Pending in Queue
              </button>

              <button
                type="button"
                disabled={isInstantApproving}
                onClick={handleInstantApproveByStore}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Store Scan & Approve Cash Deposit</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Form to Initiate Submission */
          <form onSubmit={handleSubmit} className="space-y-4 pt-3.5 text-xs">
            {/* Rider Profile Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {rider.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{rider.name}</span>
                    <span className="text-[10px] font-normal text-slate-500">({rider.vehicleNo})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-500" />
                      {rider.phone}
                    </span>
                    <span>•</span>
                    <span>{rider.outletName}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Cash in Hand
                </span>
                <span className="font-mono text-base font-black text-amber-950">
                  {formatINR(rider.codCashInHand)}
                </span>
              </div>
            </div>

            {/* Submission Method Selection */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Select Submission System *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubmissionMethod('cash_deposit')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                    submissionMethod === 'cash_deposit'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Cash Deposit System</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Rider hands physical cash notes to store cashier at counter.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionMethod('upi_qr')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                    submissionMethod === 'upi_qr'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">UPI / Dynamic QR Code</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Rider creates QR code; store scans &amp; approves collection digitally.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount to Submit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800">
                  Amount to Submit (₹) *
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(rider.codCashInHand)}
                  className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  Full Amount ({formatINR(rider.codCashInHand)})
                </button>
              </div>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-base focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Remaining rider cash balance after handover:{' '}
                <strong className="font-mono text-slate-800">
                  {formatINR(Math.max(0, rider.codCashInHand - amount))}
                </strong>
              </p>
            </div>

            {/* Deposit Outlet Counter */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Receiving Store Counter / Outlet *
              </label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} ({outlet.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Covered Orders Notice */}
            {riderCodOrders.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Covered Delivered Orders ({riderCodOrders.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {riderCodOrders.map((o) => (
                    <span
                      key={o.id}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] font-bold text-slate-700"
                    >
                      {o.id}: {formatINR(o.finalTotal)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Cashier Handover Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Physical currency counted at counter 2, all 500/200 notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Generate Submission &amp; QR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
