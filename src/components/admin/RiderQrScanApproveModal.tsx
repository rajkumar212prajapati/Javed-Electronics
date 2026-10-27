import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { RiderRemittanceSubmission } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Banknote,
  KeyRound,
  Search,
  Printer,
} from 'lucide-react';

interface RiderQrScanApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedRemittance?: RiderRemittanceSubmission | null;
  onSuccess?: () => void;
}

const formatEightDigitCode = (code: string): string => {
  const digits = code.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  }
  return code;
};

export const RiderQrScanApproveModal: React.FC<RiderQrScanApproveModalProps> = ({
  isOpen,
  onClose,
  preSelectedRemittance,
  onSuccess,
}) => {
  const {
    riderRemittances,
    approveRiderCashRemittance,
    rejectRiderCashRemittance,
    currentUser,
    currentRole,
  } = useStore();

  const [inputCode, setInputCode] = useState<string>(preSelectedRemittance?.remittanceCode || '');
  const [selectedSubmission, setSelectedSubmission] = useState<RiderRemittanceSubmission | null>(
    preSelectedRemittance || null
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [approverName, setApproverName] = useState<string>(
    `${currentUser.name} (${currentRole.replace('_', ' ')})`
  );
  const [approvalNotes, setApprovalNotes] = useState<string>(
    '8-digit code verified and physical cash collected into store drawer.'
  );
  const [cashVerifiedCheckbox, setCashVerifiedCheckbox] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<RiderRemittanceSubmission | null>(null);

  useEffect(() => {
    if (preSelectedRemittance) {
      setSelectedSubmission(preSelectedRemittance);
      setInputCode(preSelectedRemittance.remittanceCode);
      setLookupError(null);
    }
  }, [preSelectedRemittance]);

  if (!isOpen) return null;

  const pendingSubmissions = riderRemittances.filter((r) => r.status === 'pending_approval');

  const handleLookupByCode = (codeOverride?: string) => {
    const raw = (codeOverride ?? inputCode).trim().replace(/\s+/g, '');
    if (!raw) return;
    setLookupError(null);

    const found = riderRemittances.find(
      (r) =>
        r.remittanceCode.replace(/\s+/g, '').toLowerCase() === raw.toLowerCase() ||
        r.id.trim().toLowerCase() === raw.toLowerCase()
    );
    if (found) {
      setSelectedSubmission(found);
    } else {
      setSelectedSubmission(null);
      setLookupError(
        `No pending or past cash deposit found for 8-digit code "${inputCode}". Please check the 8-digit code created in the Rider Portal.`
      );
    }
  };

  const handleApprove = () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);

    const res = approveRiderCashRemittance(
      selectedSubmission.remittanceCode || selectedSubmission.id,
      approverName || 'Store Cashier',
      approvalNotes
    );

    setIsProcessing(false);
    if (res.success) {
      setCompletedReceipt(
        res.remittance || {
          ...selectedSubmission,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: approverName,
          approvalNotes,
        }
      );
      if (onSuccess) onSuccess();
    } else {
      setLookupError(res.message);
    }
  };

  const handleReject = () => {
    if (!selectedSubmission) return;
    rejectRiderCashRemittance(
      selectedSubmission.id,
      approvalNotes || 'Currency notes mismatch / rejected at counter',
      approverName
    );
    setSelectedSubmission(null);
    if (onSuccess) onSuccess();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Enter 8-Digit Rider Code &amp; Approve Cash Collected
              </h3>
              <p className="text-xs text-slate-500">
                Verify rider&apos;s 8-digit deposit code, confirm cash amount, and issue receipt
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

        {/* View 1: Receipt after Approval */}
        {completedReceipt ? (
          <div className="py-5 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">
                8-Digit Code Verified — Cash Collected &amp; Approved!
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Rider&apos;s cash in hand deducted. Store register cash drawer credited.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-left space-y-1.5 max-w-sm mx-auto shadow-xs">
              <div className="text-center font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider">
                Store Cash Deposit Receipt
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">8-Digit Code:</span>
                <span className="font-black text-indigo-700">
                  {formatEightDigitCode(completedReceipt.remittanceCode)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Ref:</span>
                <span className="font-bold text-slate-900">
                  {completedReceipt.receiptNumber || completedReceipt.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rider Name:</span>
                <span className="font-bold text-slate-900">{completedReceipt.riderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cash Approved:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatINR(completedReceipt.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold uppercase text-slate-800">
                  {completedReceipt.submissionMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiving Counter:</span>
                <span className="font-bold text-slate-900">{completedReceipt.outletName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Approved By:</span>
                <span className="font-bold text-slate-900">{completedReceipt.approvedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="text-slate-700">
                  {new Date(completedReceipt.approvedAt || '').toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Enter 8-Digit Code or Select Pending Submission & Approve */
          <div className="py-4 space-y-4 text-xs">
            {/* 8-Digit Code Lookup Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                Enter 8-Digit Cash Deposit Code Created by Rider
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter 8-digit code (e.g. 83921056)"
                    value={inputCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputCode(val);
                      const clean = val.replace(/\s+/g, '');
                      if (clean.length === 8) {
                        handleLookupByCode(clean);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-black text-slate-900 tracking-widest focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupByCode()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify Code</span>
                </button>
              </div>
              {lookupError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-[11px] font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {/* Pending 8-Digit Codes Queue */}
            {pendingSubmissions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Active Pending 8-Digit Deposit Codes ({pendingSubmissions.length}) — Click to Auto-Fill
                </span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {pendingSubmissions.map((sub) => {
                    const isSelected = selectedSubmission?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setInputCode(sub.remittanceCode);
                          setLookupError(null);
                        }}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                            : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{sub.riderName}</span>
                            <span className="text-[11px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 tracking-wider">
                              {formatEightDigitCode(sub.remittanceCode)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {sub.outletName} •{' '}
                            {sub.submissionMethod === 'cash_deposit' ? 'Cash Deposit' : 'UPI QR'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-emerald-700 text-sm">
                            {formatINR(sub.amount)}
                          </div>
                          <span className="text-[10px] text-indigo-600 font-bold hover:underline">
                            {isSelected ? '✓ Selected' : 'Select Code →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Submission Approval Card */}
            {selectedSubmission && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Verified 8-Digit Cash Deposit Request
                    </span>
                    <div className="font-black text-slate-900 text-base mt-0.5">
                      {selectedSubmission.riderName}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Phone: {selectedSubmission.riderPhone} • Outlet: {selectedSubmission.outletName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">8-Digit Code</span>
                    <span className="font-mono text-lg font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 tracking-wider">
                      {formatEightDigitCode(selectedSubmission.remittanceCode)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Specific Cash Amount to Approve:</span>
                  <span className="font-mono text-xl font-black text-emerald-700">
                    {formatINR(selectedSubmission.amount)}
                  </span>
                </div>

                {selectedSubmission.notes && (
                  <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-emerald-100">
                    <strong>Rider Note:</strong> {selectedSubmission.notes}
                  </div>
                )}

                {/* Cashier Name and Verification */}
                <div className="space-y-2 pt-2 border-t border-emerald-200/80">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Store Manager / Admin Approver Name *
                    </label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Approval Remarks
                    </label>
                    <input
                      type="text"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="e.g. 8-digit code matched, physical cash verified in counter drawer"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={cashVerifiedCheckbox}
                      onChange={(e) => setCashVerifiedCheckbox(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-bold text-slate-800 text-[11px]">
                      I confirm cash of {formatINR(selectedSubmission.amount)} against code{' '}
                      <strong className="font-mono">
                        {formatEightDigitCode(selectedSubmission.remittanceCode)}
                      </strong>{' '}
                      is collected.
                    </span>
                  </label>
                </div>

                {/* Approval Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold cursor-pointer"
                  >
                    Reject Code
                  </button>

                  <button
                    type="button"
                    disabled={
                      !cashVerifiedCheckbox ||
                      isProcessing ||
                      selectedSubmission.status === 'approved'
                    }
                    onClick={handleApprove}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {selectedSubmission.status === 'approved'
                        ? 'Already Approved'
                        : `Approve Cash Collected (${formatINR(selectedSubmission.amount)})`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
