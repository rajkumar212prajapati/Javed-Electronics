import React, { useState } from 'react';
import { Order, CancelItemRequest, ItemCancellationReason, ItemCancellationDisposition } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  X,
  AlertTriangle,
  PackageX,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Clock,
  Sparkles,
  HelpCircle,
  CreditCard,
  Banknote,
  Minus,
  Plus,
} from 'lucide-react';

interface StoreOrderCancellationModalProps {
  order: Order;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ItemCancelState {
  productId: string;
  cancelQuantity: number;
  reason: ItemCancellationReason;
  disposition: ItemCancellationDisposition;
  note: string;
}

export const StoreOrderCancellationModal: React.FC<StoreOrderCancellationModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const { cancelOrderOrItems, currentUser, settings } = useStore();

  // Initialize cancellation states for each item in the order
  const [itemStates, setItemStates] = useState<Record<string, ItemCancelState>>(() => {
    const initial: Record<string, ItemCancelState> = {};
    order.items.forEach((item) => {
      const activeQty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
      initial[item.productId] = {
        productId: item.productId,
        cancelQuantity: 0,
        reason: 'short_stock',
        disposition: 'stock_discrepancy',
        note: '',
      };
    });
    return initial;
  });

  const [generalNotes, setGeneralNotes] = useState('');
  const [primaryReason, setPrimaryReason] = useState<ItemCancellationReason>('short_stock');
  const [staffName, setStaffName] = useState(currentUser.name || 'Store Fulfillment Lead');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick preset: Cancel entire order
  const handleCancelEntireOrder = (reason: ItemCancellationReason = 'short_stock') => {
    setPrimaryReason(reason);
    const updated: Record<string, ItemCancelState> = {};
    order.items.forEach((item) => {
      const activeQty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
      let defaultDisposition: ItemCancellationDisposition = 'stock_discrepancy';
      if (reason === 'damaged') defaultDisposition = 'scrap_damaged';
      if (reason === 'expired') defaultDisposition = 'write_off_expired';
      if (reason === 'customer_request') defaultDisposition = 'restocked';

      updated[item.productId] = {
        productId: item.productId,
        cancelQuantity: activeQty,
        reason,
        disposition: defaultDisposition,
        note: `Full order cancelled due to store ${reason.replace('_', ' ')}`,
      };
    });
    setItemStates(updated);
  };

  // Reset all selections
  const handleResetSelections = () => {
    const reset: Record<string, ItemCancelState> = {};
    order.items.forEach((item) => {
      reset[item.productId] = {
        productId: item.productId,
        cancelQuantity: 0,
        reason: 'short_stock',
        disposition: 'stock_discrepancy',
        note: '',
      };
    });
    setItemStates(reset);
    setErrorMsg(null);
  };

