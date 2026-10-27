import React, { useState } from 'react';
import { POSShiftSession } from '../../../types/pos';
import { formatINR } from '../../../utils/currency';
import {
  Banknote,
  Clock,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface POSShiftModalProps {
  session: POSShiftSession;
  onCloseShift: (actualCashCounted: number, notes?: string) => void;
  onUpdateOpeningFloat: (newFloat: number) => void;
  onClose: () => void;
}

export const POSShiftModal: React.FC<POSShiftModalProps> = ({
  session,
  onCloseShift,
  onUpdateOpeningFloat,
  onClose,
}) => {
  const [cashCounted, setCashCounted] = useState<string>('');
  const [cashierNotes, setCashierNotes] = useState<string>('');
  const [editingFloat, setEditingFloat] = useState<boolean>(false);
  const [newFloatValue, setNewFloatValue] = useState<string>(session.openingFloat.toString());

  const expectedCashInDrawer = session.openingFloat + session.cashSales;
  const countedNum = parseFloat(cashCounted) || 0;
  const cashDifference = countedNum > 0 ? countedNum - expectedCashInDrawer : 0;

  const handlePrintZReport = () => {
    window.print();
  };

  const handleCompleteClose = () => {
    onCloseShift(countedNum, cashierNotes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">POS Cash Register & Shift Reconciliation</h3>
              <p className="text-[11px] text-slate-400">
                Register: {session.registerId} • Outlet: {session.outletName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Shift Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Cashier On Duty</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                {session.cashierName}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Shift Started</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Shift Status</span>
              <span
                className={`inline-flex items-center gap-1 font-bold text-xs mt-0.5 px-2 py-0.5 rounded ${
                  session.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{session.status.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* Revenue by Tender Mode */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Shift Tender Breakdown</span>
              <span className="text-slate-500 font-normal text-[11px]">
                {session.totalTransactions} Bills Generated
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mb-1">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Physical Cash</span>
                </div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {formatINR(session.cashSales)}
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold mb-1">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  <span>UPI / QR Sales</span>
                </div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {formatINR(session.upiSales)}
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Card POS (EDC)</span>
                </div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {formatINR(session.cardSales)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
              <span className="text-slate-700">Total Counter Revenue:</span>
              <span className="text-base text-blue-700 font-black font-mono">
                {formatINR(session.cashSales + session.upiSales + session.cardSales)}
              </span>
            </div>
          </div>

          {/* Cash Drawer Reconciliation */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>Cash Drawer Physical Audit</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>Opening Cash Float:</span>
                {editingFloat ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newFloatValue}
                      onChange={(e) => setNewFloatValue(e.target.value)}
                      className="w-20 px-2 py-0.5 border border-slate-300 rounded font-mono text-xs"
                    />
                    <button
                      onClick={() => {
                        onUpdateOpeningFloat(parseFloat(newFloatValue) || 0);
                        setEditingFloat(false);
                      }}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold">{formatINR(session.openingFloat)}</span>
                    <button
                      onClick={() => setEditingFloat(true)}
                      className="text-[10px] text-blue-600 underline cursor-pointer"
                    >
                      Edit Float
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span>Total Cash Sales Inflow:</span>
                <span className="font-mono font-bold text-emerald-700">+{formatINR(session.cashSales)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-amber-200 font-bold text-slate-900">
                <span>Expected Physical Cash in Drawer:</span>
                <span className="font-mono text-sm text-slate-900">{formatINR(expectedCashInDrawer)}</span>
              </div>
            </div>

            {/* Actual count input */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-800 block mb-1">
                Actual Physical Cash Counted at Counter (₹):
              </label>
              <input
                type="number"
                placeholder={`e.g. ${expectedCashInDrawer}`}
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />

              {countedNum > 0 && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs flex items-center justify-between font-bold ${
                    cashDifference === 0
                      ? 'bg-emerald-100 text-emerald-900'
                      : cashDifference > 0
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {cashDifference === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      {cashDifference === 0
                        ? 'Cash Balanced: Exact match with physical count!'
                        : cashDifference > 0
                        ? `Cash Surplus: ${formatINR(cashDifference)} extra in drawer`
                        : `Cash Shortage: ${formatINR(Math.abs(cashDifference))} short in drawer`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Cashier Handover Notes (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. ₹500 kept aside for evening courier payment"
                value={cashierNotes}
                onChange={(e) => setCashierNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <button
            onClick={handlePrintZReport}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Z-Report (Shift Summary)</span>
          </button>

          <button
            onClick={handleCompleteClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>End Shift & Reconcile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
