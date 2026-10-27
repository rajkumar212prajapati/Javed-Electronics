import React, { useState } from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  X,
  Banknote,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  User,
  Truck,
  AlertCircle,
} from 'lucide-react';

interface CodCollectionModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CodCollectionModal: React.FC<CodCollectionModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { recordCodCollection, currentUser } = useStore();

  const [paymentMode, setPaymentMode] = useState<'cash' | 'doorstep_upi_qr'>('cash');
  const [collectorName, setCollectorName] = useState(
    order.dispatchDetails?.riderName ||
    order.deliveryStaffName ||
    order.dispatchDetails?.carrier ||
    currentUser.name ||
    'Delivery Executive'
  );
  const [collectedAmount, setCollectedAmount] = useState<number>(order.finalTotal);
  const [referenceNotes, setReferenceNotes] = useState('Collected and verified in full at customer doorstep');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectedAmount <= 0) {
      setErrorMsg('Collected amount must be greater than zero.');
      return;
    }

    const res = recordCodCollection(
      order.id,
      collectedAmount,
      paymentMode,
      collectorName,
      referenceNotes
    );

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Record COD Payment Collection
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Order: {order.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Amount Due Card */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                Total COD Amount Due
              </span>
              <span className="text-2xl font-black text-slate-950 font-mono">
                {formatINR(order.finalTotal)}
              </span>
            </div>
            <div className="text-right text-[11px] text-amber-900">
              <span className="block font-semibold">{order.customer.name}</span>
              <span className="text-amber-700">{order.customer.phone}</span>
            </div>
          </div>

          {/* Payment Method Selected at Doorstep */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Doorstep Payment Mode Received *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer font-bold transition-all ${
                  paymentMode === 'cash'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-600" />
                <span>Physical Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('doorstep_upi_qr')}
                className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer font-bold transition-all ${
                  paymentMode === 'doorstep_upi_qr'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Doorstep UPI QR</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Actual Amount Collected (₹) *</label>
            <input
              type="number"
              required
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Collected By (Rider / Courier Partner) *</label>
            <input
              type="text"
              required
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              placeholder="e.g. Ramesh Kumar (Rider) or Shiprocket Courier"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Receipt / Verification Note</label>
            <input
              type="text"
              value={referenceNotes}
              onChange={(e) => setReferenceNotes(e.target.value)}
              placeholder="e.g. Cash counted and handed over to store manager"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Payment & Mark Delivered</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