  // Update specific item cancel quantity
  const handleQuantityChange = (productId: string, newQty: number) => {
    const item = order.items.find((i) => i.productId === productId);
    if (!item) return;

    const maxActive = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
    const clamped = Math.max(0, Math.min(newQty, maxActive));

    setItemStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        cancelQuantity: clamped,
      },
    }));
  };

  // Update reason with intelligent disposition selection
  const handleReasonChange = (productId: string, reason: ItemCancellationReason) => {
    let disposition: ItemCancellationDisposition = 'stock_discrepancy';
    if (reason === 'damaged') disposition = 'scrap_damaged';
    else if (reason === 'expired') disposition = 'write_off_expired';
    else if (reason === 'customer_request') disposition = 'restocked';

    setItemStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reason,
        disposition,
      },
    }));
  };

  // Calculate live preview totals
  const totalUnitsToCancel = Object.values(itemStates).reduce((sum, s) => sum + s.cancelQuantity, 0);

  const { estimatedNewTotal, estimatedRefund, totalActiveItemsRemaining } = React.useMemo(() => {
    let remainingSubtotal = 0;
    let activeItemsCount = 0;

    order.items.forEach((item) => {
      const activeQty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
      const willCancel = itemStates[item.productId]?.cancelQuantity || 0;
      const remainingQty = Math.max(0, activeQty - willCancel);

      if (remainingQty > 0) {
        remainingSubtotal += remainingQty * item.unitPrice;
        activeItemsCount += remainingQty;
      }
    });

    if (activeItemsCount === 0) {
      return {
        estimatedNewTotal: 0,
        estimatedRefund: order.finalTotal,
        totalActiveItemsRemaining: 0,
      };
    }

    // Rough preview of discount/delivery
    let estDelivery = order.deliveryType === 'store_pickup' ? 0 : order.deliveryFee;
    if (remainingSubtotal >= settings.freeDeliveryThreshold) {
      estDelivery = 0;
    }

    let estCoupon = order.couponDiscount;
    if (estCoupon > 0 && order.subtotal > 0) {
      estCoupon = Math.round((estCoupon * (remainingSubtotal / order.subtotal)) * 100) / 100;
    }

    const estTotal = Math.max(0, remainingSubtotal - estCoupon + estDelivery);
    const estRefund = Math.max(0, order.finalTotal - estTotal);

    return {
      estimatedNewTotal: estTotal,
      estimatedRefund: estRefund,
      totalActiveItemsRemaining: activeItemsCount,
    };
  }, [itemStates, order, settings]);

  const handleSubmit = () => {
    if (totalUnitsToCancel === 0) {
      setErrorMsg('Please specify at least 1 unit quantity or item to cancel.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const cancellationRequests: CancelItemRequest[] = Object.values(itemStates)
      .filter((s) => s.cancelQuantity > 0)
      .map((s) => ({
        productId: s.productId,
        cancelQuantity: s.cancelQuantity,
        reason: s.reason,
        disposition: s.disposition,
        note: s.note,
      }));

    try {
      const result = cancelOrderOrItems(order.id, cancellationRequests, {
        cancelledBy: staffName.trim() || 'Store Manager',
        generalNotes: generalNotes.trim() || undefined,
        primaryReason,
      });

      if (!result.success) {
        setErrorMsg(result.message);
        setIsSubmitting(false);
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while executing order cancellation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <PackageX className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Store Order Cancellation & SKU Adjustment
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/30 text-rose-300 border border-rose-400/30">
                  {order.id}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cancel full order or specific line item quantities due to store shortage, damages, or expiry.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Meta Bar */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Customer: <strong className="text-slate-900">{order.customer.name}</strong> ({order.customer.phone})
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Mode: <strong className="text-slate-900">{order.deliveryType === 'store_pickup' ? 'Store Pickup' : 'Express Courier'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span>
              Original Bill: <strong>{formatINR(order.originalTotal || order.finalTotal)}</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                order.paymentMethod === 'cod'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (UPI / Card)'}
            </span>
          </div>
        </div>

        {/* Quick Action Presets Bar */}
        <div className="px-4 py-2 bg-rose-50/60 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Quick Fulfillment Presets:</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCancelEntireOrder('short_stock')}
              className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              📦 Cancel All (Shortage)
            </button>
            <button
              type="button"
              onClick={() => handleCancelEntireOrder('damaged')}
              className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              ⚠️ Cancel All (Damaged)
            </button>
            <button
              type="button"
              onClick={() => handleCancelEntireOrder('expired')}
              className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              ⏳ Cancel All (Expired)
            </button>
            <button
              type="button"
              onClick={handleResetSelections}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Line Items List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select SKUs and Quantities to Cancel ({order.items.length} Line Items)
            </h3>

            <div className="space-y-3">
              {order.items.map((item) => {
                const state = itemStates[item.productId] || {
                  productId: item.productId,
                  cancelQuantity: 0,
                  reason: 'short_stock',
                  disposition: 'stock_discrepancy',
                  note: '',
                };

                const activeQty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
                const isFullyCancelled = activeQty === 0;
                const isItemMarkedForCancellation = state.cancelQuantity > 0;
                const remainingQty = Math.max(0, activeQty - state.cancelQuantity);

                return (
                  <div
                    key={item.productId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFullyCancelled
                        ? 'bg-slate-100 border-slate-200 opacity-60'
                        : isItemMarkedForCancellation
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Product Details */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {item.productName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-mono">SKU: {item.sku}</span>
                            <span>•</span>
                            <span>Brand: {item.brand}</span>
                            {item.variant && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-700 font-semibold">Variant: {item.variant}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="font-mono font-semibold text-slate-900">
                              Unit Price: {formatINR(item.unitPrice)}
                            </span>
                          </div>

                          {/* Inventory / Active Qty status badge */}
                          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                            <span className="text-slate-600">
                              Ordered Qty: <strong>{item.quantity}</strong>
                            </span>
                            {item.cancelledQuantity && item.cancelledQuantity > 0 && (
                              <span className="text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                                Prev. Cancelled: {item.cancelledQuantity}
                              </span>
                            )}
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                              Current Active: {activeQty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cancel Quantity Controls */}
                      {!isFullyCancelled && (
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-600 font-medium sm:hidden">Cancel Qty:</span>
                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, state.cancelQuantity - 1)}
                                disabled={state.cancelQuantity <= 0}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                aria-label="Decrease cancel quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={activeQty}
                                value={state.cancelQuantity}
                                onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value))}
                                className="w-12 text-center text-xs font-mono font-bold py-1 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, state.cancelQuantity + 1)}
                                disabled={state.cancelQuantity >= activeQty}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                aria-label="Increase cancel quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.productId, activeQty)}
                              className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                            >
                              Cancel All ({activeQty})
                            </button>
                            {state.cancelQuantity > 0 && (
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, 0)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cancellation Parameters (Only shown if cancel quantity > 0) */}
                    {isItemMarkedForCancellation && (
                      <div className="mt-3 pt-3 border-t border-rose-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in duration-150">
                        {/* Reason */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Cancellation Reason *
                          </label>
                          <select
                            value={state.reason}
                            onChange={(e) =>
                              handleReasonChange(item.productId, e.target.value as ItemCancellationReason)
                            }
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 font-medium"
                          >
                            <option value="short_stock">📦 Store Stock Shortage</option>
                            <option value="damaged">⚠️ Damaged / Defective Stock</option>
                            <option value="expired">⏳ Expired / Past Shelf Life</option>
                            <option value="customer_request">👤 Customer Request</option>
                            <option value="pricing_discrepancy">🏷️ Pricing / Barcode Error</option>
                            <option value="other">⚙️ Other Store Reason</option>
                          </select>
                        </div>

                        {/* Physical Stock Disposition */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Physical Stock Disposition *
                          </label>
                          <select
                            value={state.disposition}
                            onChange={(e) =>
                              setItemStates((prev) => ({
                                ...prev,
                                [item.productId]: {
                                  ...prev[item.productId],
                                  disposition: e.target.value as ItemCancellationDisposition,
                                },
                              }))
                            }
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 font-medium"
                          >
                            <option value="stock_discrepancy">Sync Shortage (Deduct On-Hand)</option>
                            <option value="scrap_damaged">Write Off to Damaged Scrap</option>
                            <option value="write_off_expired">Write Off to Expired Scrap</option>
                            <option value="restocked">Return to Sellable Stock</option>
                          </select>
                        </div>

                        {/* Item Remarks */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Item Remarks / Shelf Note
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Broken seal, shortage on shelf"
                            value={state.note}
                            onChange={(e) =>
                              setItemStates((prev) => ({
                                ...prev,
                                [item.productId]: {
                                  ...prev[item.productId],
                                  note: e.target.value,
                                },
                              }))
                            }
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit & Staff Remarks Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Authorizing Store Staff Name *</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Staff / Store Manager Name"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Recorded permanently in the order audit trail and store compliance log.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">General Cancellation Notes for Customer</label>
              <input
                type="text"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="e.g. In-store quality audit found damaged packaging, refund applied"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Visible to the customer on their live tracking timeline and printable invoice.
              </span>
            </div>
          </div>

          {/* Real-time Financial Impact Calculation Box */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/90 to-blue-50/80 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Financial Reconciliation & Customer Impact</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-800 border border-indigo-200">
                Live Calculation
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Original Total</span>
                <span className="text-xs sm:text-sm font-extrabold font-mono text-slate-900 mt-0.5 block">
                  {formatINR(order.originalTotal || order.finalTotal)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">New Active Total</span>
                <span className="text-xs sm:text-sm font-extrabold font-mono text-indigo-700 mt-0.5 block">
                  {formatINR(estimatedNewTotal)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-rose-200 shadow-2xs bg-rose-50/30">
                <span className="text-[10px] font-semibold text-rose-700 block">Net Refund / Credit</span>
                <span className="text-xs sm:text-sm font-extrabold font-mono text-rose-700 mt-0.5 block">
                  {formatINR(estimatedRefund)}
                </span>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="p-2.5 bg-white rounded-lg border border-indigo-200/80 text-xs flex items-start gap-2">
              {order.paymentMethod === 'cod' ? (
                <>
                  <Banknote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-700 leading-snug">
                    <strong>Cash on Delivery (COD) Adjustment:</strong> The delivery partner or store pickup counter
                    will collect <strong className="text-emerald-700">{formatINR(estimatedNewTotal)}</strong> instead of{' '}
                    <span className="line-through text-slate-500">{formatINR(order.finalTotal)}</span>. No manual bank
                    refund is required.
                  </div>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-700 leading-snug">
                    <strong>Prepaid Payment (UPI / Card):</strong> A refund of{' '}
                    <strong className="text-rose-700">{formatINR(estimatedRefund)}</strong> will be processed back to the
                    customer's source payment method.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span>
              Action:{' '}
              <strong>
                {totalActiveItemsRemaining === 0
                  ? 'FULL Order Cancellation'
                  : totalUnitsToCancel > 0
                  ? `PARTIAL Cancellation (${totalUnitsToCancel} units removed, ${totalActiveItemsRemaining} units remain)`
                  : 'No changes selected'}
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || totalUnitsToCancel === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Executing Cancellation...</span>
              ) : (
                <>
                  <PackageX className="w-4 h-4" />
                  <span>
                    Confirm {totalActiveItemsRemaining === 0 ? 'Full Cancellation' : 'Partial Cancellation'} (
                    {formatINR(estimatedRefund)} refund)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
