import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ExpressCarrierName } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  X,
  Truck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Banknote,
  ShieldCheck,
  Check,
  Calendar,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CarrierCodSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCarrier?: ExpressCarrierName;
}

export const CarrierCodSettlementModal: React.FC<CarrierCodSettlementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCarrier = 'Shiprocket',
}) => {
  const {
    deliveryPartners,
    orders,
    recordCarrierCodSettlement,
    currentUser,
    currentRole,
  } = useStore();

  const [carrier, setCarrier] = useState<ExpressCarrierName>(defaultCarrier);
  const [bankUtrNumber, setBankUtrNumber] = useState<string>(
    `CMS${new Date().getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`
  );
  const [settlementDate, setSettlementDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [carrierDeductions, setCarrierDeductions] = useState<number>(120);
  const [reconciliationNotes, setReconciliationNotes] = useState<string>(
    'Verified with bank statement credit. Freight charges deducted by carrier.'
  );
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Eligible delivered COD orders for this carrier pending admin bank settlement
  const pendingCarrierOrders = useMemo(() => {
    return orders.filter((o) => {
      const isCarrierMatch = o.dispatchDetails?.carrier === carrier;
      const isCod = o.dispatchDetails?.isCod || o.paymentMethod === 'cod';
      const isDelivered = o.orderStatus === 'delivered';
      const isNotYetSettled = o.dispatchDetails?.codCollectedStatus !== 'settled_to_admin';
      return isCarrierMatch && isCod && isDelivered && isNotYetSettled;
    });
  }, [orders, carrier]);

  // Auto-select all pending orders when carrier changes
  React.useEffect(() => {
    if (pendingCarrierOrders.length > 0) {
      setSelectedOrderIds(pendingCarrierOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  }, [pendingCarrierOrders]);

  if (!isOpen) return null;

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === pendingCarrierOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingCarrierOrders.map((o) => o.id));
    }
  };

  // Financial calculations
  const grossCodCollected = pendingCarrierOrders
    .filter((o) => selectedOrderIds.includes(o.id))
    .reduce((sum, o) => sum + o.finalTotal, 0);

  const netAmountCredited = Math.max(0, grossCodCollected - Number(carrierDeductions || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankUtrNumber.trim()) {
      setErrorMessage('Please enter the Bank UTR / NEFT Reference number.');
      return;
    }

    if (selectedOrderIds.length === 0) {
      setErrorMessage('Please select at least one delivered order to settle.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const selectedAwbs = pendingCarrierOrders
      .filter((o) => selectedOrderIds.includes(o.id))
      .map((o) => o.dispatchDetails?.awbNumber || o.id);

    const res = recordCarrierCodSettlement({
      carrier,
      bankUtrNumber: bankUtrNumber.trim(),
      settlementDate,
      grossCodCollected,
      carrierDeductions: Number(carrierDeductions) || 0,
      netAmountCredited,
      orderIds: selectedOrderIds,
      awbNumbers: selectedAwbs,
      settledBy: `${currentUser.name} (${currentRole.replace('_', ' ')})`,
      reconciliationNotes,
    });

    setIsSubmitting(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Record Delivery Partner COD Settlement
              </h3>
              <p className="text-xs text-slate-500">
                Manually record and reconcile COD cash settled by Shiprocket or 3P carrier to Admin bank account
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

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-3.5 text-xs">
          {/* Partner & Bank UTR Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Express Carrier Partner *
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value as ExpressCarrierName)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
              >
                <option value="Shiprocket">Shiprocket Express</option>
                <option value="Delhivery">Delhivery</option>
                <option value="Shadowfax">Shadowfax</option>
                <option value="Blue Dart">Blue Dart</option>
                <option value="DTDC">DTDC</option>
                <option value="Porter">Porter</option>
                <option value="Other">Other Carrier</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Bank UTR / Payout Ref Number *
              </label>
              <input
                type="text"
                placeholder="e.g. CMS202610239912 or UTR78192039"
                value={bankUtrNumber}
                onChange={(e) => setBankUtrNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Settlement Date & Deductions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Bank Credit / Settlement Date *
              </label>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Carrier Freight &amp; Handling Deductions (₹)
              </label>
              <input
                type="number"
                min={0}
                value={carrierDeductions}
                onChange={(e) => setCarrierDeductions(Number(e.target.value))}
                placeholder="Shipping charges deducted by partner"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Pending Shipments Checklist */}
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100">
              <label className="font-bold text-slate-800">
                Select Shipments to Reconcile ({selectedOrderIds.length}/{pendingCarrierOrders.length})
              </label>
              {pendingCarrierOrders.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {selectedOrderIds.length === pendingCarrierOrders.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {pendingCarrierOrders.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                No delivered COD shipments awaiting settlement for {carrier}.
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {pendingCarrierOrders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  const awb = order.dispatchDetails?.awbNumber || 'AWB-Pending';
                  return (
                    <div
                      key={order.id}
                      onClick={() => toggleOrderSelection(order.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                        <div>
                          <div className="font-mono font-bold text-slate-900">
                            {order.id}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({order.customer.name})
                            </span>
                          </div>
                          <div className="text-[10px] text-indigo-700 font-mono">
                            AWB: {awb}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        {formatINR(order.finalTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Calculation Summary Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross COD Collected from Customers:</span>
              <span className="font-bold text-slate-900">{formatINR(grossCodCollected)}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Less Carrier Freight &amp; COD Fees:</span>
              <span>-{formatINR(carrierDeductions || 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Net Bank Credit to Admin:</span>
              <span className="text-emerald-700 font-black">{formatINR(netAmountCredited)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Bank Reconciliation Remarks
            </label>
            <input
              type="text"
              value={reconciliationNotes}
              onChange={(e) => setReconciliationNotes(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || selectedOrderIds.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Bank Settlement ({formatINR(netAmountCredited)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
